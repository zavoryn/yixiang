import s from './SkeletonCard.module.css';

interface SkeletonCardProps {
  count?: number;
  variant?: 'feed' | 'search' | 'profile';
}

export default function SkeletonCard({ count = 4, variant = 'feed' }: SkeletonCardProps) {
  if (variant === 'profile') {
    return (
      <div className={s.profileWrap}>
        <div className={s.profileAvatar} />
        <div className={s.profileInfo}>
          <div className={`${s.skeleton} ${s.skeletonTitle}`} />
          <div className={`${s.skeleton} ${s.skeletonText}`} />
          <div className={s.tagRow}>
            <div className={`${s.skeleton} ${s.skeletonTag}`} />
            <div className={`${s.skeleton} ${s.skeletonTag}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={s.card} style={{ animationDelay: `${i * 60}ms` }}>
          <div className={`${s.skeleton} ${s.skeletonTitle}`} />
          <div className={`${s.skeleton} ${s.skeletonText}`} style={{ width: '90%' }} />
          <div className={s.meta}>
            <div className={`${s.skeleton} ${s.skeletonAvatar}`} />
            <div className={`${s.skeleton} ${s.skeletonText}`} style={{ width: '60px' }} />
          </div>
        </div>
      ))}
    </>
  );
}
