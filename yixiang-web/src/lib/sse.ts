import { useEffect, useRef } from 'react';
import { env } from './env';

export interface UseSSEOptions {
  url: string;
  withCredentials?: boolean;
  enabled?: boolean;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onOpen?: () => void;
}

export function buildSseUrl(path: string, accessToken: string | null): string {
  const base = env.apiBaseUrl.endsWith('/') ? env.apiBaseUrl.slice(0, -1) : env.apiBaseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const fullPath = base.endsWith('/api') && (normalizedPath === '/api' || normalizedPath.startsWith('/api/'))
    ? `${base}${normalizedPath.slice('/api'.length)}`
    : `${base}${normalizedPath}`;
  const url = new URL(fullPath, window.location.origin);
  if (accessToken) url.searchParams.set('access_token', accessToken);
  if (base.startsWith('http')) return url.toString();
  return url.pathname + url.search + url.hash;
}

export function useSSE({ url, withCredentials = false, enabled = true, onMessage, onError, onOpen }: UseSSEOptions) {
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const full = url.startsWith('http') ? url : buildSseUrl(url, null);
    const source = new EventSource(full, { withCredentials });
    sourceRef.current = source;
    if (onMessage) source.onmessage = onMessage;
    if (onError) source.onerror = onError;
    if (onOpen) source.onopen = onOpen;
    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [url, withCredentials, enabled, onMessage, onError, onOpen]);

  return sourceRef;
}
