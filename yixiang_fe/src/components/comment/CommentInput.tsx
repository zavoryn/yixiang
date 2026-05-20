import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { commentService } from "@/services/commentService";
import { toast } from "sonner";
import type { CommentDTO } from "@/types/comment";

type Props = {
  postId: number;
  parentId?: number;
  replyToUser?: CommentDTO;
  onCancelReply?: () => void;
  onCommentCreated?: (comment: CommentDTO) => void;
};

export default function CommentInput({ postId, parentId, replyToUser, onCancelReply, onCommentCreated }: Props) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const id = await commentService.create({
        postId,
        content: content.trim(),
        parentId: parentId ?? undefined,
        replyToUserId: replyToUser?.userId,
      });
      onCommentCreated?.({
        id,
        postId,
        userId: 0,
        nickname: "",
        content: content.trim(),
        parentId: parentId ?? undefined,
        replyToUserId: replyToUser?.userId,
        replyToNickname: replyToUser?.nickname,
        createdAt: new Date().toISOString(),
        replyCount: 0,
      });
      setContent("");
      onCancelReply?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "评论失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      {replyToUser && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>回复 @{replyToUser.nickname}</span>
          <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写评论..."
          className="min-h-[40px] max-h-[120px] resize-none text-sm"
          rows={1}
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="shrink-0 self-end"
        >
          发送
        </Button>
      </div>
    </div>
  );
}
