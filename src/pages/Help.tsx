// ═══════════════════════════════════════════════════════════════════
// Help Page - Documentation and Support
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { useTranslation } from 'react-i18next';

export const Help: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col gap-2 pb-4">
            <h1 className="text-3xl font-bold">
              {t('navigation.help', 'Help & Documentation')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Get help and learn how to use Pressograph
            </p>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-semibold mb-2">
                Coming Soon
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                Comprehensive documentation and help center is under development.
                For now, visit our GitHub repository for guides and examples.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-3xl mb-2">🚀</div>
                  <h3 className="font-semibold mb-1">Getting Started</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Step-by-step guide to create your first graph
                  </p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-3xl mb-2">⌨️</div>
                  <h3 className="font-semibold mb-1">Keyboard Shortcuts</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Speed up your workflow with shortcuts
                  </p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-3xl mb-2">💡</div>
                  <h3 className="font-semibold mb-1">Tips & Tricks</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Best practices and advanced features
                  </p>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                <a
                  href="https://github.com/dantte-lp/pressograph"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center transition-colors"
                >
                  📖 View Documentation on GitHub
                </a>
                <a
                  href="https://github.com/dantte-lp/pressograph/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-center transition-colors"
                >
                  🐛 Report an Issue
                </a>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Help;
