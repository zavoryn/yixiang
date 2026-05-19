import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InfiniteList } from './InfiniteList';

class IntersectionObserverMock {
  callback: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = '';
  thresholds: number[] = [];
}

(globalThis as any).IntersectionObserver = IntersectionObserverMock;

describe('InfiniteList', () => {
  it('renders all current items', () => {
    render(
      <InfiniteList
        items={['a', 'b', 'c']}
        getKey={(s) => s}
        hasMore={false}
        isLoading={false}
        onLoadMore={() => undefined}
        renderItem={(s) => <div>{s}</div>}
      />,
    );
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.getByText('c')).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    render(
      <InfiniteList
        items={[]}
        getKey={(s: string) => s}
        hasMore
        isLoading
        onLoadMore={() => undefined}
        renderItem={(s) => <div>{s}</div>}
      />,
    );
    expect(screen.getByTestId('infinite-list-loading')).toBeInTheDocument();
  });

  it('shows empty state when no items and not loading and no more', () => {
    render(
      <InfiniteList
        items={[]}
        getKey={(s: string) => s}
        hasMore={false}
        isLoading={false}
        onLoadMore={() => undefined}
        renderItem={(s) => <div>{s}</div>}
        emptyState={<div data-testid="empty">没有数据</div>}
      />,
    );
    expect(screen.getByTestId('empty')).toBeInTheDocument();
  });
});
