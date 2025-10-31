// ═══════════════════════════════════════════════════════════════════
// Version Display Component
// ═══════════════════════════════════════════════════════════════════

/**
 * Version component displays app version and commit hash at the bottom of the site
 * Useful for development and debugging
 */
export const Version = () => {
  // Read version from environment variables directly (no need for state)
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.2.0';
  const commitHash = (import.meta.env.VITE_COMMIT_HASH || 'dev').substring(0, 7);

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2 border-t border-gray-200 dark:border-gray-700">
      <span className="font-mono">
        Pressograph v{appVersion} ({commitHash})
      </span>
    </div>
  );
};
