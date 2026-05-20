import { useState, useEffect, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import CommentInput from "./CommentInput";
import CommentItem from "./CommentItem";
import { commentService } from "@/services/commentService";
import { toast } from "sonner";
import type { CommentDTO } from "@/types/comment";

type Props = {
  postId: number;
  initialCount?: number;
};

export default function CommentList({ postId, initialCount = 0 }: Props) {
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadComments = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const res = await commentService.list(postId, reset ? undefined : cursor ?? undefined);
      if (reset) {
        setComments(res.items);
      } else {
        setComments((prev) => [...prev, ...res.items]);
      }
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
      if (reset) {
        setTotalCount(res.items.length + (res.hasMore ? 1 : 0));
      }
    } catch {
      toast.error("加载评论失败");
    } finally {
      setLoading(false);
    }
  }, [postId, cursor]);

  useEffect(() => {
    loadComments(true);
  }, [postId]);

  const handleCommentCreated = (newComment: CommentDTO) => {
    setComments((prev) => [newComment, ...prev]);
    setTotalCount((prev) => prev + 1);
  };

  const handleCommentUpdate = (id: number, changes: Partial<CommentDTO>) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...changes } : c))
    );
  };

  const handleCommentDelete = (id: number) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">评论 ({totalCount})</h3>
      </div>

      <div className="mb-4">
        <CommentInput postId={postId} onCommentCreated={handleCommentCreated} />
      </div>

      <div className="divide-y divide-border">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            onUpdate={handleCommentUpdate}
            onDelete={handleCommentDelete}
          />
        ))}
      </div>

      {loading && (
        <div className="py-4 text-center text-sm text-muted-foreground">加载中...</div>
      )}

      {hasMore && !loading && (
        <div className="py-3 text-center">
          <button
            onClick={() => loadComments()}
            className="text-sm text-primary hover:underline"
          >
            加载更多评论
          </button>
        </div>
      )}

      {!loading && comments.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          暂无评论，快来抢沙发吧~
        </div>
      )}
    </div>
  );
}
