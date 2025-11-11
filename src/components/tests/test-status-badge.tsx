import { useTranslation } from '@/hooks/use-translation';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2Icon, CircleIcon, LoaderIcon, XCircleIcon, BanIcon } from 'lucide-react';

type TestStatus = 'draft' | 'ready' | 'running' | 'completed' | 'failed' | 'cancelled';

interface TestStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<TestStatus, {
  labelKey: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}> = {
  draft: {
    labelKey: 'tests.statusDraft',
    variant: 'secondary',
    icon: CircleIcon,
    className: 'bg-muted text-muted-foreground',
  },
  ready: {
    labelKey: 'tests.statusReady',
    variant: 'default',
    icon: CircleIcon,
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  },
  running: {
    labelKey: 'tests.statusRunning',
    variant: 'outline',
    icon: LoaderIcon,
    className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 animate-pulse',
  },
  completed: {
    labelKey: 'tests.statusCompleted',
    variant: 'outline',
    icon: CheckCircle2Icon,
    className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  },
  failed: {
    labelKey: 'tests.statusFailed',
    variant: 'destructive',
    icon: XCircleIcon,
    className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  },
  cancelled: {
    labelKey: 'tests.statusCancelled',
    variant: 'outline',
    icon: BanIcon,
    className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  },
};

export function TestStatusBadge({ status, className }: TestStatusBadgeProps) {
  const { t } = useTranslation();
  const config = statusConfig[status as TestStatus] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} ${className || ''}`}>
      <Icon className="mr-1 h-3 w-3" />
      {t(config.labelKey)}
    </Badge>
  );
}
