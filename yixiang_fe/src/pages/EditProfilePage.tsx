import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { profileService } from "@/services/profileService";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TagInput from "@/components/common/TagInput";
import { toast } from "sonner";
import type { Gender } from "@/types/profile";

export default function EditProfilePage() {
  const { user, tokens, reloadUser } = useAuth();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<string>("");
  const [birthday, setBirthday] = useState("");
  const [school, setSchool] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!tokens?.accessToken) {
      navigate("/login", { replace: true });
      return;
    }
    if (user) {
      setNickname(user.nickname || "");
      setBio(user.bio || "");
      setPhone(user.phone || "");
      setGender(user.gender === "MALE" ? "男" : user.gender === "FEMALE" ? "女" : "");
      setBirthday(user.birthday || "");
      setSchool(user.school || "");
      try {
        setSkills(user.tagJson ? JSON.parse(user.tagJson) : []);
      } catch { setSkills([]); }
    }
  }, [user, tokens, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await profileService.uploadAvatar(file);
      await reloadUser();
      toast.success("头像更新成功");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "上传失败";
      toast.error(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!tokens?.accessToken) return;
    setSaving(true);
    try {
      await profileService.update({
        nickname: nickname || undefined,
        bio: bio || undefined,
        phone: phone || undefined,
        gender: (gender === "男" ? "MALE" : gender === "女" ? "FEMALE" : "UNKNOWN") as Gender,
        birthday: birthday || undefined,
        school: school || undefined,
        tagJson: skills.length > 0 ? JSON.stringify(skills) : undefined
      });
      await reloadUser();
      toast.success("资料更新成功");
      navigate("/profile");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "保存失败";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-card rounded-xl border border-border card-shadow">
        <div className="px-6 py-4 border-b border-border">
          <h1 className="text-lg font-bold text-foreground">编辑资料</h1>
        </div>

        <div className="p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {user?.nickname?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">点击更换头像</p>
          </div>

          {/* Nickname */}
          <div className="space-y-1.5">
            <Label>昵称</Label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="输入昵称" />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label>手机号</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="输入手机号" />
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <Label>性别</Label>
            <Input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="男 / 女" />
          </div>

          {/* Birthday */}
          <div className="space-y-1.5">
            <Label>生日</Label>
            <Input value={birthday} onChange={(e) => setBirthday(e.target.value)} type="date" />
          </div>

          {/* School */}
          <div className="space-y-1.5">
            <Label>学校</Label>
            <Input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="输入学校" />
          </div>

          {/* Skills */}
          <div className="space-y-1.5">
            <Label>技能标签</Label>
            <TagInput tags={skills} onChange={setSkills} placeholder="输入技能后回车" max={10} />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label>个人简介</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="介绍一下自己..."
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/profile")}>
            取消
          </Button>
          <Button
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            保存
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
