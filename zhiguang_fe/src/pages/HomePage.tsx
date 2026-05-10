import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import CourseCard from "@/components/cards/CourseCard";
import LikeFavBar from "@/components/common/LikeFavBar";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";
import HeroBanner from "@/components/home/HeroBanner";
import CommunityStats from "@/components/home/CommunityStats";
import TrendingTags from "@/components/home/TrendingTags";
import SectionHeader from "@/components/common/SectionHeader";
import AuthStatus from "@/features/auth/AuthStatus";
import { knowpostService } from "@/services/knowpostService";
import styles from "./HomePage.module.css";

const HomePage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Array<{
    id: string;
    title: string;
    description: string;
    coverImage?: string;
    tags: string[];
    tagJson?: string;
    authorAvatar?: string;
    authorAvator?: string;
    authorNickname: string;
    likeCount?: number;
    favoriteCount?: number;
    liked?: boolean;
    faved?: boolean;
    isTop?: boolean;
  }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await knowpostService.feed(1, 20);
        if (!cancelled) {
          setItems(resp.items ?? []);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "加载失败";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <AppLayout variant="cardless">
      <div className={styles.topBar}>
        <AuthStatus />
      </div>

      <HeroBanner />
      <CommunityStats />
      <TrendingTags />

      <div className={styles.feedSection}>
        <SectionHeader
          title="最新知文"
          subtitle={error ? undefined : loading ? undefined : `${items.length} 篇内容`}
        />

        {error && (
          <EmptyState
            title="加载失败"
            description={error}
            actionLabel="重试"
            onAction={() => window.location.reload()}
          />
        )}

        {!error && loading && <div className={styles.masonry}><SkeletonCard count={8} /></div>}

        {!error && !loading && items.length === 0 && (
          <EmptyState
            title="还没有内容"
            description="成为第一个分享知识的人吧"
            actionLabel="创作知文"
            onAction={() => navigate('/create')}
          />
        )}

        {!error && !loading && items.length > 0 && (
          <div className={styles.masonry}>
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={styles.masonryItem}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <CourseCard
                  id={item.id}
                  title={item.title}
                  summary={item.description ?? ""}
                  tags={item.tags ?? []}
                  authorTags={(() => {
                    try {
                      return item.tagJson ? (JSON.parse(item.tagJson) as unknown[]).filter((t) => typeof t === "string") as string[] : [];
                    } catch { return []; }
                  })()}
                  teacher={{ name: item.authorNickname, avatarUrl: item.authorAvatar ?? item.authorAvator }}
                  coverImage={item.coverImage}
                  isTop={item.isTop}
                  to={`/post/${item.id}`}
                  footerExtra={<LikeFavBar entityId={item.id} compact initialCounts={{ like: item.likeCount ?? 0, fav: item.favoriteCount ?? 0 }} initialState={{ liked: item.liked, faved: item.faved }} />}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default HomePage;
