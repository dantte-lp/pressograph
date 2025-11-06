/**
 * Theme initialization script
 *
 * This script is injected into the HTML to prevent FOUC (Flash of Unstyled Content)
 * It runs before React hydration to set the correct theme class on the document
 */

export const themeInitScript = `
(function() {
  // Get theme from cookie
  function getThemeFromCookie() {
    const match = document.cookie.match(/theme=([^;]+)/);
    return match ? match[1] : null;
  }

  // Get system theme preference
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Apply theme to document
  function applyTheme(theme) {
    const root = document.documentElement;
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    root.setAttribute('data-theme', effectiveTheme);
    root.style.colorScheme = effectiveTheme;
  }

  // Get theme from cookie or default to system
  const theme = getThemeFromCookie() || 'system';
  applyTheme(theme);

  // Store theme in window for React to pick up
  window.__INITIAL_THEME__ = theme;

  // Listen for system theme changes if using system theme
  if (theme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', function() {
      if (getThemeFromCookie() === 'system') {
        applyTheme('system');
      }
    });
  }
})();
`;

/**
 * Get theme init script tag for injection into HTML
 */
export function getThemeScriptTag(): string {
  return `<script>${themeInitScript}</script>`;
}

/**
 * React component for theme script injection
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: themeInitScript,
      }}
    />
  );
}