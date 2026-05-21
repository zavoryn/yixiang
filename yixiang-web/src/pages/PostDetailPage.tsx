import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft, ThumbsUp, MessageCircle, Share2, MoreHorizontal,
  CheckCircle2, Star, Image as ImageIcon,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { knowpostService } from '@/services/knowpostService';
import { commentService } from '@/services/commentService';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatCount, formatRelativeTime } from '@/lib/formatters';
import { useAuth } from '@/context/AuthContext';
import { buildSseUrl } from '@/lib/sse';
import { toast } from 'sonner';
import type { KnowpostDetailResponse } from '@/types/knowpost';
import type { CommentDTO } from '@/types/comment';

export default function PostDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { isAuthenticated, tokens } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const { data: post, isLoading, error } = useQuery<KnowpostDetailResponse>({
    queryKey: ['knowpost', 'detail', id],
    queryFn: () => knowpostService.detail(id!, tokens?.accessToken),
    enabled: !!id,
  });

  const { data: postContent } = useQuery({
    queryKey: ['knowpost', 'content', post?.contentUrl],
    queryFn: async () => {
      const resp = await fetch(post!.contentUrl);
      if (!resp.ok) throw new Error('正文加载失败');
      return resp.text();
    },
    enabled: !!post?.contentUrl,
  });

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => commentService.list(Number(id), undefined, 20),
    enabled: !!id,
  });

  const likeMut = useMutation({
    mutationFn: () => post?.liked ? knowpostService.unlike(id!) : knowpostService.like(id!),
    onMutate: () => {
      qc.setQueryData<KnowpostDetailResponse>(['knowpost', 'detail', id], (old) =>
        old ? { ...old, liked: !old.liked, likeCount: old.likeCount + (old.liked ? -1 : 1) } : old
      );
    },
    onError: () => { qc.invalidateQueries({ queryKey: ['knowpost', 'detail', id] }); },
  });

  const favMut = useMutation({
    mutationFn: () => post?.faved ? knowpostService.unfav(id!) : knowpostService.fav(id!),
    onMutate: () => {
      qc.setQueryData<KnowpostDetailResponse>(['knowpost', 'detail', id], (old) =>
        old ? { ...old, faved: !old.faved, favoriteCount: old.favoriteCount + (old.faved ? -1 : 1) } : old
      );
    },
    onError: () => { qc.invalidateQueries({ queryKey: ['knowpost', 'detail', id] }); },
  });

  const submitComment = useMutation({
    mutationFn: () => commentService.create({ postId: Number(id), content: commentText }),
    onSuccess: () => {
      setCommentText('');
      qc.invalidateQueries({ queryKey: ['comments', id] });
      toast.success('评论成功');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : '评论失败'),
  });

  const comments = commentsData?.items ?? [];

  const askQuestion = () => {
    const q = question.trim();
    if (!q || !id) return;
    setAnswer('');
    setIsAsking(true);
    const url = buildSseUrl(
      `/api/v1/knowposts/${id}/qa/stream?question=${encodeURIComponent(q)}&topK=5&maxTokens=1024`,
      tokens?.accessToken ?? null,
    );
    const es = new EventSource(url);
    es.onmessage = (event) => setAnswer((prev) => prev + event.data);
    es.addEventListener('done', () => {
      setIsAsking(false);
      es.close();
    });
    es.onerror = () => {
      setIsAsking(false);
      es.close();
      toast.error('AI 问答连接失败');
    };
  };

  if (isLoading) {
    return (
      <PageShell contentClassName="max-w-[760px]">
        <div className="space-y-4 px-6 py-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </PageShell>
    );
  }

  if (error || !post) {
    return (
      <PageShell contentClassName="max-w-[760px]">
        <div className="px-6 py-4">
          <EmptyState
            icon={ImageIcon}
            title="帖子不存在"
            description={error instanceof Error ? error.message : '请检查链接'}
            action={<Button onClick={() => navigate('/')}>返回首页</Button>}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      contentClassName="max-w-[760px]"
      rightRail={<PostRightRail post={post} />}
    >
      <div className="px-6 py-4">
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-black mb-4">
          <ArrowLeft size={18} className="mr-1" /> 返回
        </button>

        {/* Post article */}
        <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          {/* Author */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src={post.authorAvatar || `https://i.pravatar.cc/150?u=${post.authorId}`}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-base">{post.authorNickname}</span>
                  <CheckCircle2 size={16} className="text-blue-500 fill-blue-500" />
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {post.publishTime ? formatRelativeTime(post.publishTime) : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20} /></button>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold mb-3">{post.title}</h2>

          {/* Content */}
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="prose prose-sm max-w-none text-gray-700 text-[15px] leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {postContent ?? post.description}
              </ReactMarkdown>
            </div>
            {post.images?.[0] && (
              <img src={post.images[0]} className="w-40 h-24 object-cover rounded-lg border border-gray-100" />
            )}
          </div>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex gap-2 mb-6">
              {post.tags.map((tag) => (
                <span key={tag} className="text-blue-600 bg-blue-50 text-xs px-2 py-1 rounded cursor-pointer">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Recent likers */}
          {post.recentLikers && post.recentLikers.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex -space-x-2">
                {post.recentLikers.slice(0, 5).map((user, i) => (
                  <img key={i} src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`} className="w-5 h-5 rounded-full border border-white" />
                ))}
              </div>
              <span className="text-xs text-gray-500">{post.likerSummary ?? `${post.likeCount} 人赞过`}</span>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-gray-500 px-4">
            <button
              onClick={() => { if (!isAuthenticated) { toast.info('请先登录'); return; } likeMut.mutate(); }}
              className={`flex items-center gap-1.5 font-medium ${post.liked ? 'text-blue-600' : 'hover:text-blue-600'}`}
            >
              <ThumbsUp size={20} className={post.liked ? 'fill-current' : ''} /> {formatCount(post.likeCount)}
            </button>
            <button
              onClick={() => { if (!isAuthenticated) { toast.info('请先登录'); return; } favMut.mutate(); }}
              className={`flex items-center gap-1.5 font-medium ${post.faved ? 'text-yellow-500' : 'hover:text-yellow-500'}`}
            >
              <Star size={20} className={post.faved ? 'fill-current' : ''} /> {formatCount(post.favoriteCount)}
            </button>
            <button className="flex items-center gap-1.5 hover:text-gray-800">
              <MessageCircle size={20} /> {formatCount(post.commentCount)}
            </button>
            <button className="flex items-center gap-1.5 hover:text-gray-800">
              <Share2 size={20} /> 分享
            </button>
          </div>
        </article>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">AI 帖子问答</h3>
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') askQuestion();
              }}
              placeholder="输入你的问题..."
              className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2"
            />
            <button
              onClick={askQuestion}
              disabled={!question.trim() || isAsking}
              className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {isAsking ? '生成中...' : '提问'}
            </button>
          </div>
          {answer && (
            <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {answer}
            </div>
          )}
        </section>

        {/* Comment section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">全部评论 {formatCount(post.commentCount)}</h3>

          {/* Comment input */}
          {isAuthenticated && (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-2 mb-6">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && commentText.trim()) submitComment.mutate(); }}
                placeholder="写下你的评论..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2"
              />
              <button
                onClick={() => { if (commentText.trim()) submitComment.mutate(); }}
                disabled={submitComment.isPending}
                className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {submitComment.isPending ? '...' : '发表评论'}
              </button>
            </div>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              暂无评论，来发表第一条评论吧
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentRow key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function CommentRow({ comment }: { comment: CommentDTO }) {
  return (
    <div className="flex gap-3">
      <img src={comment.avatar || `https://i.pravatar.cc/150?u=${comment.userId}`} className="w-10 h-10 rounded-full" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-gray-800">{comment.nickname || `用户${comment.userId}`}</span>
          <span className="text-xs text-gray-400">{comment.createdAt ? formatRelativeTime(comment.createdAt) : ''}</span>
        </div>
        <p className="text-[15px] text-gray-800 mb-2">{comment.content}</p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <button className="flex items-center gap-1 hover:text-blue-600"><ThumbsUp size={14} /> 0</button>
          <button className="flex items-center gap-1 hover:text-gray-800"><MessageCircle size={14} /> 回复</button>
        </div>
      </div>
    </div>
  );
}

function PostRightRail({ post }: { post: KnowpostDetailResponse }) {
  return (
    <>
      {/* Author info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4 text-sm border-b border-gray-100 pb-2">作者信息</h3>
        <div className="flex items-center gap-3 mb-4">
          <img src={post.authorAvatar || `https://i.pravatar.cc/150?u=${post.authorId}`} className="w-14 h-14 rounded-full" />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-base">{post.authorNickname}</span>
              <CheckCircle2 size={16} className="text-blue-500 fill-blue-500" />
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{post.authorTagJson ? (() => { try { return (JSON.parse(post.authorTagJson) as string[])[0]; } catch { return ''; } })() : ''}</div>
          </div>
        </div>
        <div className="flex justify-between text-center mb-4">
          <div><div className="font-bold text-gray-800 text-lg">128</div><div className="text-xs text-gray-500">关注</div></div>
          <div className="w-px bg-gray-200" />
          <div><div className="font-bold text-gray-800 text-lg">12.3万</div><div className="text-xs text-gray-500">粉丝</div></div>
          <div className="w-px bg-gray-200" />
          <div><div className="font-bold text-gray-800 text-lg">356</div><div className="text-xs text-gray-500">获赞</div></div>
        </div>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">10年投资经验，专注价值投资，擅长财报分析和行业研究。</p>
        <button className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">已关注</button>
      </div>

      {/* Related posts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4 text-sm border-b border-gray-100 pb-2">相关推荐</h3>
        <div className="flex flex-col gap-4">
          {[
            { title: '宁德时代深度研究：从周期到成长', author: 'A股老张', reads: '1.2w' },
            { title: '新能源赛道还能布局吗？', author: 'TechAlpha', reads: '8456' },
            { title: '一文看懂Q3财报核心指标', author: '林夕看盘', reads: '6231' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 cursor-pointer group">
              <img src={`https://picsum.photos/seed/c${i}/100/100`} className="w-16 h-16 rounded object-cover bg-gray-100" />
              <div className="flex-1 flex flex-col justify-between">
                <h4 className="text-sm font-medium text-gray-800 group-hover:text-blue-600 line-clamp-2 leading-tight">{item.title}</h4>
                <div className="text-xs text-gray-500 mt-1">{item.author}<br />{item.reads} 阅读</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hot topics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4 text-sm border-b border-gray-100 pb-2">热门话题</h3>
        <div className="flex flex-col gap-3">
          {[
            { title: '宁德时代Q3财报解读', count: '3.2w' },
            { title: '新能源', count: '2.8w' },
            { title: '财报分析', count: '1.8w' },
          ].map((topic, i) => (
            <div key={i} className="flex justify-between items-center cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-blue-500 font-bold">#</span> {topic.title}
              </div>
              <span className="text-xs text-gray-400">{topic.count} 讨论</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
