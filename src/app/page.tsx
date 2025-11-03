import { ThemeToggle } from '@/components/theme';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="absolute right-8 top-8">
        <ThemeToggle />
      </div>
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold">Pressograph 2.0</h1>
        <p className="mt-4 text-lg">
          Professional pressure test visualization platform - Full Stack Edition
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h2 className="text-xl font-semibold">Tech Stack</h2>
            <ul className="mt-2 space-y-1">
              <li>✓ Next.js 16.0.1</li>
              <li>✓ React 19.2.0</li>
              <li>✓ TypeScript 5.9.3</li>
              <li>✓ TailwindCSS 4.1.16</li>
              <li>✓ Drizzle ORM 0.44.7</li>
              <li>✓ PostgreSQL 18</li>
              <li>✓ Valkey 9</li>
            </ul>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="text-xl font-semibold">Features</h2>
            <ul className="mt-2 space-y-1">
              <li>✓ Modern Full Stack</li>
              <li>✓ Type-safe with TS</li>
              <li>✓ Server Components</li>
              <li>✓ Dark/Light Theme</li>
              <li>✓ Podman Container</li>
              <li>✓ Production Ready</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
