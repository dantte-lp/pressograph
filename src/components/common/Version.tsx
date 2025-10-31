// ═══════════════════════════════════════════════════════════════════
// Version Display Component
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';

/**
 * Version component displays app version and commit hash at the bottom of the site
 * Useful for development and debugging
 */
export const Version = () => {
  const [version, setVersion] = useState('');
  const [commit, setCommit] = useState('');

  useEffect(() => {
    // In production, version comes from build environment variables
    // In development, use default values
    const appVersion = import.meta.env.VITE_APP_VERSION || '1.2.0';
    const commitHash = import.meta.env.VITE_COMMIT_HASH || 'dev';
    setVersion(appVersion);
    setCommit(commitHash.substring(0, 7));
  }, []);

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2 border-t border-gray-200 dark:border-gray-700">
      <span className="font-mono">
        Pressograph v{version} ({commit})
      </span>
    </div>
  );
};
