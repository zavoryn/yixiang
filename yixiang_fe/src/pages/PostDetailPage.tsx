import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Share2, Clock, BookOpen, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { knowpostService } from "@/services/knowpostService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import LikeFavBar from "@/components/common/LikeFavBar";
import FollowButton from "@/components/common/FollowButton";
import CommentList from "@/components/comment/CommentList";
import PageShell from "@/components/layout/PageShell";
import HotTopics from "@/components/widgets/HotTopics";
import type { KnowpostDetailResponse } from "@/types/knowpost";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tokens, user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<KnowpostDetailResponse | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // RAG Q&A state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [qaLoading, setQaLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    knowpostService
      .detail(id, tokens?.accessToken ?? undefined)
      .then(async (res) => {
        setPost(res);
        if (res.contentUrl) {
          try {
            const text = await fetch(res.contentUrl).then((r) => r.text());
            setContent(text);
          } catch {
            setContent(res.description || "");
          }
        } else {
          setContent(res.description || "");
        }
      })
      .catch((err) => setError(err.message || "加载失败"))
      .finally(() => setLoading(false));
  }, [id, tokens?.accessToken]);

  const handleQA = async () => {
    if (!question.trim() || !id) return;
    setQaLoading(true);
    setAnswer("");
    try {
      const eventSource = new EventSource(
        `/api/v1/knowposts/${id}/qa/stream?question=${encodeURIComponent(question)}`
      );
      let fullAnswer = "";
      eventSource.onmessage = (event) => {
        if (event.data === "[DONE]") {
          eventSource.close();
          setQaLoading(false);
          return;
        }
        try {
          const data = JSON.parse(event.data);
          if (data.content) {
            fullAnswer += data.content;
            setAnswer(fullAnswer);
          }
        } catch {}
      };
      eventSource.onerror = () => {
        eventSource.close();
        setQaLoading(false);
        if (!fullAnswer) setAnswer("抱歉，问答服务暂时不可用");
      };
    } catch {
      setQaLoading(false);
      setAnswer("抱歉，问答服务暂时不可用");
    }
  };

  if (loading) {
    return (
      <div className="card-base p-12 text-center text-muted-foreground">
        加载中…
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="card-base p-12 text-center text-muted-foreground">
        {error || "帖子不存在"}
      </div>
    );
  }

  const isSelf = user?.id === post.authorId;
  const tags = post.tags?.length ? post.tags : [];

  const rightSidebar = (
    <>
      {/* Author card */}
      <div className="card-base p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={post.authorAvatar} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {post.authorNickname?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link
              to={`/user/${post.authorId || ""}`}
              className="text-sm font-semibold text-foreground hover:text-primary block"
            >
              {post.authorNickname}
            </Link>
            <p className="text-xs text-muted-foreground">
              {post.publishTime &&
                new Date(post.publishTime).toLocaleDateString("zh-CN")}
            </p>
          </div>
          {!isSelf && post.authorId && <FollowButton userId={post.authorId} size="sm" />}
        </div>
        {post.authorTagJson &&
          (() => {
            try {
              return JSON.parse(post.authorTagJson);
            } catch {
              return [];
            }
          })().map((t: string) => (
            <span
              key={t}
              className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mr-1"
            >
              {t}
            </span>
          ))}
      </div>

      {/* Image gallery */}
      {post.images && post.images.length > 1 && (
        <div className="card-base p-4">
          <h4 className="font-semibold text-sm mb-3">图片 ({post.images.length})</h4>
          <div className="grid grid-cols-3 gap-1.5">
            {post.images.slice(0, 6).map((img, i) => (
              <div
                key={i}
                className="aspect-square rounded-md overflow-hidden bg-muted"
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
      <HotTopics />
    </>
  );

  return (
    <PageShell rightSidebar={rightSidebar}>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-3 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <article className="card-base p-6">
        <h1 className="text-2xl font-extrabold text-foreground leading-tight">
          {post.title}
        </h1>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author row */}
        <div className="flex items-center justify-between mt-5 py-4 border-t border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.authorAvatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {post.authorNickname?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">
                {post.authorNickname}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                {post.publishTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(post.publishTime).toLocaleDateString("zh-CN")}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {content.length > 500 ? "约5分钟阅读" : "约1分钟阅读"}
                </span>
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
            <Share2 className="w-4 h-4" />
            分享
          </Button>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none mt-6 text-sm leading-relaxed whitespace-pre-line">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>

        {/* Like/Fav bar */}
        <div className="mt-8 pt-4 border-t border-border">
          <LikeFavBar
            entityId={post.id}
            initialLiked={post.liked}
            initialFaved={post.faved}
            initialLikeCount={post.likeCount}
            initialFavCount={post.favoriteCount}
            commentCount={post.commentCount}
            size="lg"
          />
        </div>
      </article>

      {/* Comments */}
      <div className="mt-3">
        <CommentList postId={Number(post.id)} initialCount={post.commentCount ?? 0} />
      </div>

      {/* RAG Q&A */}
      <div className="card-base p-6 mt-3">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          AI 智能问答
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          针对本文内容提问，AI 将基于文章内容回答
        </p>
        <div className="flex gap-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="输入你的问题..."
            className="flex-1 min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleQA();
              }
            }}
          />
          <Button
            className="bg-primary hover:bg-primary/90 text-white shrink-0"
            onClick={handleQA}
            disabled={qaLoading || !question.trim()}
          >
            {qaLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        {answer && (
          <div className="mt-3 p-4 bg-muted rounded-lg text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
          </div>
        )}
      </div>
    </PageShell>
  );
}
