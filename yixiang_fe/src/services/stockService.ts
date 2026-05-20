import { apiFetch } from "./apiClient";
import type { MarketIndex, StockQuote } from "@/types/stock";

export const stockService = {
  getMarketIndices(): Promise<MarketIndex[]> {
    return apiFetch("/api/v1/stock/market");
  },

  getQuote(code: string): Promise<StockQuote> {
    return apiFetch(`/api/v1/stock/quote?code=${code}`);
  },

  getQuotes(codes: string[]): Promise<StockQuote[]> {
    return apiFetch(`/api/v1/stock/quotes?codes=${codes.join(",")}`);
  },
};
