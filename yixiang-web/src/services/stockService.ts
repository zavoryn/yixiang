import { apiFetch } from '@/lib/apiClient';
import type { MarketIndex } from '@/types/stock';

export const stockService = {
  market(): Promise<MarketIndex[]> {
    return apiFetch<MarketIndex[]>('/api/v1/stock/market');
  },
};
