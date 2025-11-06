import Link from 'next/link';
import {
  LineChart,
  Download,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/header';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              Professional Pressure Test Visualization
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Visualize Pressure Tests
              <span className="block text-primary">With Precision</span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Professional platform for generating, managing, and sharing pressure test graphs.
              Transform raw test data into beautiful, exportable visualizations in seconds.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="text-base">
                <Link href="/projects">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link href="/docs">
                  View Documentation
                </Link>
              </Button>
            </div>

            {/* Hero Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 border-t pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10+</div>
                <div className="text-sm text-muted-foreground">Export Formats</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">Real-time</div>
                <div className="text-sm text-muted-foreground">Visualization</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Type Safe</div>
              </div>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <div className="h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground">
              Comprehensive tools for professional pressure test visualization and management
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-time Visualization</CardTitle>
                <CardDescription>
                  Generate interactive pressure test graphs instantly with our advanced charting engine.
                  See your data come to life with smooth animations and responsive controls.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Multiple Export Formats</CardTitle>
                <CardDescription>
                  Export your graphs to PNG, PDF, SVG, JSON, CSV, and more. Share your results
                  with stakeholders in their preferred format with a single click.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Collaborative Management</CardTitle>
                <CardDescription>
                  Work together with your team. Share projects, manage permissions, and collaborate
                  on pressure test data in real-time with role-based access control.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Built-in analytics dashboard provides insights into your test data. Track trends,
                  identify patterns, and make data-driven decisions with ease.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Built on Next.js 16 and React 19 with cutting-edge performance optimizations.
                  Experience instant page loads and smooth interactions.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Industry-standard authentication, encrypted data storage, and comprehensive audit logs.
                  Your test data is protected with enterprise-grade security.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/20 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started with Pressograph in three simple steps
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 md:grid-cols-3">
              {/* Step 1 */}
              <div className="relative text-center">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="mb-3 text-xl font-semibold">Create Your Project</h3>
                <p className="text-muted-foreground">
                  Sign up and create a new project. Give it a name, add a description,
                  and invite team members to collaborate.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative text-center">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="mb-3 text-xl font-semibold">Upload Test Data</h3>
                <p className="text-muted-foreground">
                  Import your pressure test data from CSV, JSON, or enter it manually.
                  Our intelligent parser handles various formats automatically.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative text-center">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="mb-3 text-xl font-semibold">Generate & Export</h3>
                <p className="text-muted-foreground">
                  Watch your data transform into beautiful graphs. Customize colors, labels,
                  and export in your preferred format instantly.
                </p>
              </div>
            </div>

            {/* Features checklist */}
            <div className="mt-16 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <div className="font-semibold">No credit card required</div>
                  <div className="text-sm text-muted-foreground">Start using Pressograph immediately</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <div className="font-semibold">Unlimited projects</div>
                  <div className="text-sm text-muted-foreground">Create as many projects as you need</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <div className="font-semibold">Team collaboration</div>
                  <div className="text-sm text-muted-foreground">Invite unlimited team members</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <div className="font-semibold">24/7 support</div>
                  <div className="text-sm text-muted-foreground">Get help whenever you need it</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Globe className="h-4 w-4" />
              Built with Modern Technology
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Powered by the Best
            </h2>
            <p className="text-lg text-muted-foreground">
              Pressograph 2.0 is built with cutting-edge technologies for maximum performance and reliability
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="mb-2 text-2xl font-bold">Next.js 16</div>
                    <div className="text-sm text-muted-foreground">App Router & RSC</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="mb-2 text-2xl font-bold">React 19</div>
                    <div className="text-sm text-muted-foreground">Latest Stable</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="mb-2 text-2xl font-bold">TypeScript</div>
                    <div className="text-sm text-muted-foreground">100% Type Safe</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="mb-2 text-2xl font-bold">PostgreSQL</div>
                    <div className="text-sm text-muted-foreground">Reliable Storage</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground md:py-32">
        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-lg opacity-90">
              Join professionals who trust Pressograph for their pressure test visualization needs.
              Start creating beautiful graphs today.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="text-base"
              >
                <Link href="/projects">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 text-base"
              >
                <Link href="/dashboard">
                  View Dashboard
                </Link>
              </Button>
            </div>

            <div className="mt-12 text-sm opacity-75">
              No credit card required • Free forever • Cancel anytime
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-1/4 -top-1/2 h-[800px] w-[800px] rounded-full bg-primary-foreground/5" />
          <div className="absolute -bottom-1/2 -left-1/4 h-[800px] w-[800px] rounded-full bg-primary-foreground/5" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-4 text-lg font-bold">Pressograph</div>
              <p className="text-sm text-muted-foreground">
                Professional pressure test visualization platform for modern engineering teams.
              </p>
            </div>

            <div>
              <div className="mb-4 text-sm font-semibold">Product</div>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/projects" className="text-muted-foreground hover:text-foreground">
                    Projects
                  </Link>
                </li>
                <li>
                  <Link href="/tests" className="text-muted-foreground hover:text-foreground">
                    Tests
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="mb-4 text-sm font-semibold">Resources</div>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/docs" className="text-muted-foreground hover:text-foreground">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/api-docs" className="text-muted-foreground hover:text-foreground">
                    API Documentation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="mb-4 text-sm font-semibold">Legal</div>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Pressograph. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
