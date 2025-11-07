/**
 * Dashboard Types
 *
 * Type definitions for dashboard statistics and activity feed
 */

export interface DashboardStats {
  totalProjects: number;
  activeTests: number;
  recentRuns: number;
  storageUsed: number; // in bytes
  testSuccessRate: number; // percentage 0-100
}

export interface ActivityItem {
  id: string;
  type: 'test_created' | 'test_run' | 'graph_generated' | 'project_created' | 'test_completed' | 'test_failed';
  title: string;
  description: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  metadata?: {
    testId?: string;
    testNumber?: string;
    projectId?: string;
    projectName?: string;
    runId?: string;
    status?: string;
  };
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  variant?: 'default' | 'secondary' | 'outline';
}
