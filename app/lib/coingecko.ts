import type {
  CryptoMarketData,
  CryptoData,
  CoinGeckoSearchResult,
  CoinGeckoCategory,
} from "@/app/types/crypto";

const COINGECKO_BASE_URL =
  process.env.COINGECKO_BASE_URL || "https://api.coingecko.com/api/v3";
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

/**
 * Construye la URL con la API key
 */
function buildUrl(
  endpoint: string,
  params: Record<string, string> = {},
): string {
  const url = new URL(`${COINGECKO_BASE_URL}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  if (COINGECKO_API_KEY) {
    url.searchParams.append("x_cg_demo_api_key", COINGECKO_API_KEY);
  }

  return url.toString();
}

/**
 * Normaliza los datos de mercado al formato de la UI
 */
function normalizeMarketData(data: CryptoMarketData): CryptoData {
  return {
    id: data.id,
    symbol: data.symbol.toUpperCase(),
    name: data.name,
    image: data.image,
    price: data.current_price,
    marketCap: data.market_cap,
    marketCapRank: data.market_cap_rank,
    priceChange24h: data.price_change_percentage_24h,
    lastUpdated: data.last_updated,
  };
}

/**
 * Obtiene las top 10 criptomonedas por market cap
 */
export async function getTop10Cryptos(): Promise<CryptoData[]> {
  const url = buildUrl("/coins/markets", {
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: "10",
    page: "1",
    sparkline: "false",
  });

  const response = await fetch(url, {
    next: { revalidate: 10 },
  });

  if (!response.ok) {
    throw new Error(
      `Coingecko API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: CryptoMarketData[] = await response.json();
  return data.map(normalizeMarketData);
}

/**
 * Obtiene datos de una criptomoneda por ID usando el endpoint markets (más rápido)
 */
export async function getCryptoByIdFast(
  id: string,
): Promise<CryptoData | null> {
  const url = buildUrl("/coins/markets", {
    vs_currency: "usd",
    ids: id,
    sparkline: "false",
  });

  const response = await fetch(url, {
    next: { revalidate: 10 },
  });

  if (!response.ok) {
    return null;
  }

  const data: CryptoMarketData[] = await response.json();
  if (data.length === 0) {
    return null;
  }

  return normalizeMarketData(data[0]);
}

/**
 * Busca criptomonedas por query (nombre, símbolo, etc.)
 */
export async function searchCrypto(
  query: string,
): Promise<CoinGeckoSearchResult["coins"]> {
  const url = buildUrl("/search", { query });

  const response = await fetch(url, {
    next: { revalidate: 60 }, // Busquedas cacheadas por 1 minuto
  });

  if (!response.ok) {
    throw new Error(
      `Coingecko API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: CoinGeckoSearchResult = await response.json();
  return data.coins;
}

/**
 * Obtiene el detalle de una criptomoneda por su ID (usa endpoint markets para mayor velocidad)
 */
export async function getCryptoById(id: string): Promise<CryptoData> {
  const crypto = await getCryptoByIdFast(id);

  if (!crypto) {
    throw new Error(`Criptomoneda no encontrada: ${id}`);
  }

  return crypto;
}

/**
 * Busca una cripto por query y devuelve su detalle
 * Optimizado para reducir llamadas a la API
 */
export async function getCryptoByQuery(query: string): Promise<{
  crypto?: CryptoData;
  suggestions?: { id: string; name: string; symbol: string }[];
  notFound?: boolean;
}> {
  const normalizedQuery = query.toLowerCase().trim();

  const aliases: Record<string, string> = {
    // Símbolos oficiales
    btc: "bitcoin",
    eth: "ethereum",
    sol: "solana",
    ada: "cardano",
    xrp: "ripple",
    doge: "dogecoin",
    dot: "polkadot",
    matic: "polygon-ecosystem-token",
    avax: "avalanche-2",
    link: "chainlink",
    uni: "uniswap",
    atom: "cosmos",
    ltc: "litecoin",
    bnb: "binancecoin",
    usdt: "tether",
    usdc: "usd-coin",
    busd: "binance-usd",
    shib: "shiba-inu",
    trx: "tron",
  };

  // Intentar con alias primero (muy rápido, una sola llamada)
  const aliasId = aliases[normalizedQuery];
  if (aliasId) {
    const crypto = await getCryptoByIdFast(aliasId);
    if (crypto) {
      return { crypto };
    }
  }

  // Intentar directamente con el query como ID
  const directCrypto = await getCryptoByIdFast(normalizedQuery);
  if (directCrypto) {
    return { crypto: directCrypto };
  }

  // Buscar en la API
  const searchResults = await searchCrypto(query);

  if (searchResults.length === 0) {
    return { notFound: true };
  }

  // Ordenar por market_cap_rank (las más relevantes primero)
  const sortedResults = searchResults.sort(
    (a, b) => (a.market_cap_rank || Infinity) - (b.market_cap_rank || Infinity),
  );

  // Buscar coincidencia exacta por nombre/símbolo/id
  const exactMatch = sortedResults.find(
    (coin) =>
      coin.id.toLowerCase() === normalizedQuery ||
      coin.symbol.toLowerCase() === normalizedQuery ||
      coin.name.toLowerCase() === normalizedQuery,
  );

  // Si hay coincidencia exacta, usarla
  if (exactMatch) {
    const crypto = await getCryptoByIdFast(exactMatch.id);
    if (crypto) {
      return { crypto };
    }
  }

  // Detectar ambigüedad: si el query es parte de múltiples nombres relevantes
  // Solo consideramos criptos con market cap rank (las importantes)
  const relevantMatches = sortedResults.filter((coin) => {
    const nameMatch = coin.name.toLowerCase().includes(normalizedQuery);
    const hasRank = coin.market_cap_rank && coin.market_cap_rank <= 500;
    return nameMatch && hasRank;
  });

  // Si hay más de una cripto relevante que contiene el término, mostrar sugerencias
  if (relevantMatches.length > 1) {
    const topSuggestions = relevantMatches.slice(0, 5).map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
    }));
    return { suggestions: topSuggestions };
  }

  // Si solo hay una relevante, usarla
  if (relevantMatches.length === 1) {
    const crypto = await getCryptoByIdFast(relevantMatches[0].id);
    if (crypto) {
      return { crypto };
    }
  }

  // Si no hay matches relevantes pero sí resultados, usar el primero por market cap
  const topResult = sortedResults[0];
  const crypto = await getCryptoByIdFast(topResult.id);
  if (crypto) {
    return { crypto };
  }

  // Último recurso: devolver sugerencias
  const topSuggestions = sortedResults.slice(0, 5).map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
  }));

  return { suggestions: topSuggestions };
}

/**
 * Obtiene la lista de categorías disponibles en CoinGecko
 */
export async function getCategories(): Promise<CoinGeckoCategory[]> {
  const url = buildUrl("/coins/categories/list");

  const response = await fetch(url, {
    next: { revalidate: 300 }, // Cache por 5 minutos
  });

  if (!response.ok) {
    throw new Error(
      `Coingecko API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Mapeo de nombres comunes de categorías a IDs de CoinGecko
 */
const categoryAliases: Record<string, string> = {
  "layer 1": "layer-1",
  "layer-1": "layer-1",
  l1: "layer-1",
  "layer 2": "layer-2",
  "layer-2": "layer-2",
  l2: "layer-2",
  defi: "decentralized-finance-defi",
  nft: "non-fungible-tokens-nft",
  nfts: "non-fungible-tokens-nft",
  meme: "meme-token",
  memes: "meme-token",
  memecoin: "meme-token",
  memecoins: "meme-token",
  gaming: "gaming",
  metaverse: "metaverse",
  ai: "artificial-intelligence",
  "inteligencia artificial": "artificial-intelligence",
  stablecoin: "stablecoins",
  stablecoins: "stablecoins",
  exchange: "exchange-based-tokens",
  dex: "decentralized-exchange",
  privacy: "privacy-coins",
  oracle: "oracle",
  storage: "storage",
  "smart contract": "smart-contract-platform",
  "smart contracts": "smart-contract-platform",
};

/**
 * Obtiene criptomonedas de una categoría específica
 */
export async function getCryptosByCategory(
  category: string,
  limit: number = 10,
): Promise<{
  cryptos?: CryptoData[];
  categoryName?: string;
  notFound?: boolean;
  suggestions?: string[];
}> {
  const normalizedCategory = category.toLowerCase().trim();

  // Intentar con alias primero
  let categoryId = categoryAliases[normalizedCategory] || normalizedCategory;

  // Obtener lista de categorías para validar
  const categories = await getCategories();

  // Buscar coincidencia exacta o parcial
  let matchedCategory = categories.find(
    (cat) =>
      cat.category_id === categoryId ||
      cat.name.toLowerCase() === normalizedCategory,
  );

  // Si no hay coincidencia exacta, buscar parcial
  if (!matchedCategory) {
    matchedCategory = categories.find(
      (cat) =>
        cat.category_id.includes(normalizedCategory) ||
        cat.name.toLowerCase().includes(normalizedCategory),
    );
  }

  if (!matchedCategory) {
    // Devolver sugerencias de categorías similares
    const suggestions = categories
      .filter(
        (cat) =>
          cat.name.toLowerCase().includes(normalizedCategory.substring(0, 3)) ||
          cat.category_id.includes(normalizedCategory.substring(0, 3)),
      )
      .slice(0, 5)
      .map((cat) => cat.name);

    return {
      notFound: true,
      suggestions:
        suggestions.length > 0
          ? suggestions
          : ["DeFi", "Layer 1", "Meme", "Gaming", "AI"],
    };
  }

  categoryId = matchedCategory.category_id;

  // Obtener criptos de la categoría
  const url = buildUrl("/coins/markets", {
    vs_currency: "usd",
    category: categoryId,
    order: "market_cap_desc",
    per_page: String(limit),
    page: "1",
    sparkline: "false",
  });

  const response = await fetch(url, {
    next: { revalidate: 30 }, // Cache por 30 segundos
  });

  if (!response.ok) {
    throw new Error(
      `Coingecko API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: CryptoMarketData[] = await response.json();

  if (data.length === 0) {
    return { notFound: true };
  }

  const cryptos = data.map((item) => ({
    ...normalizeMarketData(item),
    categories: [matchedCategory!.name],
  }));

  return { cryptos, categoryName: matchedCategory.name };
}
