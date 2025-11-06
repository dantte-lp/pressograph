/**
 * Theme Test Page
 *
 * Tests the three-tier theme system
 */

import { getServerTheme } from '@/lib/theme/server';
import { ThemeToggle, SimpleThemeToggle } from '@/components/ui/theme-toggle';

export default async function ThemeTestPage() {
  // Get theme on server for SSR
  const serverTheme = await getServerTheme();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Theme System Test</h1>

      <div className="space-y-8">
        {/* Server-side theme info */}
        <section className="rounded-lg border p-6">
          <h2 className="text-2xl font-semibold mb-4">Server-Side Theme</h2>
          <p className="text-muted-foreground mb-2">
            Theme detected on server (SSR):
          </p>
          <code className="inline-block px-3 py-1 bg-muted rounded">
            {serverTheme}
          </code>
        </section>

        {/* Theme controls */}
        <section className="rounded-lg border p-6">
          <h2 className="text-2xl font-semibold mb-4">Theme Controls</h2>

          <div className="flex gap-4 items-center">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Dropdown Toggle:</p>
              <ThemeToggle />
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Simple Toggle:</p>
              <SimpleThemeToggle />
            </div>
          </div>
        </section>

        {/* Color preview */}
        <section className="rounded-lg border p-6">
          <h2 className="text-2xl font-semibold mb-4">Color Preview</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-background border rounded">
              <p className="font-medium">Background</p>
              <p className="text-sm text-muted-foreground">Default background color</p>
            </div>

            <div className="p-4 bg-card border rounded">
              <p className="font-medium">Card</p>
              <p className="text-sm text-muted-foreground">Card background color</p>
            </div>

            <div className="p-4 bg-primary text-primary-foreground rounded">
              <p className="font-medium">Primary</p>
              <p className="text-sm">Primary brand color</p>
            </div>

            <div className="p-4 bg-secondary text-secondary-foreground rounded">
              <p className="font-medium">Secondary</p>
              <p className="text-sm">Secondary color</p>
            </div>

            <div className="p-4 bg-muted text-muted-foreground rounded">
              <p className="font-medium">Muted</p>
              <p className="text-sm">Muted background</p>
            </div>

            <div className="p-4 bg-accent text-accent-foreground rounded">
              <p className="font-medium">Accent</p>
              <p className="text-sm">Accent color</p>
            </div>
          </div>
        </section>

        {/* Theme persistence info */}
        <section className="rounded-lg border p-6">
          <h2 className="text-2xl font-semibold mb-4">Three-Tier Persistence</h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🍪</span>
              <div>
                <p className="font-medium">Tier 1: Cookie</p>
                <p className="text-sm text-muted-foreground">
                  Instant persistence, works for anonymous users
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="font-medium">Tier 2: Valkey Cache</p>
                <p className="text-sm text-muted-foreground">
                  Fast access for authenticated users, 1-hour TTL
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">💾</span>
              <div>
                <p className="font-medium">Tier 3: Database</p>
                <p className="text-sm text-muted-foreground">
                  Permanent storage, syncs across devices
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features checklist */}
        <section className="rounded-lg border p-6">
          <h2 className="text-2xl font-semibold mb-4">Features Checklist</h2>

          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>No FOUC (Flash of Unstyled Content)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Server-side rendering support</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>System theme detection</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Syncs across devices (for logged-in users)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Works for anonymous users</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Graceful degradation</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}