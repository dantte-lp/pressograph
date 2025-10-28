// ═══════════════════════════════════════════════════════════════════
// First-Time Setup Page Component
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Input, Button, Divider, Progress, Accordion, AccordionItem, Chip } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n';
import { useInitializationStore } from '../store/useInitializationStore';

interface DatabaseInfo {
  version: string;
  name: string;
  user: string;
  host: string;
  port: string;
}

interface SchemaInfo {
  tables: string[];
  tableCount: number;
  totalRows: number;
  size: string;
  version: string;
}

interface SetupStatusResponse {
  success: boolean;
  initialized: boolean;
  userCount: number;
  database: DatabaseInfo | null;
  schema: SchemaInfo | null;
}

interface SetupStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export const SetupPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { markAsInitialized } = useInitializationStore();

  // Admin user form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Database and schema info
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null);
  const [isCheckingEnv, setIsCheckingEnv] = useState(false);

  // Fetch database info when on environment check step
  useEffect(() => {
    if (currentStep === 1) {
      fetchDatabaseInfo();
    }
  }, [currentStep]);

  const fetchDatabaseInfo = async () => {
    setIsCheckingEnv(true);
    try {
      const response = await fetch('/api/v1/setup/status');
      const data: SetupStatusResponse = await response.json();

      if (data.success) {
        setDbInfo(data.database);
        setSchemaInfo(data.schema);
      }
    } catch (err) {
      console.error('Failed to fetch database info:', err);
    } finally {
      setIsCheckingEnv(false);
    }
  };

  const steps: SetupStep[] = [
    {
      id: 0,
      title: 'Welcome',
      description: 'Welcome to Pressograph initial setup',
      completed: false,
    },
    {
      id: 1,
      title: 'Environment Check',
      description: 'Verify system requirements and configuration',
      completed: false,
    },
    {
      id: 2,
      title: 'Create Admin',
      description: 'Create your administrator account',
      completed: false,
    },
    {
      id: 3,
      title: 'Complete',
      description: 'Setup completed successfully',
      completed: false,
    },
  ];

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call to create admin user
      const response = await fetch('/api/v1/setup/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        throw new Error('Failed to create admin user');
      }

      markAsInitialized(); // Mark system as initialized
      setCurrentStep(3);
    } catch (err) {
      setError('Failed to create admin user. Please check the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const progressValue = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-default-100 dark:via-background dark:to-default-100 p-4">
      <Card className="w-full max-w-2xl" shadow="lg">
        <CardHeader className="flex flex-col gap-4 items-start pb-6">
          <div className="flex items-center gap-3 w-full">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Pressograph Setup</h1>
              <p className="text-sm text-default-500">First-time configuration wizard</p>
            </div>
          </div>
          <Progress
            value={progressValue}
            color="primary"
            className="w-full"
            aria-label="Setup progress"
          />
        </CardHeader>

        <CardBody className="gap-6">
          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-3">Welcome to Pressograph</h2>
                <p className="text-default-600 mb-4">
                  This wizard will guide you through the initial setup process. You'll need to:
                </p>
                <ul className="space-y-2 text-default-600">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Verify system requirements and database connection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Create your administrator account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Configure basic application settings</span>
                  </li>
                </ul>
              </div>

              <Divider />

              <div className="bg-warning-50 dark:bg-warning-100/20 border border-warning-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-warning-800 dark:text-warning-600 mb-1">
                      Before you begin
                    </p>
                    <p className="text-sm text-warning-700 dark:text-warning-500">
                      Make sure you have copied <code className="bg-warning-100 dark:bg-warning-900/30 px-1.5 py-0.5 rounded font-mono text-xs">.env.example</code> to <code className="bg-warning-100 dark:bg-warning-900/30 px-1.5 py-0.5 rounded font-mono text-xs">.env</code> and started the PostgreSQL database using <code className="bg-warning-100 dark:bg-warning-900/30 px-1.5 py-0.5 rounded font-mono text-xs">podman-compose up -d postgres</code>
                    </p>
                  </div>
                </div>
              </div>

              <Button
                color="primary"
                size="lg"
                onPress={() => setCurrentStep(1)}
                className="w-full"
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Step 1: Environment Check */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-3">Environment Check</h2>
                <p className="text-default-600 mb-4">
                  Verifying system requirements...
                </p>
              </div>

              {isCheckingEnv && (
                <div className="flex items-center justify-center p-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-default-500">Checking database connection...</p>
                  </div>
                </div>
              )}

              {!isCheckingEnv && (
                <Accordion variant="bordered" selectionMode="multiple">
                  {/* PostgreSQL Connection */}
                  <AccordionItem
                    key="postgres"
                    aria-label="PostgreSQL Connection"
                    startContent={
                      <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    }
                    title={
                      <div className="flex items-center justify-between flex-1 pr-2">
                        <span className="font-medium">PostgreSQL Connection</span>
                        <Chip size="sm" color={dbInfo ? "success" : "danger"} variant="flat">
                          {dbInfo ? "Connected" : "Disconnected"}
                        </Chip>
                      </div>
                    }
                  >
                    {dbInfo ? (
                      <div className="space-y-3 pb-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-default-500 uppercase font-semibold">Version</p>
                            <p className="text-sm font-mono bg-default-100 dark:bg-default-50 p-2 rounded">
                              {dbInfo.version.split(' ')[1] || 'Unknown'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-default-500 uppercase font-semibold">Database</p>
                            <p className="text-sm font-mono bg-default-100 dark:bg-default-50 p-2 rounded">
                              {dbInfo.name}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-default-500 uppercase font-semibold">User</p>
                            <p className="text-sm font-mono bg-default-100 dark:bg-default-50 p-2 rounded">
                              {dbInfo.user}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-default-500 uppercase font-semibold">Host:Port</p>
                            <p className="text-sm font-mono bg-default-100 dark:bg-default-50 p-2 rounded">
                              {dbInfo.host}:{dbInfo.port}
                            </p>
                          </div>
                        </div>
                        <Divider />
                        <div className="space-y-1">
                          <p className="text-xs text-default-500 uppercase font-semibold">Full Version String</p>
                          <p className="text-xs font-mono bg-default-100 dark:bg-default-50 p-2 rounded break-all">
                            {dbInfo.version}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="pb-2 text-sm text-danger">
                        Failed to connect to database. Please check your configuration.
                      </div>
                    )}
                  </AccordionItem>

                  {/* Database Schema */}
                  <AccordionItem
                    key="schema"
                    aria-label="Database Schema"
                    startContent={
                      <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    }
                    title={
                      <div className="flex items-center justify-between flex-1 pr-2">
                        <span className="font-medium">Database Schema</span>
                        <Chip size="sm" color={schemaInfo && schemaInfo.tableCount > 0 ? "success" : "warning"} variant="flat">
                          {schemaInfo && schemaInfo.tableCount > 0 ? "Ready" : "Empty"}
                        </Chip>
                      </div>
                    }
                  >
                    {schemaInfo ? (
                      <div className="space-y-3 pb-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-default-500 uppercase font-semibold">Tables</p>
                            <p className="text-sm font-mono bg-default-100 dark:bg-default-50 p-2 rounded">
                              {schemaInfo.tableCount}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-default-500 uppercase font-semibold">Total Rows</p>
                            <p className="text-sm font-mono bg-default-100 dark:bg-default-50 p-2 rounded">
                              {schemaInfo.totalRows.toLocaleString()}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-default-500 uppercase font-semibold">Database Size</p>
                            <p className="text-sm font-mono bg-default-100 dark:bg-default-50 p-2 rounded">
                              {schemaInfo.size}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-default-500 uppercase font-semibold">Schema Version</p>
                            <p className="text-sm font-mono bg-default-100 dark:bg-default-50 p-2 rounded">
                              {schemaInfo.version}
                            </p>
                          </div>
                        </div>
                        {schemaInfo.tables.length > 0 && (
                          <>
                            <Divider />
                            <div className="space-y-1">
                              <p className="text-xs text-default-500 uppercase font-semibold">Schema Tables</p>
                              <div className="flex flex-wrap gap-1.5">
                                {schemaInfo.tables.map((table) => (
                                  <Chip key={table} size="sm" variant="flat" color="primary">
                                    {table}
                                  </Chip>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="pb-2 text-sm text-warning">
                        No schema information available.
                      </div>
                    )}
                  </AccordionItem>

                  {/* Admin User */}
                  <AccordionItem
                    key="admin"
                    aria-label="Admin User"
                    startContent={
                      <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    }
                    title={
                      <div className="flex items-center justify-between flex-1 pr-2">
                        <span className="font-medium">Admin User</span>
                        <Chip size="sm" color="warning" variant="flat">
                          Not Created
                        </Chip>
                      </div>
                    }
                  >
                    <div className="pb-2 text-sm text-default-600">
                      You'll create the administrator account in the next step.
                    </div>
                  </AccordionItem>
                </Accordion>
              )}

              <Divider />

              <div className="flex gap-3">
                <Button
                  variant="bordered"
                  onPress={() => setCurrentStep(0)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  color="primary"
                  onPress={() => setCurrentStep(2)}
                  className="flex-1"
                  isDisabled={isCheckingEnv || !dbInfo}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Create Admin */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-3">Create Administrator Account</h2>
                <p className="text-default-600 mb-4">
                  This account will have full access to all features and settings.
                </p>
              </div>

              {error && (
                <div className="bg-danger-50 dark:bg-danger-100/20 text-danger border border-danger-200 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <Input
                  label="Username"
                  labelPlacement="outside"
                  placeholder="admin"
                  value={username}
                  onValueChange={setUsername}
                  variant="bordered"
                  isRequired
                  startContent={
                    <svg className="w-4 h-4 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />

                <Input
                  label="Email"
                  labelPlacement="outside"
                  placeholder="admin@example.com"
                  type="email"
                  value={email}
                  onValueChange={setEmail}
                  variant="bordered"
                  isRequired
                  startContent={
                    <svg className="w-4 h-4 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />

                <Input
                  label="Password"
                  labelPlacement="outside"
                  placeholder="Minimum 8 characters"
                  type="password"
                  value={password}
                  onValueChange={setPassword}
                  variant="bordered"
                  isRequired
                  startContent={
                    <svg className="w-4 h-4 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />

                <Input
                  label="Confirm Password"
                  labelPlacement="outside"
                  placeholder="Re-enter password"
                  type="password"
                  value={confirmPassword}
                  onValueChange={setConfirmPassword}
                  variant="bordered"
                  isRequired
                  startContent={
                    <svg className="w-4 h-4 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />

                <Divider />

                <div className="flex gap-3">
                  <Button
                    variant="bordered"
                    onPress={() => setCurrentStep(1)}
                    className="flex-1"
                    isDisabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    isLoading={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Creating...' : 'Create Admin Account'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 3 && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                  <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3">Setup Complete!</h2>
                <p className="text-default-600 mb-4">
                  Your Pressograph installation is ready to use.
                </p>
              </div>

              <div className="bg-primary-50 dark:bg-primary-100/20 border border-primary-200 rounded-lg p-4 text-left">
                <p className="font-semibold text-primary-800 dark:text-primary-600 mb-2">
                  Next Steps:
                </p>
                <ul className="space-y-2 text-sm text-primary-700 dark:text-primary-500">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 dark:text-primary-400">1.</span>
                    <span>Sign in with your administrator account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 dark:text-primary-400">2.</span>
                    <span>Configure application settings in the admin panel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 dark:text-primary-400">3.</span>
                    <span>Create additional user accounts as needed</span>
                  </li>
                </ul>
              </div>

              <Button
                color="primary"
                size="lg"
                onPress={() => navigate('/login')}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
