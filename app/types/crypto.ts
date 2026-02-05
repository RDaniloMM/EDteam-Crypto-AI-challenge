// Tipos para los datos de criptomonedas de Coingecko

/**
 * Datos de una criptomoneda del endpoint /coins/markets
 */
export interface CryptoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  last_updated: string;
}

/**
 * Datos normalizados de una criptomoneda para la UI
 */
export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  marketCap: number;
  marketCapRank: number;
  priceChange24h: number;
  lastUpdated: string;
  categories?: string[];
}

/**
 * Respuesta del endpoint /search
 */
export interface CoinGeckoSearchResult {
  coins: {
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number | null;
    thumb: string;
    large: string;
  }[];
}

/**
 * Categoría de CoinGecko del endpoint /coins/categories/list
 */
export interface CoinGeckoCategory {
  category_id: string;
  name: string;
}

/**
 * Detalle completo de una cripto del endpoint /coins/{id}
 */
export interface CoinGeckoDetailResponse {
  id: string;
  symbol: string;
  name: string;
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  market_data: {
    current_price: {
      usd: number;
    };
    market_cap: {
      usd: number;
    };
    market_cap_rank: number;
    price_change_percentage_24h: number;
  };
  last_updated: string;
}

/**
 * Resultado de la tool getTop10Cryptos
 */
export interface Top10Result {
  success: boolean;
  data?: CryptoData[];
  error?: string;
  source: "coingecko";
  timestamp: string;
}

/**
 * Resultado de la tool getCryptoByQuery
 */
export interface CryptoQueryResult {
  success: boolean;
  data?: CryptoData;
  suggestions?: { id: string; name: string; symbol: string }[];
  error?: string;
  source: "coingecko";
  timestamp: string;
}

/**
 * Resultado de la tool getCryptosByCategory
 */
export interface CryptosByCategoryResult {
  success: boolean;
  data?: CryptoData[];
  category?: string;
  error?: string;
  source: "coingecko";
  timestamp: string;
}

/**
 * Tipos para los mensajes del chat
 */
export type ToolResultType = "top10" | "crypto-detail";

export interface ToolResult {
  type: ToolResultType;
  data: Top10Result | CryptoQueryResult;
}
