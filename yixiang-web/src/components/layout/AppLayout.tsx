import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Header />
      <main className="mx-auto flex max-w-[1280px] items-start gap-6 px-4 pb-12 pt-6">
        <Sidebar />
        <div className="flex flex-1 gap-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
