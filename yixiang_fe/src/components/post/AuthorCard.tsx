import FollowButton from "@/components/common/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type AuthorCardProps = {
  authorId?: number | string;
  authorName: string;
  authorAvatar?: string;
  authorBio?: string;
  followerCount?: number;
};

export default function AuthorCard({ authorId, authorName, authorAvatar, authorBio, followerCount }: AuthorCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 card-shadow text-center">
      <Avatar className="w-16 h-16 mx-auto mb-3">
        <AvatarImage src={authorAvatar} />
        <AvatarFallback className="text-xl bg-primary/10 text-primary">
          {authorName?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      <h4 className="font-semibold text-foreground text-sm">{authorName}</h4>
      {authorBio && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{authorBio}</p>
      )}
      {followerCount !== undefined && (
        <p className="text-xs text-muted-foreground mt-2">{followerCount} 粉丝</p>
      )}
      {authorId && (
        <div className="mt-3">
          <FollowButton userId={authorId} size="sm" />
        </div>
      )}
    </div>
  );
}
