import type {
  CryptoMarketData,
  CryptoData,
  CoinGeckoSearchResult,
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

  // Mapeo de aliases comunes
  const aliases: Record<string, string> = {
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

  // Si hay una coincidencia exacta, usarla directamente
  const exactMatch = sortedResults.find(
    (coin) =>
      coin.id.toLowerCase() === normalizedQuery ||
      coin.symbol.toLowerCase() === normalizedQuery ||
      coin.name.toLowerCase() === normalizedQuery,
  );

  const targetId = exactMatch?.id || sortedResults[0].id;

  // Obtener datos del primer resultado (o coincidencia exacta)
  const crypto = await getCryptoByIdFast(targetId);
  if (crypto) {
    return { crypto };
  }

  // Si no se encontró, devolver sugerencias
  const topSuggestions = sortedResults.slice(0, 5).map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
  }));

  return { suggestions: topSuggestions };
}
