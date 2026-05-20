import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Heart, Bookmark, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { knowpostService } from "@/services/knowpostService";
import { toast } from "sonner";

type LikeFavBarProps = {
  entityId: string;
  initialLiked?: boolean;
  initialFaved?: boolean;
  initialLikeCount?: number;
  initialFavCount?: number;
  commentCount?: number;
  size?: "sm" | "lg";
};

function formatCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + "w";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

export default function LikeFavBar({
  entityId,
  initialLiked = false,
  initialFaved = false,
  initialLikeCount = 0,
  initialFavCount = 0,
  commentCount = 0,
  size = "sm",
}: LikeFavBarProps) {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(initialLiked);
  const [faved, setFaved] = useState(initialFaved);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [favCount, setFavCount] = useState(initialFavCount);
  const [likePop, setLikePop] = useState(false);
  const [favPop, setFavPop] = useState(false);

  const isLg = size === "lg";
  const iconCls = isLg ? "w-[22px] h-[22px]" : "w-5 h-5";
  const countCls = isLg ? "text-sm font-semibold" : "text-xs font-medium";
  const gap = isLg ? "gap-8" : "gap-5";

  const requireAuth = () => {
    if (!tokens?.accessToken) {
      toast.error("请先登录");
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleLike = async () => {
    if (!requireAuth()) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((prev) => (wasLiked ? Math.max(0, prev - 1) : prev + 1));
    if (!wasLiked) {
      setLikePop(true);
      setTimeout(() => setLikePop(false), 400);
    }
    try {
      await (wasLiked
        ? knowpostService.unlike(entityId, tokens!.accessToken)
        : knowpostService.like(entityId, tokens!.accessToken));
    } catch {
      setLiked(wasLiked);
      setLikeCount((prev) => (wasLiked ? prev + 1 : Math.max(0, prev - 1)));
      toast.error("操作失败");
    }
  };

  const handleFav = async () => {
    if (!requireAuth()) return;
    const wasFaved = faved;
    setFaved(!wasFaved);
    setFavCount((prev) => (wasFaved ? Math.max(0, prev - 1) : prev + 1));
    if (!wasFaved) {
      setFavPop(true);
      setTimeout(() => setFavPop(false), 400);
    }
    try {
      await (wasFaved
        ? knowpostService.unfav(entityId, tokens!.accessToken)
        : knowpostService.fav(entityId, tokens!.accessToken));
    } catch {
      setFaved(wasFaved);
      setFavCount((prev) => (wasFaved ? prev + 1 : Math.max(0, prev - 1)));
      toast.error("操作失败");
    }
  };

  const popScale = { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1.2, opacity: 1 }, exit: { scale: 1, opacity: 0 } };

  return (
    <div className={`flex items-center justify-center ${gap}`}>
      {/* 点赞 */}
      <button
        onClick={handleLike}
        className="group flex flex-col items-center gap-1 relative"
      >
        <span
          className={`
            inline-flex items-center justify-center rounded-full transition-all duration-200
            ${isLg ? "w-12 h-12" : "w-10 h-10"}
            ${liked
              ? "bg-red-50 text-red-500 shadow-sm shadow-red-100"
              : "bg-slate-50 text-slate-400 group-hover:bg-red-50 group-hover:text-red-400"
            }
          `}
        >
          <Heart className={`${iconCls} transition-all duration-200 ${liked ? "fill-current" : ""}`} />
          <AnimatePresence>
            {likePop && (
              <motion.span
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400"
                {...popScale}
                transition={{ duration: 0.35 }}
              />
            )}
          </AnimatePresence>
        </span>
        <span className={`${countCls} transition-colors duration-200 ${liked ? "text-red-500" : "text-slate-500"}`}>
          {formatCount(likeCount)}
        </span>
      </button>

      {/* 收藏 */}
      <button
        onClick={handleFav}
        className="group flex flex-col items-center gap-1 relative"
      >
        <span
          className={`
            inline-flex items-center justify-center rounded-full transition-all duration-200
            ${isLg ? "w-12 h-12" : "w-10 h-10"}
            ${faved
              ? "bg-amber-50 text-amber-500 shadow-sm shadow-amber-100"
              : "bg-slate-50 text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-400"
            }
          `}
        >
          <Bookmark className={`${iconCls} transition-all duration-200 ${faved ? "fill-current" : ""}`} />
          <AnimatePresence>
            {favPop && (
              <motion.span
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400"
                {...popScale}
                transition={{ duration: 0.35 }}
              />
            )}
          </AnimatePresence>
        </span>
        <span className={`${countCls} transition-colors duration-200 ${faved ? "text-amber-500" : "text-slate-500"}`}>
          {formatCount(favCount)}
        </span>
      </button>

      {/* 评论 */}
      <div className="flex flex-col items-center gap-1">
        <span
          className={`
            inline-flex items-center justify-center rounded-full
            ${isLg ? "w-12 h-12" : "w-10 h-10"}
            bg-blue-50 text-blue-500
          `}
        >
          <MessageCircle className={iconCls} />
        </span>
        <span className={`${countCls} text-blue-500`}>{formatCount(commentCount)}</span>
      </div>
    </div>
  );
}
