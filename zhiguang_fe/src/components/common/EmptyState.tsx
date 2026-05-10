import type { ReactNode } from 'react';
import s from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className={s.wrap}>
      <div className={s.iconWrap}>
        {icon || (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        )}
      </div>
      <h3 className={s.title}>{title}</h3>
      {description && <p className={s.desc}>{description}</p>}
      {actionLabel && onAction && (
        <button className={s.action} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
