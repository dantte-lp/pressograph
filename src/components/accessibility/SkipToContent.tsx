import React from 'react';
import { useLanguage } from '../../i18n';

/**
 * Skip-to-content link for keyboard navigation
 * Allows users to bypass navigation and jump directly to main content
 */
export const SkipToContent: React.FC = () => {
  const { t } = useLanguage();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      {t.accessibility.skipToContent}
    </a>
  );
};
