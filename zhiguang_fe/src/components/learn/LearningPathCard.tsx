import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressRing from './ProgressRing';
import s from './LearningPathCard.module.css';

interface LearningPathCardProps {
  title: string;
  description: string;
  tags: string[];
  progress: number;
  postCount: number;
  icon?: ReactNode;
  searchQuery: string;
}

export default function LearningPathCard({
  title,
  description,
  tags,
  progress,
  postCount,
  icon,
  searchQuery,
}: LearningPathCardProps) {
  const navigate = useNavigate();

  return (
    <div className={s.card} onClick={() => navigate(`/search?q=${encodeURIComponent(searchQuery)}`)}>
      <div className={s.top}>
        <div className={s.iconWrap}>
          {icon || (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          )}
        </div>
        <ProgressRing progress={progress} />
      </div>
      <h3 className={s.title}>{title}</h3>
      <p className={s.desc}>{description}</p>
      <div className={s.tagRow}>
        {tags.map(tag => (
          <span key={tag} className={s.tag}>{tag}</span>
        ))}
        <span className={s.count}>{postCount} 篇知文</span>
      </div>
    </div>
  );
}
