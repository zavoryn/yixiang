import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { relationService } from "@/services/relationService";
import { motion } from "framer-motion";
import type { ProfileResponse } from "@/types/profile";

export default function RecommendedUsers() {
  const { tokens } = useAuth();
  const [users, setUsers] = useState<ProfileResponse[]>([]);

  useEffect(() => {
    // Load some recommended users - for now empty
    // In production, this would be an API call
  }, []);

  return (
    <motion.div
      className="bg-card rounded-xl border border-border p-4 card-shadow"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <h3 className="font-semibold text-foreground text-sm mb-4">推荐关注</h3>
      {users.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          暂无推荐用户
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <UserCard key={u.id} user={u} accessToken={tokens?.accessToken} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function UserCard({ user, accessToken }: { user: ProfileResponse; accessToken?: string }) {
  const [following, setFollowing] = useState(false);

  const handleToggle = async () => {
    if (!accessToken) return;
    try {
      if (following) {
        await relationService.unfollow(user.id, accessToken);
      } else {
        await relationService.follow(user.id, accessToken);
      }
      setFollowing(!following);
    } catch {}
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar className="w-10 h-10">
        <AvatarImage src={user.avatar} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {user.nickname?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">{user.nickname}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{user.bio || "这个人很懒，还没有简介"}</p>
      </div>
      <Button
        size="sm"
        variant={following ? "outline" : "default"}
        className={following ? "border-primary/30 text-primary text-xs" : "bg-primary hover:bg-primary-hover text-primary-foreground text-xs"}
        onClick={handleToggle}
      >
        {following ? "已关注" : "关注"}
      </Button>
    </div>
  );
}
