import { useNavigate } from 'react-router-dom';
import { Heart, Bookmark, MessageCircle, Share2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { FeedItem } from '@/types/knowpost';

type Props = {
  post: FeedItem;
  onLike?: (id: string) => void;
  onFav?: (id: string) => void;
};

function fmt(n?: number) {
  if (!n) return '0';
  return n >= 10000 ? `${(n / 10000).toFixed(1)}w` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function getTags(post: FeedItem): string[] {
  if (post.tags?.length) return post.tags;
  try { return post.tagJson ? JSON.parse(post.tagJson) : []; } catch { return []; }
}

export default function FeedCard({ post, onLike, onFav }: Props) {
  const navigate = useNavigate();
  const tags = getTags(post);

  return (
    <div
      className="card-base p-4 hover:shadow-sm transition-shadow cursor-pointer group"
      onClick={() => navigate(`/post/${post.id}`)}
    >
      <div className="flex gap-3">
        {/* Content side */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Author row */}
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarImage src={post.authorAvatar} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {post.authorNickname?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span
              className="text-sm font-medium text-foreground"
            >
              {post.authorNickname}
            </span>
            {tags[0] && (
              <span className="text-xs text-[#ff8c00] bg-[#fff7e6] border border-[#ffd591] px-1.5 py-0.5 rounded-md">
                {tags[0]}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-semibold text-foreground leading-snug line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
            {post.title}
          </h3>

          {/* Description */}
          {post.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.description}</p>
          )}

          {/* Tags row */}
          {tags.length > 1 && (
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {tags.slice(1, 4).map(t => (
                <span key={t} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-1">
            <button
              className={`flex items-center gap-1 hover:text-red-500 transition-colors ${post.liked ? 'text-red-500' : ''}`}
              onClick={e => { e.stopPropagation(); onLike?.(post.id); }}
            >
              <Heart className={`w-3.5 h-3.5 ${post.liked ? 'fill-current' : ''}`} />
              {fmt(post.likeCount)}
            </button>
            <button
              className={`flex items-center gap-1 hover:text-amber-500 transition-colors ${post.faved ? 'text-amber-500' : ''}`}
              onClick={e => { e.stopPropagation(); onFav?.(post.id); }}
            >
              <Bookmark className={`w-3.5 h-3.5 ${post.faved ? 'fill-current' : ''}`} />
              {fmt(post.favoriteCount)}
            </button>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {fmt(post.commentCount)}
            </span>
            <button
              className="flex items-center gap-1 hover:text-primary transition-colors ml-auto"
              onClick={e => e.stopPropagation()}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cover image */}
        {post.coverImage && (
          <div className="w-[120px] h-[90px] shrink-0 rounded-lg overflow-hidden bg-muted">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );
}
