import { useNavigate, Link } from 'react-router-dom';
import { ThumbsUp, Star, MessageCircle, Share2, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { FeedItem } from '@/types/knowpost';

type Props = {
  post: FeedItem;
  onLike?: (id: string) => void;
  onFav?: (id: string) => void;
  showFollow?: boolean;
};

function fmt(n?: number) {
  if (!n) return '0';
  return n >= 10000 ? `${(n / 10000).toFixed(1)}w` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function getTags(post: FeedItem): string[] {
  if (post.tags?.length) return post.tags;
  try { return post.tagJson ? JSON.parse(post.tagJson) : []; } catch { return []; }
}

function mockLikerAvatars(postId: string): string[] {
  const seed = hashCode(postId);
  return [0, 1, 2].map(i => `https://api.dicebear.com/7.x/initials/svg?seed=${(seed + i) % 1000}`);
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function FeedCard({ post, onLike, onFav, showFollow = true }: Props) {
  const navigate = useNavigate();
  const tags = getTags(post);
  const likerAvatars = mockLikerAvatars(post.id);

  return (
    <article
      className="bg-white p-6 border-b border-gray-100 last:rounded-b-2xl last:border-b-0 shadow-sm mb-4 rounded-2xl cursor-pointer"
      onClick={() => navigate(`/post/${post.id}`)}
    >
      {/* Author Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-11 h-11 border border-gray-100">
            <AvatarImage src={post.authorAvatar} />
            <AvatarFallback className="text-sm bg-blue-50 text-blue-600 font-bold">
              {post.authorNickname?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <Link
                to={`/user/${post.authorId || ''}`}
                className="font-bold text-gray-900 hover:text-blue-600 transition-colors"
                onClick={e => e.stopPropagation()}
              >
                {post.authorNickname}
              </Link>
              <CheckCircle2 size={16} className="text-blue-500 fill-blue-500 text-white" />
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {tags[0] || '投资达人'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          {showFollow && (
            <button className="border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-1.5 rounded-full text-xs font-medium transition-colors">
              关注
            </button>
          )}
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Content + Thumbnail */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-[17px] font-bold text-gray-900 leading-snug mb-2 hover:text-blue-600 transition-colors line-clamp-2">
            {post.title}
          </h2>
          {post.description && (
            <p className="text-gray-600 text-[15px] leading-relaxed line-clamp-2 mb-3">
              {post.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map(tag => (
              <span key={tag} className="bg-[#f0f5ff] text-blue-600 text-xs px-2.5 py-1 rounded-md cursor-pointer hover:bg-blue-100 transition-colors">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        {post.coverImage && (
          <div className="flex-shrink-0 w-[140px] h-[90px] rounded-xl overflow-hidden mt-1">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </div>

      {/* Social Proof Line */}
      {(post.likeCount || 0) > 0 && (
        <div className="flex items-center gap-3 mt-5 mb-4">
          <div className="flex -space-x-2">
            {likerAvatars.map((avatar, i) => (
              <img key={i} src={avatar} alt="liker" className="w-5 h-5 rounded-full border-2 border-white bg-gray-100" />
            ))}
          </div>
          <span className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            {fmt(post.likeCount)}人点赞 · {fmt(post.commentCount)}条评论 &gt;
          </span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-50 px-2">
        <button
          className={`flex items-center gap-2 text-[15px] font-medium transition-colors ${
            post.liked ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
          }`}
          onClick={e => { e.stopPropagation(); onLike?.(post.id); }}
        >
          <ThumbsUp size={20} className={post.liked ? 'fill-blue-600 text-blue-600' : ''} />
          {fmt(post.likeCount)}
        </button>
        <button
          className={`flex items-center gap-2 text-[15px] font-medium transition-colors ${
            post.faved ? 'text-yellow-500' : 'text-gray-500 hover:text-gray-800'
          }`}
          onClick={e => { e.stopPropagation(); onFav?.(post.id); }}
        >
          <Star size={20} className={post.faved ? 'fill-yellow-500 text-yellow-500' : ''} />
          {fmt(post.favoriteCount)}
        </button>
        <button className="flex items-center gap-2 text-[15px] font-medium text-gray-500 hover:text-gray-800 transition-colors">
          <MessageCircle size={20} />
          {fmt(post.commentCount)}
        </button>
        <button className="flex items-center gap-2 text-[15px] font-medium text-gray-500 hover:text-gray-800 transition-colors">
          <Share2 size={20} />
          分享
        </button>
      </div>
    </article>
  );
}
