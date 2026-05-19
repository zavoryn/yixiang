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

export function useSSE({ url, withCredentials = false, enabled = true, onMessage, onError, onOpen }: UseSSEOptions) {
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const full = url.startsWith('http') ? url : `${env.apiBaseUrl}${url}`;
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
