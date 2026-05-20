import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  rightSidebar?: ReactNode;
}

export default function PageShell({ children, rightSidebar }: PageShellProps) {
  return (
    <div className="flex gap-5 items-start">
      <div className="flex-1 min-w-0">{children}</div>
      {rightSidebar && (
        <aside className="w-[320px] shrink-0 space-y-4 sticky top-[88px]">
          {rightSidebar}
        </aside>
      )}
    </div>
  );
}
