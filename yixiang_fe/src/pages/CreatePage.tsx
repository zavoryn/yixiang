import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ImagePlus, Sparkles, Loader2, Lightbulb, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { knowpostService, uploadToPresigned, computeSha256 } from "@/services/knowpostService";
import { circleService } from "@/services/circleService";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import TagInput from "@/components/common/TagInput";
import PageShell from "@/components/layout/PageShell";
import { toast } from "sonner";
import type { VisibleScope } from "@/types/knowpost";
import type { CircleSummary } from "@/types/circle";

export default function CreatePage() {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [draftId, setDraftId] = useState<string | null>(searchParams.get("draft"));
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [visible, setVisible] = useState<VisibleScope>("public");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [joinedCircles, setJoinedCircles] = useState<CircleSummary[]>([]);
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);

  useEffect(() => {
    if (!tokens?.accessToken) {
      navigate("/login", { replace: true });
    }
  }, [tokens, navigate]);

  useEffect(() => {
    if (tokens?.accessToken) {
      circleService.joined().then(setJoinedCircles).catch(() => {});
    }
  }, [tokens?.accessToken]);

  const ensureDraft = async () => {
    if (draftId) return draftId;
    const res = await knowpostService.createDraft();
    setDraftId(res.id);
    return res.id;
  };

  const handleAISummary = async () => {
    if (!content.trim() || !tokens?.accessToken) return;
    setIsSummarizing(true);
    try {
      const res = await knowpostService.suggestDescription(content, tokens.accessToken);
      setDescription(res.description);
      toast.success("AI 摘要已生成");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "生成失败");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handlePublish = async () => {
    if (!tokens?.accessToken || !title.trim()) {
      toast.error("请填写标题");
      return;
    }
    setIsPublishing(true);
    try {
      const id = await ensureDraft();

      if (content.trim()) {
        const contentBlob = new Blob([content], { type: "text/markdown" });
        const contentFile = new File([contentBlob], "content.md", { type: "text/markdown" });
        const sha256 = await computeSha256(contentFile);
        const presign = await knowpostService.presign({
          scene: "knowpost_content",
          postId: id,
          contentType: "text/markdown",
          ext: ".md",
        });
        await uploadToPresigned(presign.putUrl, presign.headers, contentFile);
        await knowpostService.confirmContent(id, {
          objectKey: presign.objectKey,
          etag: "",
          size: contentFile.size,
          sha256,
        });
      }

      await knowpostService.update(id, {
        title: title.trim(),
        tags,
        description: description || content.slice(0, 50),
        imgUrls: images,
        visible,
        circleId: selectedCircleId,
      });

      await knowpostService.publish(id);
      toast.success("发布成功");
      navigate(`/post/${id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "发布失败");
    } finally {
      setIsPublishing(false);
    }
  };

  const tipsContent = (
    <div className="space-y-3">
      <div className="card-base p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">发布建议</span>
        </div>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
            标题简洁明确，突出核心观点
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
            内容有理有据，数据支撑结论
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
            添加标签帮助更多人发现
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
            善用AI生成摘要功能
          </li>
        </ul>
      </div>
      <div className="card-base p-4">
        <div className="text-sm font-semibold mb-3">发布者规范</div>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>- 不发布虚假或误导性内容</li>
          <li>- 尊重他人知识产权</li>
          <li>- 遵守社区规范与法律法规</li>
        </ul>
      </div>
    </div>
  );

  return (
    <PageShell rightSidebar={tipsContent}>
      <div className="card-base">
        <div className="px-6 py-4 border-b border-border">
          <h1 className="text-lg font-bold text-foreground">发布帖子</h1>
        </div>

        <div className="p-6 space-y-5">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入标题..."
            className="text-xl font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
          />

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的知识、观点或经验..."
            className="min-h-[240px] border-0 shadow-none focus-visible:ring-0 p-0 resize-none text-sm leading-relaxed"
          />

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">摘要</Label>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary gap-1"
                onClick={handleAISummary}
                disabled={isSummarizing || !content.trim()}
              >
                {isSummarizing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                AI 生成摘要
              </Button>
            </div>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 50))}
              placeholder="一句话概括内容（50字以内）"
              maxLength={50}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {description.length}/50
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <Label className="text-sm font-medium mb-2 block">标签</Label>
            <TagInput tags={tags} onChange={setTags} placeholder="输入标签后回车" max={5} />
          </div>

          <div className="border-t border-border pt-4">
            <Label className="text-sm font-medium mb-2 block">图片</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <ImagePlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">点击或拖拽上传图片</p>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">公开可见</Label>
              <Switch
                checked={visible === "public"}
                onCheckedChange={(v) => setVisible(v ? "public" : "followers")}
              />
            </div>
            {joinedCircles.length > 0 && (
              <div className="flex items-center justify-between">
                <Label className="text-sm">发布到圈子</Label>
                <select
                  value={selectedCircleId ?? ""}
                  onChange={(e) =>
                    setSelectedCircleId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">不发布到圈子</option>
                  {joinedCircles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            取消
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={handlePublish}
            disabled={isPublishing || !title.trim()}
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            发布
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
