import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageShellProps {
  children: ReactNode;
  rightRail?: ReactNode;
  contentClassName?: string;
}

export function PageShell({ children, rightRail, contentClassName }: PageShellProps) {
  return (
    <>
      <section className={cn('flex-1 max-w-[620px]', contentClassName)}>{children}</section>
      {rightRail && (
        <aside className="sticky top-[88px] flex w-[320px] shrink-0 flex-col gap-4">{rightRail}</aside>
      )}
    </>
  );
}
