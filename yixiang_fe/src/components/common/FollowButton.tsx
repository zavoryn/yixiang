import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { relationService } from "@/services/relationService";
import { toast } from "sonner";
import type { RelationStatusResponse } from "@/types/relation";

type FollowButtonProps = {
  userId: number | string;
  size?: "sm" | "default";
  onToggle?: (following: boolean) => void;
};

export default function FollowButton({ userId, size = "default", onToggle }: FollowButtonProps) {
  const { tokens, user } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [mutual, setMutual] = useState(false);
  const [loading, setLoading] = useState(false);
  const numericId = Number(userId);

  useEffect(() => {
    if (!tokens?.accessToken || !user) return;
    if (user.id === numericId) return;
    relationService.status(numericId, tokens.accessToken)
      .then((res: RelationStatusResponse) => {
        setFollowing(res.following);
        setMutual(res.mutual);
      })
      .catch(() => {});
  }, [tokens?.accessToken, numericId, user]);

  const handleClick = async () => {
    if (!tokens?.accessToken) {
      toast.error("请先登录");
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      if (following) {
        await relationService.unfollow(numericId, tokens.accessToken);
        setFollowing(false);
        setMutual(false);
      } else {
        await relationService.follow(numericId, tokens.accessToken);
        setFollowing(true);
      }
      onToggle?.(!following);
    } catch {
      toast.error("操作失败");
    } finally {
      setLoading(false);
    }
  };

  if (user?.id === numericId) return null;

  return (
    <Button
      variant={following ? "outline" : "default"}
      size={size === "sm" ? "sm" : "default"}
      className={following
        ? "border-primary/30 text-primary hover:bg-primary/10"
        : "bg-primary hover:bg-primary-hover text-primary-foreground"
      }
      onClick={handleClick}
      disabled={loading}
    >
      {mutual ? "互相关注" : following ? "已关注" : "关注"}
    </Button>
  );
}
