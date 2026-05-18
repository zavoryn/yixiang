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
        <aside className="w-[300px] shrink-0 space-y-3 sticky top-[68px]">
          {rightSidebar}
        </aside>
      )}
    </div>
  );
}
