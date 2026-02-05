export function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

export function ChatSkeleton() {
  return (
    <div className='space-y-2'>
      <SkeletonLine className='h-4 w-3/4' />
      <SkeletonLine className='h-4 w-1/2' />
    </div>
  );
}
