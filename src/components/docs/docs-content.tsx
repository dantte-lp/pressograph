'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpenIcon,
  RocketIcon,
  FlaskConicalIcon,
  FolderIcon,
  ShareIcon,
  SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';

export function DocsContent() {
  const { t } = useTranslation();

  const sections = [
    {
      title: t('docs.gettingStarted'),
      icon: RocketIcon,
      description: t('docs.gettingStartedDescription'),
      items: [
        { label: 'Introduction', href: '#introduction' },
        { label: 'Creating Your First Project', href: '#first-project' },
        { label: 'Running a Pressure Test', href: '#first-test' },
        { label: 'Understanding Results', href: '#results' },
      ],
    },
    {
      title: t('docs.projectsSection'),
      icon: FolderIcon,
      description: t('docs.projectsDescription'),
      items: [
        { label: 'Creating Projects', href: '#create-project' },
        { label: 'Project Settings', href: '#project-settings' },
        { label: 'Archiving Projects', href: '#archive-project' },
        { label: 'Managing Tests', href: '#manage-tests' },
      ],
    },
    {
      title: t('docs.testsSection'),
      icon: FlaskConicalIcon,
      description: t('docs.testsDescription'),
      items: [
        { label: 'Test Configuration', href: '#test-config' },
        { label: 'Test Templates', href: '#templates' },
        { label: 'Running Tests', href: '#run-tests' },
        { label: 'Test History', href: '#test-history' },
      ],
    },
    {
      title: t('docs.sharingSection'),
      icon: ShareIcon,
      description: t('docs.sharingDescription'),
      items: [
        { label: 'Generating Graphs', href: '#generate-graphs' },
        { label: 'Export Formats', href: '#export-formats' },
        { label: 'Sharing Links', href: '#share-links' },
        { label: 'Download Options', href: '#downloads' },
      ],
    },
    {
      title: t('docs.settingsSection'),
      icon: SettingsIcon,
      description: t('docs.settingsDescription'),
      items: [
        { label: 'Profile Settings', href: '#profile' },
        { label: 'Theme Settings', href: '#theme' },
        { label: 'Notification Preferences', href: '#notifications' },
        { label: 'Security Settings', href: '#security' },
      ],
    },
  ];

  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary text-primary-foreground p-3 rounded-lg">
          <BookOpenIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('docs.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('docs.subtitle')}
          </p>
        </div>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle>{t('docs.quickStart')}</CardTitle>
          <CardDescription>
            {t('docs.quickStartSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold mb-2">1. Create a Project</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Projects help you organize related pressure tests. Start by creating your first
                project.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/projects">{t('nav.projects')}</Link>
              </Button>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold mb-2">2. Create a Test</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Configure your pressure test parameters including working pressure, duration, and
                intermediate stages.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/tests/new">{t('nav.createTest')}</Link>
              </Button>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold mb-2">3. Run and Monitor</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Execute your test and monitor the results in real-time through the dashboard.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">{t('nav.dashboard')}</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2 rounded-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription className="mt-1">{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href as any}
                        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Need Help */}
      <Card>
        <CardHeader>
          <CardTitle>{t('docs.needHelp')}</CardTitle>
          <CardDescription>{t('docs.needHelpDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('docs.cannotFindHelp')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/api-docs">{t('nav.apiDocs')}</Link>
              </Button>
              <Button asChild variant="outline">
                <a href="https://github.com/dantte-lp/pressograph" target="_blank" rel="noopener noreferrer">
                  GitHub Repository
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
