import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { getProjectById } from '@/lib/actions/projects';
import { ProjectSettingsForm } from '@/components/projects/project-settings-form';

interface ProjectSettingsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectSettingsPage({
  params,
}: ProjectSettingsPageProps) {
  // Await params (Next.js 16+)
  const { id } = await params;

  const t = await getTranslations('projects');

  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-8">
      {/* Breadcrumb */}
      <nav className="text-muted-foreground flex items-center gap-2 text-sm">
        <Link href="/projects" className="hover:text-foreground">
          {t('title')}
        </Link>
        <span>/</span>
        <Link href={`/projects/${project.id}` as any} className="hover:text-foreground">
          {project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{t('settings')}</span>
      </nav>

      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('projectSettings')}</h1>
        <p className="text-muted-foreground text-lg">
          {t('projectSettingsDescription')}
        </p>
      </div>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('generalSettings')}</CardTitle>
          <CardDescription>
            {t('generalSettingsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectSettingsForm project={project} />
        </CardContent>
      </Card>
    </div>
  );
}
