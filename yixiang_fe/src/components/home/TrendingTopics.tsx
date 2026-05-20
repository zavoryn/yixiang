import { Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

const topics = [
  { name: "A股大盘走势", heat: 2341, trend: "up" as const },
  { name: "量化交易策略", heat: 1890, trend: "up" as const },
  { name: "价值投资选股", heat: 1567, trend: "up" as const },
  { name: "可转债套利", heat: 1234, trend: "down" as const },
  { name: "ETF定投策略", heat: 890, trend: "up" as const },
  { name: "财报分析技巧", heat: 756, trend: "neutral" as const }
];

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus
};

const trendColors = {
  up: "text-emerald-500",
  down: "text-red-500",
  neutral: "text-slate-400"
};

export default function TrendingTopics() {
  return (
    <motion.div
      className="bg-card rounded-xl border border-border p-4 card-shadow"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-amber-500" />
        <h3 className="font-semibold text-foreground text-sm">热门话题</h3>
      </div>
      <div className="space-y-2.5">
        {topics.map((topic, i) => {
          const TrendIcon = trendIcons[topic.trend];
          return (
            <div key={i} className="flex items-center gap-3 group cursor-pointer">
              <span className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center shrink-0 ${
                i < 3 ? "bg-primary text-primary-foreground" : "bg-slate-100 text-muted-foreground"
              }`}>
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-foreground group-hover:text-primary transition-colors truncate">
                {topic.name}
              </span>
              <TrendIcon className={`w-3.5 h-3.5 ${trendColors[topic.trend]}`} />
              <span className="text-xs text-muted-foreground">{topic.heat}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
