// ═══════════════════════════════════════════════════════════════════
// Login Page Component
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Card, CardHeader, CardBody, Input, Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguage } from '../i18n';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/v1`;

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      login(data.user, data.accessToken, data.refreshToken);
      navigate('/');
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-default-100 dark:via-background dark:to-default-100 p-4">
      <Card className="w-full max-w-md" shadow="lg">
        <CardHeader className="flex flex-col gap-3 items-start pb-6">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div>
              <h1 className="text-2xl font-bold">Pressograph</h1>
              <p className="text-sm text-default-500">Sign in to your account</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div className="bg-danger-50 dark:bg-danger-100/20 text-danger border border-danger-200 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Username"
              labelPlacement="outside"
              placeholder="Enter your username"
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
              label="Password"
              labelPlacement="outside"
              placeholder="Enter your password"
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

            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={isLoading}
              className="mt-2"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
