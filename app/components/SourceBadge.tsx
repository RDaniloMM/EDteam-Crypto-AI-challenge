interface SourceBadgeProps {
  source: string;
  timestamp: string;
}

export function SourceBadge({ source, timestamp }: SourceBadgeProps) {
  const formattedTime = new Date(timestamp).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className='flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-2'>
      <span className='flex items-center gap-1'>
        <svg
          className='w-3 h-3'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
        Fuente: {source === "coingecko" ? "CoinGecko" : source}
      </span>
      <span>•</span>
      <span>{formattedTime}</span>
    </div>
  );
}
