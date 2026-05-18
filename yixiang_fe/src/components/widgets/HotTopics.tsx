import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

const TOPICS = [
  { name: 'A股大盘走势', heat: 23410 },
  { name: '量化交易策略', heat: 18903 },
  { name: '价值投资选股', heat: 15672 },
  { name: '可转债套利',   heat: 12345 },
  { name: 'ETF定投策略',  heat: 8901 },
  { name: '财报分析技巧', heat: 7562 },
];

const rankColors = ['text-red-500', 'text-orange-500', 'text-amber-500'];

export default function HotTopics() {
  const navigate = useNavigate();

  return (
    <div className="card-base overflow-hidden">
      <div className="section-title flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4 text-primary" />
        热门话题
      </div>
      <div className="px-3 pb-3 space-y-0.5">
        {TOPICS.map((t, i) => (
          <button
            key={t.name}
            onClick={() => navigate(`/search?q=${encodeURIComponent(t.name)}`)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted text-left transition-colors"
          >
            <span className={`w-5 text-center text-sm font-bold shrink-0 ${rankColors[i] || 'text-muted-foreground'}`}>
              {i + 1}
            </span>
            <span className="flex-1 text-sm text-foreground truncate">{t.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">{(t.heat / 10000).toFixed(1)}w</span>
          </button>
        ))}
      </div>
    </div>
  );
}
