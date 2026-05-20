import { format, differenceInMinutes, differenceInHours } from 'date-fns';

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  if (isNaN(date.getTime())) return isoString;

  const diffMinutes = differenceInMinutes(now, date);
  const diffHours = differenceInHours(now, date);

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffHours < 48) return `昨天 ${format(date, 'HH:mm')}`;
  if (date.getFullYear() === now.getFullYear()) return format(date, 'MM-dd HH:mm');
  return format(date, 'yyyy-MM-dd HH:mm');
}

export function formatCount(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return n.toLocaleString('zh-CN');
  return String(n);
}
