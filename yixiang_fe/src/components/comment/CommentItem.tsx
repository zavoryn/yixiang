import { useState } from "react";
import { MessageCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import CommentInput from "./CommentInput";
import { commentService } from "@/services/commentService";
import { toast } from "sonner";
import type { CommentDTO } from "@/types/comment";
import { useAuth } from "@/context/AuthContext";

type Props = {
  comment: CommentDTO;
  postId: number;
  onUpdate?: (id: number, changes: Partial<CommentDTO>) => void;
  onDelete?: (id: number) => void;
};

export default function CommentItem({ comment, postId, onUpdate, onDelete }: Props) {
  const { user } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyTo, setReplyTo] = useState<CommentDTO | null>(null);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<CommentDTO[]>([]);
  const [repliesHasMore, setRepliesHasMore] = useState(false);
  const [repliesCursor, setRepliesCursor] = useState<string | null>(null);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const isOwner = user && String(user.id) === String(comment.userId);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  const handleLoadReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }
    setLoadingReplies(true);
    try {
      const res = await commentService.replies(comment.id);
      setReplies(res.items);
      setRepliesHasMore(res.hasMore);
      setRepliesCursor(res.nextCursor);
      setShowReplies(true);
    } catch {
      toast.error("加载回复失败");
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleLoadMoreReplies = async () => {
    if (!repliesCursor) return;
    try {
      const res = await commentService.replies(comment.id, repliesCursor);
      setReplies((prev) => [...prev, ...res.items]);
      setRepliesHasMore(res.hasMore);
      setRepliesCursor(res.nextCursor);
    } catch {
      toast.error("加载更多回复失败");
    }
  };

  const handleReply = () => {
    setReplyTo(comment);
    setShowReplyInput(true);
  };

  const handleReplyToReply = (target: CommentDTO) => {
    setReplyTo(target);
    setShowReplyInput(true);
  };

  const handleReplyCreated = (newReply: CommentDTO) => {
    setReplies((prev) => [...prev, newReply]);
    setShowReplyInput(false);
    setReplyTo(null);
    setShowReplies(true);
    onUpdate?.(comment.id, { replyCount: comment.replyCount + 1 });
  };

  const handleDelete = async () => {
    try {
      await commentService.remove(comment.id);
      onDelete?.(comment.id);
    } catch {
      toast.error("删除失败");
    }
  };

  return (
    <div className="py-3">
      <div className="flex gap-3">
        <Avatar className="w-9 h-9 shrink-0">
          <AvatarImage src={comment.avatar} />
          <AvatarFallback className="text-xs">
            {comment.nickname?.slice(0, 1) ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{comment.nickname}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-foreground mt-1 break-words">{comment.content}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <button
              onClick={handleReply}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              回复
            </button>
            {isOwner && (
              <button
                onClick={handleDelete}
                className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除
              </button>
            )}
          </div>

          {/* Reply input */}
          {showReplyInput && (
            <div className="mt-2 ml-2">
              <CommentInput
                postId={postId}
                parentId={comment.id}
                replyToUser={replyTo ?? undefined}
                onCancelReply={() => {
                  setShowReplyInput(false);
                  setReplyTo(null);
                }}
                onCommentCreated={handleReplyCreated}
              />
            </div>
          )}

          {/* Reply count & toggle */}
          {comment.replyCount > 0 && !showReplies && (
            <button
              onClick={handleLoadReplies}
              className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
              disabled={loadingReplies}
            >
              <ChevronDown className="w-3.5 h-3.5" />
              查看 {comment.replyCount} 条回复
            </button>
          )}

          {/* Replies list */}
          {showReplies && (
            <div className="mt-2 ml-2 space-y-0 border-l-2 border-border pl-3">
              {replies.map((reply) => (
                <div key={reply.id} className="py-2 group">
                  <div className="flex gap-2">
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarImage src={reply.avatar} />
                      <AvatarFallback className="text-[10px]">
                        {reply.nickname?.slice(0, 1) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground">{reply.nickname}</span>
                        {reply.replyToNickname && (
                          <>
                            <span className="text-xs text-muted-foreground">回复</span>
                            <span className="text-xs font-medium text-primary">@{reply.replyToNickname}</span>
                          </>
                        )}
                        <span className="text-xs text-muted-foreground">{timeAgo(reply.createdAt)}</span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5 break-words">{reply.content}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <button
                          onClick={() => handleReplyToReply(reply)}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          回复
                        </button>
                        {user && String(user.id) === String(reply.userId) && (
                          <button
                            onClick={async () => {
                              try {
                                await commentService.remove(reply.id);
                                setReplies((prev) => prev.filter((r) => r.id !== reply.id));
                                onUpdate?.(comment.id, { replyCount: comment.replyCount - 1 });
                              } catch {
                                toast.error("删除失败");
                              }
                            }}
                            className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {showReplyInput && replyTo && replyTo.id !== comment.id && (
                <div className="pb-2">
                  <CommentInput
                    postId={postId}
                    parentId={comment.id}
                    replyToUser={replyTo ?? undefined}
                    onCancelReply={() => {
                      setShowReplyInput(false);
                      setReplyTo(null);
                    }}
                    onCommentCreated={handleReplyCreated}
                  />
                </div>
              )}
              {repliesHasMore && (
                <button
                  onClick={handleLoadMoreReplies}
                  className="text-xs text-primary hover:underline py-1"
                >
                  加载更多回复
                </button>
              )}
              <button
                onClick={() => setShowReplies(false)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 py-1"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                收起回复
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
