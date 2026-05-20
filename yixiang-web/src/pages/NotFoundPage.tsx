import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center text-center">
      <h1 className="mb-2 text-7xl font-bold text-[var(--color-primary)]">404</h1>
      <p className="mb-6 text-[var(--color-muted-foreground)]">页面不存在或已被删除</p>
      <Button asChild>
        <Link to="/">回到首页</Link>
      </Button>
    </div>
  );
}
