import { Badge } from '@/components/ui/badge';
import {
  CalendarClockIcon,
  LoaderIcon,
  CheckCircle2Icon,
  XCircleIcon,
  BanIcon
} from 'lucide-react';

type TestRunStatus = 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

interface TestRunStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<TestRunStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}> = {
  scheduled: {
    label: 'Scheduled',
    variant: 'secondary',
    icon: CalendarClockIcon,
    className: 'bg-muted text-muted-foreground',
  },
  in_progress: {
    label: 'In Progress',
    variant: 'outline',
    icon: LoaderIcon,
    className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 animate-pulse',
  },
  completed: {
    label: 'Completed',
    variant: 'outline',
    icon: CheckCircle2Icon,
    className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  },
  failed: {
    label: 'Failed',
    variant: 'destructive',
    icon: XCircleIcon,
    className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'outline',
    icon: BanIcon,
    className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  },
};

export function TestRunStatusBadge({ status, className }: TestRunStatusBadgeProps) {
  const config = statusConfig[status as TestRunStatus] || statusConfig.scheduled;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} ${className || ''}`}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
