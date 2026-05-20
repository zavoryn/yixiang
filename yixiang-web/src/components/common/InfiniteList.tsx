import { useEffect, useRef, type ReactNode } from 'react';

export interface InfiniteListProps<T> {
  items: T[];
  getKey: (item: T) => string | number;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  renderItem: (item: T, index: number) => ReactNode;
  emptyState?: ReactNode;
  loadingIndicator?: ReactNode;
  endIndicator?: ReactNode;
  rootMargin?: string;
}

export function InfiniteList<T>({
  items,
  getKey,
  hasMore,
  isLoading,
  onLoadMore,
  renderItem,
  emptyState,
  loadingIndicator,
  endIndicator,
  rootMargin = '200px',
}: InfiniteListProps<T>) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onLoadMore();
          }
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, rootMargin]);

  if (items.length === 0 && !isLoading && !hasMore) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {items.map((item, i) => (
        <div key={getKey(item)}>{renderItem(item, i)}</div>
      ))}
      {isLoading && (
        <div data-testid="infinite-list-loading" className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">
          {loadingIndicator ?? '加载中...'}
        </div>
      )}
      {!hasMore && items.length > 0 && (
        <div className="py-6 text-center text-xs text-[var(--color-muted-foreground)]">
          {endIndicator ?? '— 到底啦 —'}
        </div>
      )}
      <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />
    </>
  );
}
