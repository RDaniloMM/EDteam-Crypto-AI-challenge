import Image from "next/image";
import type { CryptoData } from "@/app/types/crypto";

interface CryptoTableProps {
  cryptos: CryptoData[];
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

export function CryptoTable({ cryptos }: CryptoTableProps) {
  return (
    <div className='overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800'>
      <table className='w-full text-sm'>
        <thead className='bg-zinc-50 dark:bg-zinc-800/50'>
          <tr>
            <th className='text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-300'>
              #
            </th>
            <th className='text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-300'>
              Moneda
            </th>
            <th className='text-right py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-300'>
              Precio
            </th>
            <th className='text-right py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-300'>
              24h %
            </th>
            <th className='text-right py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-300 hidden sm:table-cell'>
              Market Cap
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-zinc-100 dark:divide-zinc-800'>
          {cryptos.map((crypto) => {
            const isPositive = crypto.priceChange24h >= 0;
            return (
              <tr
                key={crypto.id}
                className='bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors'
              >
                <td className='py-3 px-4 text-zinc-500 dark:text-zinc-400'>
                  {crypto.marketCapRank}
                </td>
                <td className='py-3 px-4'>
                  <div className='flex items-center gap-2'>
                    <Image
                      src={crypto.image}
                      alt={`${crypto.name} logo`}
                      width={24}
                      height={24}
                      className='rounded-full'
                    />
                    <div className='min-w-0'>
                      <span className='font-medium text-zinc-900 dark:text-zinc-100 block truncate'>
                        {crypto.name}
                      </span>
                      <span className='text-xs text-zinc-500 dark:text-zinc-400'>
                        {crypto.symbol}
                      </span>
                    </div>
                  </div>
                </td>
                <td className='py-3 px-4 text-right font-medium text-zinc-900 dark:text-zinc-100'>
                  {formatCurrency(crypto.price)}
                </td>
                <td className='py-3 px-4 text-right'>
                  <span
                    className={`font-medium ${
                      isPositive
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {crypto.priceChange24h.toFixed(2)}%
                  </span>
                </td>
                <td className='py-3 px-4 text-right text-zinc-600 dark:text-zinc-300 hidden sm:table-cell'>
                  ${formatCompact(crypto.marketCap)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
