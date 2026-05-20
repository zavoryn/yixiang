import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { stockService } from "@/services/stockService";
import type { MarketIndex } from "@/types/stock";

export default function MarketOverview() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stockService
      .getMarketIndices()
      .then((data) => setIndices(data))
      .catch(() => {})
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      stockService.getMarketIndices().then(setIndices).catch(() => {});
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (v: number) => v.toFixed(2);
  const formatPercent = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%";

  return (
    <motion.div
      className="grid grid-cols-3 gap-3"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {loading
        ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 card-shadow animate-pulse">
              <div className="h-4 w-16 bg-slate-200 rounded mb-2" />
              <div className="h-6 w-24 bg-slate-200 rounded mb-1" />
              <div className="h-3 w-12 bg-slate-200 rounded" />
            </div>
          ))
        : indices.map((idx) => {
            const isUp = idx.changePercent >= 0;
            const color = isUp ? "text-red-600 bg-red-50" : "text-emerald-600 bg-emerald-50";
            const numColor = isUp ? "text-red-600" : "text-emerald-600";
            const Icon = isUp ? TrendingUp : TrendingDown;

            return (
              <div key={idx.code} className="bg-card rounded-xl border border-border p-4 card-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{idx.name}</span>
                </div>
                <p className={`text-xl font-bold ${numColor}`}>
                  {formatPrice(idx.price)}
                </p>
                <p className={`text-xs mt-0.5 ${numColor}`}>
                  {formatPercent(idx.changePercent)}
                </p>
              </div>
            );
          })}
    </motion.div>
  );
}
