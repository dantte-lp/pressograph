/**
 * Setup Wizard Page
 *
 * Multi-step initialization wizard for first-time setup.
 * Creates admin user and default organization.
 *
 * Features:
 * - Welcome screen with prerequisites
 * - Database health check
 * - Admin account creation
 * - Organization setup
 * - Success confirmation
 *
 * @route /setup
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  Database,
  Building2,
  UserCog,
  Rocket,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import type { SetupStatus } from "@/lib/setup/validation";

type Step = "welcome" | "health" | "admin" | "organization" | "complete";

interface FormData {
  admin: {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  organization: {
    name: string;
    slug: string;
    defaultLanguage: "en" | "ru";
  };
}

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [formData, setFormData] = useState<FormData>({
    admin: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    organization: {
      name: "Default Organization",
      slug: "default",
      defaultLanguage: "en",
    },
  });

  // Check setup status on mount
  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch("/api/setup/status");
      const result = await response.json();

      if (result.success && result.data) {
        setSetupStatus(result.data);

        // Redirect to login if setup is already complete
        if (!result.data.isSetupRequired) {
          router.push("/auth/signin");
        }
      }
    } catch (err) {
      console.error("Failed to check setup status:", err);
      setError("Failed to connect to server. Please ensure the application is running.");
    }
  };

  const handleNext = async () => {
    setError(null);

    if (currentStep === "welcome") {
      setCurrentStep("health");
      // Recheck database status
      await checkSetupStatus();
    } else if (currentStep === "health") {
      if (!setupStatus?.database.isConnected) {
        setError("Cannot proceed: Database is not connected");
        return;
      }
      setCurrentStep("admin");
    } else if (currentStep === "admin") {
      // Validate admin form
      if (!validateAdminForm()) {
        return;
      }
      setCurrentStep("organization");
    } else if (currentStep === "organization") {
      // Submit setup
      await handleSubmit();
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === "health") setCurrentStep("welcome");
    else if (currentStep === "admin") setCurrentStep("health");
    else if (currentStep === "organization") setCurrentStep("admin");
  };

  const validateAdminForm = (): boolean => {
    const { name, username, email, password, confirmPassword } = formData.admin;

    if (!name || name.length < 2) {
      setError("Name must be at least 2 characters");
      return false;
    }

    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError("Username can only contain letters, numbers, underscores, and hyphens");
      return false;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, and one number");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/setup/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admin: {
            name: formData.admin.name,
            username: formData.admin.username,
            email: formData.admin.email,
            password: formData.admin.password,
            confirmPassword: formData.admin.confirmPassword,
          },
          organization: formData.organization,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to initialize application");
      }

      setCurrentStep("complete");
    } catch (err) {
      console.error("Setup failed:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize application");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (section: "admin" | "organization", field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const getProgress = () => {
    const steps: Step[] = ["welcome", "health", "admin", "organization", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Pressograph Setup</CardTitle>
              <CardDescription>Initialize your pressure test visualization platform</CardDescription>
            </div>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Welcome Step */}
          {currentStep === "welcome" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Welcome to Pressograph</h2>
                <p className="text-muted-foreground">
                  This wizard will guide you through the initial setup process.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Verify database connection</p>
                    <p className="text-sm text-muted-foreground">Ensure PostgreSQL is running and accessible</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Create administrator account</p>
                    <p className="text-sm text-muted-foreground">Set up your admin user credentials</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Configure organization</p>
                    <p className="text-sm text-muted-foreground">Set up your organization details</p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Before you begin:</strong> Ensure your PostgreSQL database is running and the DATABASE_URL environment variable is correctly configured.
                </AlertDescription>
              </Alert>

              <Button onClick={handleNext} className="w-full" size="lg">
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Health Check Step */}
          {currentStep === "health" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">System Health Check</h2>
                <p className="text-muted-foreground">Verifying system requirements and database connection</p>
              </div>

              <div className="space-y-4">
                {/* Database Connection */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Database Connection</span>
                    </div>
                    <Badge variant={setupStatus?.database.isConnected ? "default" : "destructive"}>
                      {setupStatus?.database.isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>

                  {setupStatus?.database.isConnected && setupStatus.database.version && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Database:</span>
                        <span className="font-mono">{setupStatus.database.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Version:</span>
                        <span className="font-mono text-xs">{setupStatus.database.version.split(" ")[1]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tables:</span>
                        <span className="font-mono">{setupStatus.database.tableCount}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin User */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserCog className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Admin User</span>
                    </div>
                    <Badge variant={setupStatus?.adminUserExists ? "default" : "secondary"}>
                      {setupStatus?.adminUserExists ? "Exists" : "Not Created"}
                    </Badge>
                  </div>
                </div>

                {/* Organization */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Organization</span>
                    </div>
                    <Badge variant={(setupStatus?.organizationCount ?? 0) > 0 ? "default" : "secondary"}>
                      {setupStatus?.organizationCount ?? 0} Created
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1" disabled={!setupStatus?.database.isConnected}>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Admin User Step */}
          {currentStep === "admin" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Create Administrator Account</h2>
                <p className="text-muted-foreground">This account will have full access to all features and settings</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.admin.name}
                    onChange={(e) => updateFormData("admin", "name", e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="admin"
                    value={formData.admin.username}
                    onChange={(e) => updateFormData("admin", "username", e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">Letters, numbers, underscores, and hyphens only</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.admin.email}
                    onChange={(e) => updateFormData("admin", "email", e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={formData.admin.password}
                    onChange={(e) => updateFormData("admin", "password", e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must contain uppercase, lowercase, and numbers
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.admin.confirmPassword}
                    onChange={(e) => updateFormData("admin", "confirmPassword", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isLoading}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1" disabled={isLoading}>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Organization Step */}
          {currentStep === "organization" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Organization Setup</h2>
                <p className="text-muted-foreground">Configure your organization details</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    placeholder="My Organization"
                    value={formData.organization.name}
                    onChange={(e) => {
                      updateFormData("organization", "name", e.target.value);
                      // Auto-generate slug
                      const slug = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .replace(/\s+/g, "-");
                      updateFormData("organization", "slug", slug);
                    }}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgSlug">Organization Slug</Label>
                  <Input
                    id="orgSlug"
                    placeholder="my-organization"
                    value={formData.organization.slug}
                    onChange={(e) => updateFormData("organization", "slug", e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <select
                    id="language"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={formData.organization.defaultLanguage}
                    onChange={(e) =>
                      updateFormData("organization", "defaultLanguage", e.target.value)
                    }
                    disabled={isLoading}
                  >
                    <option value="en">English</option>
                    <option value="ru">Russian</option>
                  </select>
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isLoading}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      Initialize Application
                      <Rocket className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === "complete" && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-2">Setup Complete!</h2>
                <p className="text-muted-foreground">Your Pressograph installation is ready to use</p>
              </div>

              <Alert>
                <Rocket className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-left space-y-2">
                    <p className="font-semibold">Next Steps:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Sign in with your administrator account</li>
                      <li>Configure application settings in the admin panel</li>
                      <li>Create additional user accounts as needed</li>
                      <li>Start uploading and visualizing pressure test data</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>

              <Button onClick={() => router.push("/auth/signin")} className="w-full" size="lg">
                Go to Sign In
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
