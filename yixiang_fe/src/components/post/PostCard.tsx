import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Bookmark, MessageCircle, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { FeedItem } from "@/types/knowpost";

type PostCardProps = {
  post: FeedItem;
  onLike?: (id: string) => void;
  onFav?: (id: string) => void;
};

const categoryColors: Record<string, string> = {
  analysis: "bg-blue-50 text-blue-700",
  tutorial: "bg-emerald-50 text-emerald-700",
  discussion: "bg-amber-50 text-amber-700",
  strategy: "bg-purple-50 text-purple-700"
};

const categoryLabels: Record<string, string> = {
  analysis: "分析",
  tutorial: "教程",
  discussion: "讨论",
  strategy: "策略"
};

function formatCount(n?: number): string {
  if (!n) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function PostCard({ post, onLike, onFav }: PostCardProps) {
  const tags = post.tags?.length ? post.tags : (post.tagJson ? tryParseJson(post.tagJson) : []);
  const category = tags[0] || "discussion";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-card rounded-xl border border-border overflow-hidden card-shadow hover:card-shadow-hover transition-shadow group"
    >
      <Link to={`/post/${post.id}`} className="block">
        {/* Cover Image */}
        <div className="relative aspect-[2/1] bg-slate-100 overflow-hidden">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Category Badge */}
          <span className={`absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-md ${categoryColors[category] || categoryColors.discussion}`}>
            {categoryLabels[category] || category}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-[15px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          {post.description && (
            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
              {post.description}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Author + Stats */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="w-6 h-6">
                <AvatarImage src={post.authorAvatar} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {post.authorNickname?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{post.authorNickname}</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <button
                className={`flex items-center gap-1 hover:text-red-500 transition-colors ${post.liked ? "text-red-500" : ""}`}
                onClick={(e) => { e.preventDefault(); onLike?.(post.id); }}
              >
                <Heart className={`w-3.5 h-3.5 ${post.liked ? "fill-current" : ""}`} />
                {formatCount(post.likeCount)}
              </button>
              <button
                className={`flex items-center gap-1 hover:text-amber-500 transition-colors ${post.faved ? "text-amber-500" : ""}`}
                onClick={(e) => { e.preventDefault(); onFav?.(post.id); }}
              >
                <Bookmark className={`w-3.5 h-3.5 ${post.faved ? "fill-current" : ""}`} />
                {formatCount(post.favoriteCount)}
              </button>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {formatCount(post.commentCount)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function tryParseJson(json: string): string[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}
