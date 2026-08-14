import { Skeleton } from '@/shared/components/ui/Skeleton';
import { cn } from '@/shared/lib/utils';
import type { ActivityDto } from '../types';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-semantic-success',
  update: 'bg-accent-indigo',
  delete: 'bg-accent-crimson',
  login:  'bg-amber-400',
};

function humanize(action: string, entityType: string): string {
  const act = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    login:  'Logged in',
  }[action.toLowerCase()] ?? action;
  return `${act} ${entityType.toLowerCase()}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  activities: ActivityDto[];
  isLoading:  boolean;
}

export function ActivityLog({ activities, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="w-2 h-2 rounded-full bg-bg-surface3 mt-1.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton height={12} width="70%" />
              <Skeleton height={10} width="40%" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-text-muted text-sm font-sans text-center py-8">No recent activity</p>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((a, i) => {
        const dotColor = ACTION_COLORS[a.action.toLowerCase()] ?? 'bg-text-muted';
        return (
          <div key={i} className="flex gap-3 items-start">
            <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', dotColor)} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-text-primary font-sans capitalize">
                {humanize(a.action, a.entityType)}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-text-muted font-sans">
                  {relativeTime(a.createdAt)}
                </span>
                {a.ip && (
                  <span className="text-[10px] text-text-muted font-sans truncate">
                    from {a.ip}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
