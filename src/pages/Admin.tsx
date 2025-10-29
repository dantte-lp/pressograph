// ═══════════════════════════════════════════════════════════════════
// Admin Page - Administration Dashboard
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { useLanguage } from '../i18n';

export const Admin: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col gap-2 pb-4">
            <h1 className="text-3xl font-bold">
              {t.admin}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              System administration and user management
            </p>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-6xl mb-4">⚙️</div>
              <h2 className="text-2xl font-semibold mb-2">
                Coming Soon
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                Admin dashboard is under development.
                You'll be able to manage users, view analytics, and configure system settings here.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-3xl mb-2">👥</div>
                  <h3 className="font-semibold mb-1">User Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create, edit, and manage user accounts
                  </p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="font-semibold mb-1">Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View usage statistics and system metrics
                  </p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-3xl mb-2">🛡️</div>
                  <h3 className="font-semibold mb-1">Security</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Audit logs and security settings
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
