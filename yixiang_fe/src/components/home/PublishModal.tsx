import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagInput from "@/components/common/TagInput";
import { Loader2, ImagePlus, X } from "lucide-react";
import { knowpostService } from "@/services/knowpostService";
import { toast } from "sonner";

type PublishModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function PublishModal({ open, onOpenChange }: PublishModalProps) {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!tokens?.accessToken || !title.trim()) {
      toast.error("请填写标题");
      return;
    }
    setIsPublishing(true);
    try {
      const draft = await knowpostService.createDraft();
      await knowpostService.update(draft.id, {
        title: title.trim(),
        tags,
        description: content.slice(0, 50)
      });
      // Navigate to full create page with draft ID
      navigate(`/create?draft=${draft.id}`);
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "创建失败";
      toast.error(message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>发布帖子</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Input
            placeholder="输入标题..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-bold border-0 shadow-none focus-visible:ring-0 p-0"
          />
          <Textarea
            placeholder="分享你的观点、经验或求助交流..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[140px] border-0 shadow-none focus-visible:ring-0 p-0 resize-none"
          />

          <div className="border-t border-border pt-4">
            <TagInput tags={tags} onChange={setTags} placeholder="输入标签后回车" />
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <ImagePlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">点击或拖拽上传图片</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
            onClick={handlePublish}
            disabled={isPublishing || !title.trim()}
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            继续编辑
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
