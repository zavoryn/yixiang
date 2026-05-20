import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import PostCard from "./PostCard";
import type { FeedItem } from "@/types/knowpost";

type PostGridProps = {
  posts: FeedItem[];
  onLike?: (id: string) => void;
  onFav?: (id: string) => void;
  emptyMessage?: string;
};

export default function PostGrid({ posts, onLike, onFav, emptyMessage = "暂无内容" }: PostGridProps) {
  if (!posts.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {posts.map((post) => (
        <motion.div key={post.id} variants={staggerItem}>
          <PostCard post={post} onLike={onLike} onFav={onFav} />
        </motion.div>
      ))}
    </motion.div>
  );
}
