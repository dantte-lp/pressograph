'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderIcon, FlaskConicalIcon, ActivityIcon, HardDriveIcon, Archive } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';

interface DashboardStats {
  totalProjects: number;
  activeTests: number;
  totalTests: number;
  storageUsed: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  link: string;
}

interface DashboardContentProps {
  stats: DashboardStats;
  activities: Activity[];
}

export function DashboardContent({ stats, activities }: DashboardContentProps) {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.totalProjects')}
            </CardTitle>
            <FolderIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-muted-foreground text-xs">
              {stats.totalProjects === 0 ? t('dashboard.noProjectsYet') : t('dashboard.activeProjects')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.activeTests')}
            </CardTitle>
            <FlaskConicalIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTests}</div>
            <p className="text-muted-foreground text-xs">
              {stats.activeTests === 0 ? t('dashboard.noActiveTests') : t('dashboard.runningOrReady')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.totalTests')}
            </CardTitle>
            <ActivityIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTests}</div>
            <p className="text-muted-foreground text-xs">
              {stats.totalTests === 0 ? t('dashboard.noTestsYet') : t('dashboard.allTestConfigs')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.storageUsed')}
            </CardTitle>
            <HardDriveIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats.storageUsed)}</div>
            <p className="text-muted-foreground text-xs">
              {t('dashboard.totalFileStorage')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Projects Quick Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FolderIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('nav.projects')}</CardTitle>
            </div>
            <CardDescription>
              {t('dashboard.manageProjects')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/projects">
                  <FolderIcon className="mr-2 h-4 w-4" />
                  {t('dashboard.allProjects')}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/projects/archived">
                  <Archive className="mr-2 h-4 w-4" />
                  {t('nav.archived')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tests Quick Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FlaskConicalIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('nav.tests')}</CardTitle>
            </div>
            <CardDescription>
              {t('dashboard.viewAndCreateTests')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/tests">
                  <FlaskConicalIcon className="mr-2 h-4 w-4" />
                  {t('dashboard.allTests')}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/tests/new">
                  <ActivityIcon className="mr-2 h-4 w-4" />
                  {t('nav.createTest')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          <CardDescription>
            {t('dashboard.recentActivitySubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
              {t('dashboard.noActivityYet')}
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Link
                  key={activity.id}
                  href={activity.link as any}
                  className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="mt-1">
                    {activity.type === 'project_created' && (
                      <FolderIcon className="text-muted-foreground h-5 w-5" />
                    )}
                    {activity.type === 'test_created' && (
                      <FlaskConicalIcon className="text-muted-foreground h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-muted-foreground text-xs">{activity.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
