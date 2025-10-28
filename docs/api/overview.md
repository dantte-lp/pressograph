# API Overview

Pressograph provides a comprehensive RESTful API for programmatic access to all platform features.

## Base URL

```
Production: https://api.pressograph.com/api/v1
Development: http://localhost:3001/api/v1
```

## Authentication

Most API endpoints require authentication using JWT (JSON Web Tokens).

### Obtaining Tokens

1. **Login** to receive access and refresh tokens:

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

Response:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Using Access Tokens

Include the access token in the `Authorization` header:

```bash
curl -X GET http://localhost:3001/api/v1/graph/history \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refreshing Tokens

Access tokens expire after 15 minutes. Use the refresh token to obtain a new access token:

```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authenticated requests**: 100 requests per minute
- **Public endpoints**: 20 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698504000
```

## Response Format

All API responses follow a consistent JSON format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    "Detailed error message 1",
    "Detailed error message 2"
  ]
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 501 | Not Implemented |

## API Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### Graphs

- `POST /graph/generate` - Generate graph from settings
- `POST /graph/export/png` - Export graph as PNG
- `POST /graph/export/pdf` - Export graph as PDF
- `POST /graph/validate` - Validate graph settings
- `GET /graph/history` - Get generation history
- `POST /graph/share` - Create share link

### Public (No Auth Required)

- `GET /public/share/:token` - View shared graph
- `GET /public/share/:token/download` - Download shared graph
- `GET /public/share/:token/info` - Get share link info

### Admin

- `GET /admin/dashboard` - Get dashboard data
- `GET /admin/users` - List all users
- `POST /admin/users` - Create new user
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user

## OpenAPI Specification

The complete API specification is available in OpenAPI 3.0 format:

- [OpenAPI YAML](../../openapi.yaml)
- [Interactive API Explorer](#) (coming soon)

## Code Examples

### JavaScript/TypeScript

```typescript
const API_URL = 'http://localhost:3001/api/v1';

// Login
const login = async (username: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return await response.json();
};

// Generate graph
const generateGraph = async (token: string, settings: any) => {
  const response = await fetch(`${API_URL}/graph/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });
  return await response.json();
};
```

### Python

```python
import requests

API_URL = 'http://localhost:3001/api/v1'

# Login
def login(username, password):
    response = requests.post(f'{API_URL}/auth/login', json={
        'username': username,
        'password': password
    })
    return response.json()

# Generate graph
def generate_graph(token, settings):
    response = requests.post(
        f'{API_URL}/graph/generate',
        headers={'Authorization': f'Bearer {token}'},
        json=settings
    )
    return response.json()
```

### cURL

```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Generate graph
curl -X POST http://localhost:3001/api/v1/graph/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @graph-settings.json
```

## Webhooks

Webhook support is coming soon. You'll be able to subscribe to events such as:

- Graph generation completed
- Share link accessed
- User created/updated
- System alerts

## SDK Libraries

Official SDKs are planned for:

- JavaScript/TypeScript
- Python
- Go

## Support

For API support:

- [GitHub Issues](https://github.com/dantte-lp/pressograph/issues)
- [API Examples](examples.md)
- [Endpoint Reference](endpoints.md)
