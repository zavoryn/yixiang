import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileEdit, Send, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/EmptyState';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/formatters';
import { draftService } from '@/services/draftService';

export default function DraftsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['drafts'],
    queryFn: () => draftService.list(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => draftService.remove(id),
    onSuccess: () => {
      toast.success('草稿已删除');
      qc.invalidateQueries({ queryKey: ['drafts'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : '删除失败'),
  });

  const publish = useMutation({
    mutationFn: (id: string) => draftService.publish(id),
    onSuccess: (resp) => {
      toast.success('发布成功');
      qc.invalidateQueries({ queryKey: ['drafts'] });
      navigate(`/posts/${resp.postId}`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : '发布失败'),
  });

  const drafts = data ?? [];

  return (
    <PageShell contentClassName="max-w-[760px]">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[640px]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">草稿箱</h1>
          <Button onClick={() => navigate('/create')}>新建帖子</Button>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : error ? (
          <EmptyState
            icon={FileEdit}
            title="草稿加载失败"
            description={error instanceof Error ? error.message : '请稍后重试'}
            action={<Button onClick={() => refetch()}>重试</Button>}
          />
        ) : drafts.length === 0 ? (
          <EmptyState
            icon={FileEdit}
            title="暂无草稿"
            description="保存中的帖子会显示在这里"
            action={<Button onClick={() => navigate('/create')}>去发布</Button>}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {drafts.map((draft) => (
              <div key={draft.id} className="p-6 flex items-center justify-between gap-4 hover:bg-gray-50">
                <div className="min-w-0">
                  <h2 className="font-bold text-gray-900 truncate">{draft.title || '未命名草稿'}</h2>
                  <p className="text-sm text-gray-500 mt-1">更新于 {formatRelativeTime(draft.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => navigate(`/create?draftId=${draft.id}`)}>继续编辑</Button>
                  <Button variant="ghost" size="icon" onClick={() => publish.mutate(draft.id)} disabled={publish.isPending}>
                    <Send size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(draft.id)} disabled={remove.isPending}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
