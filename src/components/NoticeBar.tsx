import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

interface NoticeBarProps {
  notices: Notice[];
}

const typeStyles = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: Info,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    icon: AlertTriangle,
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: AlertCircle,
  },
};

export function NoticeBar({ notices }: NoticeBarProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleNotices = notices.filter(n => !dismissedIds.has(n.id));

  if (visibleNotices.length === 0) return null;

  const dismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
  };

  return (
    <div className="space-y-2 mb-6">
      {visibleNotices.map((notice) => {
        const style = typeStyles[notice.type] || typeStyles.info;
        const Icon = style.icon;

        return (
          <div
            key={notice.id}
            className={cn(
              'rounded-lg border p-4 flex items-start gap-3',
              style.bg
            )}
          >
            <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', style.text)} />
            <div className="flex-1 min-w-0">
              <h4 className={cn('font-semibold text-sm', style.text)}>
                {notice.title}
              </h4>
              <p className={cn('text-sm mt-0.5 opacity-90', style.text)}>
                {notice.content}
              </p>
            </div>
            <button
              onClick={() => dismiss(notice.id)}
              className={cn('flex-shrink-0 hover:opacity-70 transition-opacity', style.text)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
