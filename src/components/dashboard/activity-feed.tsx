/**
 * Activity Feed Component
 *
 * Displays recent activity with user avatars and timestamps
 */

import { useTranslation } from '@/hooks/use-translation';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils/format';
import { RecentActivity } from '@/lib/actions/dashboard';
import { FlaskConical, FolderPlus } from 'lucide-react';

interface ActivityFeedProps {
  activities: RecentActivity[];
}

const activityIcons = {
  test_created: FlaskConical,
  project_created: FolderPlus,
} as const;

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const { t } = useTranslation();

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          <CardDescription>{t('dashboard.recentActionsWillAppear')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t('dashboard.noRecentActivityYet')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
        <CardDescription>{t('dashboard.latestActionsAndUpdates')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];

            return (
              <Link
                key={activity.id}
                href={activity.link as any}
                className="flex items-start space-x-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
