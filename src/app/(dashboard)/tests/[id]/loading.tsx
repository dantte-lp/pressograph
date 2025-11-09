import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

/**
 * Loading state for Test Detail Page
 *
 * Provides skeleton UI while test data is being fetched
 * Improves perceived performance and user experience
 */
export default function TestDetailLoading() {
  return (
    <div className="container mx-auto space-y-6 p-6 lg:p-8">
      {/* Breadcrumb Skeleton */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/tests">Tests</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              <Skeleton className="h-4 w-24" />
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-2" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-10" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-6">
        <div className="flex gap-4 border-b">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Content Cards Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Large Content Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
