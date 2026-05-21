import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/EmptyState';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { settingsService } from '@/services/settingsService';

const NOTIFICATION_LABELS: Record<string, string> = {
  comment: '评论通知',
  like: '点赞通知',
  follow: '关注通知',
  system: '系统通知',
  recommendation: '推荐内容',
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
  });

  const patch = useMutation({
    mutationFn: (notificationPref: Record<string, boolean>) =>
      settingsService.patch({ notificationPref }),
    onSuccess: () => {
      toast.success('设置已保存');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : '保存失败'),
  });

  const updatePref = (key: string, value: boolean) => {
    if (!data) return;
    patch.mutate({ ...data.notificationPref, [key]: value });
  };

  return (
    <PageShell contentClassName="max-w-[760px]">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[640px]">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">设置</h1>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : error || !data ? (
          <EmptyState
            icon={SettingsIcon}
            title="设置加载失败"
            description={error instanceof Error ? error.message : '请稍后重试'}
            action={<Button onClick={() => refetch()}>重试</Button>}
          />
        ) : (
          <div className="p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bell size={18} /> 通知偏好
            </h2>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
              {Object.entries(data.notificationPref).map(([key, checked]) => (
                <label key={key} className="flex items-center justify-between p-4 cursor-pointer">
                  <span className="text-sm font-medium text-gray-800">{NOTIFICATION_LABELS[key] ?? key}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(checked)}
                    disabled={patch.isPending}
                    onChange={(e) => updatePref(key, e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}
