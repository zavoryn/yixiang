import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Brain, Bot, ChevronRight, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const paths = [
  {
    title: "A股基本面分析",
    desc: "掌握财务报表分析与估值方法",
    icon: BookOpen,
    color: "from-blue-500 to-blue-600",
    progress: 35,
    query: "A股基本面分析"
  },
  {
    title: "量化交易入门",
    desc: "从策略设计到实盘交易的完整路径",
    icon: Brain,
    color: "from-emerald-500 to-emerald-600",
    progress: 12,
    query: "量化交易策略"
  },
  {
    title: "技术面分析",
    desc: "K线形态、指标分析与趋势判断",
    icon: Bot,
    color: "from-purple-500 to-purple-600",
    progress: 0,
    query: "技术面分析"
  }
];

export default function LearningPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">学习路径</h1>
        <p className="text-sm text-muted-foreground mt-1">选择感兴趣的领域，开始系统学习</p>
      </div>

      <div className="space-y-4">
        {paths.map((path, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <Card
              className="border-border cursor-pointer hover:card-shadow-hover transition-shadow overflow-hidden"
              onClick={() => navigate(`/search?q=${encodeURIComponent(path.query)}`)}
            >
              <CardContent className="p-0">
                <div className="flex items-center">
                  {/* Icon */}
                  <div className={`w-20 h-20 bg-gradient-to-br ${path.color} flex items-center justify-center shrink-0`}>
                    <path.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 min-w-0">
                    <h3 className="font-semibold text-foreground">{path.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{path.desc}</p>

                    {/* Progress */}
                    {path.progress > 0 ? (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">学习进度</span>
                          <span className="text-primary font-medium">{path.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${path.color} rounded-full transition-all`}
                            style={{ width: `${path.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-2">尚未开始</p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-muted-foreground mr-4 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Favorites Section */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-amber-500" />
          <h2 className="text-lg font-bold text-foreground">我的收藏</h2>
        </div>
        <div className="text-center py-10 text-muted-foreground">
          <Star className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">还没有收藏的内容</p>
          <Button
            variant="link"
            className="text-primary mt-2"
            onClick={() => navigate("/")}
          >
            去发现更多内容
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
