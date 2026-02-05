import Image from "next/image";
import type { CryptoData } from "@/app/types/crypto";

interface CryptoCardProps {
  crypto: CryptoData;
}

/**
 * Formatea un número como moneda USD
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

/**
 * Formatea un número grande de forma compacta
 */
function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatea una fecha ISO a formato legible
 */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CryptoCard({ crypto }: CryptoCardProps) {
  const isPositive = crypto.priceChange24h >= 0;

  return (
    <div className='flex flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900'>
      {/* Header con imagen y nombre */}
      <div className='flex items-center gap-3 mb-4'>
        <Image
          src={crypto.image}
          alt={`${crypto.name} logo`}
          width={48}
          height={48}
          className='rounded-full'
        />
        <div className='flex-1 min-w-0'>
          <h3 className='font-semibold text-zinc-900 dark:text-zinc-100 truncate'>
            {crypto.name}
          </h3>
          <p className='text-sm text-zinc-500 dark:text-zinc-400'>
            {crypto.symbol} • Rank #{crypto.marketCapRank}
          </p>
        </div>
      </div>

      {/* Precio y cambio 24h */}
      <div className='flex items-baseline justify-between mb-3'>
        <span className='text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
          {formatCurrency(crypto.price)}
        </span>
        <span
          className={`text-sm font-medium px-2 py-1 rounded-full ${
            isPositive
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {isPositive ? "↑" : "↓"} {Math.abs(crypto.priceChange24h).toFixed(2)}%
        </span>
      </div>

      {/* Market Cap */}
      <div className='flex justify-between text-sm mb-2'>
        <span className='text-zinc-500 dark:text-zinc-400'>Market Cap</span>
        <span className='font-medium text-zinc-700 dark:text-zinc-300'>
          ${formatCompact(crypto.marketCap)}
        </span>
      </div>

      {/* Última actualización */}
      <div className='pt-3 border-t border-zinc-100 dark:border-zinc-800'>
        <p className='text-xs text-zinc-400 dark:text-zinc-500'>
          Actualizado: {formatDate(crypto.lastUpdated)}
        </p>
      </div>
    </div>
  );
}
