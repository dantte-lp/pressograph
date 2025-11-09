/**
 * API Documentation Page
 *
 * API reference and code examples
 *
 * @route /api-docs
 */

import { requireAuth } from '@/lib/auth/server-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CodeIcon, KeyIcon, BookOpenIcon, ZapIcon } from 'lucide-react';

export const metadata = {
  title: 'API Documentation | Pressograph',
  description: 'API reference and integration guide',
};

export default async function ApiDocsPage() {
  await requireAuth();

  const endpoints = [
    {
      method: 'GET',
      path: '/api/projects',
      description: 'List all projects',
      auth: true,
    },
    {
      method: 'POST',
      path: '/api/projects',
      description: 'Create a new project',
      auth: true,
    },
    {
      method: 'GET',
      path: '/api/projects/:id',
      description: 'Get project details',
      auth: true,
    },
    {
      method: 'PUT',
      path: '/api/projects/:id',
      description: 'Update project',
      auth: true,
    },
    {
      method: 'DELETE',
      path: '/api/projects/:id',
      description: 'Delete project',
      auth: true,
    },
    {
      method: 'GET',
      path: '/api/tests',
      description: 'List all pressure tests',
      auth: true,
    },
    {
      method: 'POST',
      path: '/api/tests',
      description: 'Create a new test',
      auth: true,
    },
    {
      method: 'GET',
      path: '/api/tests/:id',
      description: 'Get test details',
      auth: true,
    },
    {
      method: 'POST',
      path: '/api/tests/:id/run',
      description: 'Execute a test',
      auth: true,
    },
    {
      method: 'GET',
      path: '/api/tests/:id/runs',
      description: 'Get test run history',
      auth: true,
    },
  ];

  return (
    <div className="container mx-auto space-y-8 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary text-primary-foreground p-3 rounded-lg">
          <CodeIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
          <p className="text-muted-foreground mt-1">
            REST API reference and integration guide
          </p>
        </div>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ZapIcon className="h-5 w-5 text-primary" />
            <CardTitle>Getting Started</CardTitle>
          </div>
          <CardDescription>Quick start guide for API integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Base URL</h3>
            <code className="block bg-muted p-3 rounded-lg text-sm">
              https://your-domain.com/api
            </code>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Authentication</h3>
            <p className="text-sm text-muted-foreground mb-2">
              All API requests require authentication using NextAuth session cookies or API tokens.
            </p>
            <code className="block bg-muted p-3 rounded-lg text-sm">
              {`curl -X GET "https://your-domain.com/api/projects" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json"`}
            </code>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Response Format</h3>
            <p className="text-sm text-muted-foreground mb-2">
              All responses are returned in JSON format:
            </p>
            <code className="block bg-muted p-3 rounded-lg text-sm font-mono">
              {`{
  "success": true,
  "data": {...},
  "error": null
}`}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BookOpenIcon className="h-5 w-5 text-primary" />
            <CardTitle>API Endpoints</CardTitle>
          </div>
          <CardDescription>Available REST API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {endpoints.map((endpoint, index) => (
              <div
                key={index}
                className="flex items-start gap-4 border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <Badge
                  variant={
                    endpoint.method === 'GET'
                      ? 'default'
                      : endpoint.method === 'POST'
                      ? 'secondary'
                      : endpoint.method === 'PUT'
                      ? 'outline'
                      : 'destructive'
                  }
                  className="font-mono min-w-[60px] justify-center"
                >
                  {endpoint.method}
                </Badge>
                <div className="flex-1">
                  <code className="text-sm font-mono">{endpoint.path}</code>
                  <p className="text-sm text-muted-foreground mt-1">
                    {endpoint.description}
                  </p>
                </div>
                {endpoint.auth && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <KeyIcon className="h-3 w-3" />
                    <span>Auth</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>Integration examples in different languages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* JavaScript/TypeScript Example */}
          <div>
            <h3 className="font-semibold mb-3">JavaScript / TypeScript</h3>
            <code className="block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
              {`// Fetch all projects
const response = await fetch('/api/projects', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});

const data = await response.json();

// Create a new project
const newProject = await fetch('/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'My Project',
    description: 'Project description',
  }),
});`}
            </code>
          </div>

          {/* Python Example */}
          <div>
            <h3 className="font-semibold mb-3">Python</h3>
            <code className="block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
              {`import requests

# Fetch all projects
response = requests.get(
    'https://your-domain.com/api/projects',
    headers={
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    }
)

projects = response.json()

# Create a new project
new_project = requests.post(
    'https://your-domain.com/api/projects',
    headers={
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    json={
        'name': 'My Project',
        'description': 'Project description'
    }
)`}
            </code>
          </div>

          {/* curl Example */}
          <div>
            <h3 className="font-semibold mb-3">cURL</h3>
            <code className="block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
              {`# Fetch all projects
curl -X GET "https://your-domain.com/api/projects" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json"

# Create a new project
curl -X POST "https://your-domain.com/api/projects" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Project",
    "description": "Project description"
  }'`}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits & Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limits & Best Practices</CardTitle>
          <CardDescription>Guidelines for API usage</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Rate limit: 100 requests per minute per user</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Use pagination for large datasets</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Implement proper error handling for all requests</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Cache responses when appropriate</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Use HTTPS for all API requests</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
