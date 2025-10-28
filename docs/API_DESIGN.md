# REST API Architecture for Headless Graph Generation

## Overview

Этот документ описывает архитектуру REST API для автоматизации генерации графиков испытаний давления. API позволяет программно создавать графики без UI, что полезно для интеграции с другими системами, автоматизации отчетности и массовой генерации графиков.

## Use Cases

1. **Автоматическая генерация отчетов** - генерация PDF/PNG графиков по расписанию
2. **Интеграция с SCADA/IoT** - автоматическое создание графиков из данных датчиков
3. **Массовая обработка** - генерация множества графиков с разными параметрами
4. **Webhook интеграция** - генерация графиков по событиям из внешних систем

## Technology Stack Options

### Option 1: Express.js Backend (Recommended)
```
Frontend (React/Vite) + Backend (Express.js/Node.js)
```
**Pros:**
- Используется та же кодовая база (TypeScript/React)
- Можно переиспользовать graphGenerator.ts и canvasRenderer.ts
- Поддержка Canvas на сервере через node-canvas или puppeteer
- Простая интеграция с существующим кодом

**Cons:**
- Требует запуск отдельного сервера
- Дополнительные зависимости (node-canvas, sharp)

### Option 2: Serverless Functions (AWS Lambda / Vercel Functions)
```
Static Frontend + Serverless API
```
**Pros:**
- Масштабируемость
- Платим только за использование
- Не нужно управлять сервером

**Cons:**
- Cold start latency
- Ограничения по размеру бандла
- Сложнее для локального development

### Option 3: Hybrid - Headless Browser (Playwright/Puppeteer)
```
API вызывает браузер для рендеринга UI и экспорта
```
**Pros:**
- Полное переиспользование UI кода
- Гарантированно тот же результат что в UI

**Cons:**
- Медленнее
- Большее потребление ресурсов
- Сложнее deployment

## Recommended Architecture

**Express.js Backend с node-canvas для серверного рендеринга**

```
┌─────────────────┐
│   React SPA     │
│   (Frontend)    │
└────────┬────────┘
         │
         │ HTTP
         │
┌────────▼────────┐      ┌──────────────────┐
│  Express.js API │◄─────┤  External        │
│   (Backend)     │      │  Systems/Scripts │
└────────┬────────┘      └──────────────────┘
         │
    ┌────┴─────┬─────────┬──────────┐
    │          │         │          │
┌───▼───┐  ┌──▼───┐  ┌──▼───┐  ┌──▼─────┐
│ Graph │  │Canvas│  │ PDF  │  │  PNG   │
│ Gen   │  │Render│  │Export│  │ Export │
└───────┘  └──────┘  └──────┘  └────────┘
```

## API Endpoints

### 1. Generate Graph (JSON Response)
```
POST /api/v1/graph/generate
```

**Request:**
```json
{
  "testNumber": "20252401",
  "startDate": "2025-10-27",
  "startTime": "11:30:00",
  "endDate": "2025-10-28",
  "endTime": "11:45:00",
  "testDuration": 24.25,
  "workingPressure": 70,
  "maxPressure": 75,
  "temperature": 90,
  "pressureDuration": 15,
  "graphTitle": "График испытания давления",
  "showInfo": "under",
  "date": "2025-10-28",
  "pressureTests": [
    {
      "time": 0,
      "duration": 30,
      "pressure": 32,
      "targetPressure": 32,
      "maxPressure": 32,
      "minPressure": 32
    },
    {
      "time": 0.5,
      "duration": 15,
      "pressure": 70.32,
      "minPressure": 69.89,
      "targetPressure": 30,
      "holdDrift": 3.36
    },
    {
      "time": 8.5,
      "duration": 15,
      "pressure": 70.53,
      "minPressure": 70.01,
      "targetPressure": 31,
      "holdDrift": 1.65
    },
    {
      "time": 17.5,
      "duration": 15,
      "pressure": 70.57,
      "minPressure": 69.92,
      "targetPressure": 32,
      "holdDrift": 0.86
    },
    {
      "time": 24,
      "duration": 15,
      "pressure": 70.10,
      "minPressure": 69.87,
      "targetPressure": 0
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "points": [
      { "time": "2025-10-27T11:30:00.000Z", "pressure": 0 },
      { "time": "2025-10-27T11:30:30.000Z", "pressure": 32.15 },
      ...
    ],
    "startDateTime": "2025-10-27T11:30:00.000Z",
    "endDateTime": "2025-10-28T11:45:00.000Z",
    "pointsCount": 1523
  }
}
```

### 2. Export to PNG
```
POST /api/v1/graph/export/png
```

**Request:** Same as `/generate` with optional parameters:
```json
{
  ...testSettings,
  "exportOptions": {
    "width": 1123,
    "height": 794,
    "scale": 2,
    "theme": "light"
  }
}
```

**Response:**
```
Content-Type: image/png
Content-Disposition: attachment; filename="pressure-test-20252401.png"

<PNG binary data>
```

### 3. Export to PDF
```
POST /api/v1/graph/export/pdf
```

**Request:** Same as `/export/png`

**Response:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="pressure-test-20252401.pdf"

<PDF binary data>
```

### 4. Batch Export
```
POST /api/v1/graph/batch
```

**Request:**
```json
{
  "tests": [
    { ...testSettings1 },
    { ...testSettings2 },
    { ...testSettings3 }
  ],
  "format": "png",
  "exportOptions": { ... }
}
```

**Response:**
```
Content-Type: application/zip
Content-Disposition: attachment; filename="pressure-tests.zip"

<ZIP containing multiple PNG/PDF files>
```

### 5. Validate Settings
```
POST /api/v1/graph/validate
```

**Request:** TestSettings object

**Response:**
```json
{
  "valid": false,
  "errors": [
    {
      "field": "endDateTime",
      "message": "Дата окончания должна быть позже даты начала"
    },
    {
      "field": "pressureTests[2].time",
      "message": "Время теста 15h превышает длительность испытания 15.33h"
    }
  ]
}
```

### 6. Get Preset Templates
```
GET /api/v1/presets
GET /api/v1/presets/:name
```

**Response:**
```json
{
  "presets": {
    "standard": { ...preset },
    "daily": { ...preset },
    "extended": { ...preset }
  }
}
```

## Authentication & Security

### JWT Authentication
Приложение использует JWT (JSON Web Tokens) для аутентификации пользователей.

**Login Flow:**
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your_password"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "email": "admin@example.com"
  }
}
```

**Using JWT:**
```
GET /api/v1/graph/history
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Refresh:**
```
POST /api/v1/auth/refresh
{
  "refreshToken": "refresh_token_here"
}
```

**Logout:**
```
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

### API Key Authentication (для внешних систем)
```
POST /api/v1/graph/export/png
X-API-Key: YOUR_API_KEY_HERE
```

**Rate Limiting:**
- JWT Users: 500 requests/hour
- API Keys: 100 requests/hour
- Admin: Unlimited
- Batch endpoint: 20 requests/hour

**Security Features:**
- JWT token expiration (1 hour)
- Refresh token rotation
- Password hashing (bcrypt)
- API key rotation
- Request validation & sanitization
- Content-Type enforcement
- CORS configuration
- Request size limits (max 10MB)
- SQL injection protection (parameterized queries)
- XSS protection (helmet.js)

## Implementation Steps

### Phase 1: Core API (Week 1)
1. Setup Express.js server
2. Create API routes structure
3. Integrate graphGenerator.ts (server-compatible version)
4. Implement `/generate` endpoint
5. Add validation endpoint

### Phase 2: Export Functionality (Week 2)
1. Install node-canvas or @napi-rs/canvas
2. Port canvasRenderer.ts to server-side
3. Implement PNG export
4. Implement PDF export (using jsPDF or PDFKit)
5. Add theme support

### Phase 3: Advanced Features (Week 3)
1. Batch processing
2. Queue system (Bull/BullMQ)
3. Caching (Redis)
4. Webhook callbacks
5. Background job processing

### Phase 4: Security & Deployment (Week 4)
1. API key management
2. Rate limiting
3. Logging & monitoring
4. Docker container
5. Deploy to production

## Code Structure

```
pressure-test-visualizer/
├── src/                          # Frontend (React)
│   ├── components/
│   ├── utils/
│   │   ├── graphGenerator.ts     # Shared logic
│   │   ├── canvasRenderer.ts     # Browser version
│   │   └── helpers.ts
│   └── ...
├── server/                       # Backend (Express)
│   ├── index.ts                  # Server entry point
│   ├── routes/
│   │   ├── graph.routes.ts
│   │   ├── export.routes.ts
│   │   └── preset.routes.ts
│   ├── controllers/
│   │   ├── graph.controller.ts
│   │   └── export.controller.ts
│   ├── services/
│   │   ├── graphGenerator.service.ts
│   │   ├── canvasRenderer.service.ts  # Node-canvas version
│   │   ├── pdfExporter.service.ts
│   │   └── pngExporter.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── rateLimit.middleware.ts
│   ├── utils/
│   │   └── shared/              # Symlink to ../src/utils
│   └── config/
│       └── api.config.ts
├── docker/
│   └── Dockerfile
└── package.json
```

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=production

# API
API_KEY_SALT=random_salt_here
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=100

# Redis (for caching & queue)
REDIS_URL=redis://localhost:6379

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Logging
LOG_LEVEL=info
```

## Example Client Code

### JavaScript/Node.js
```javascript
const fetch = require('node-fetch');

async function generatePressureGraph(testData) {
  const response = await fetch('http://localhost:3001/api/v1/graph/export/png', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify(testData)
  });

  const buffer = await response.buffer();
  require('fs').writeFileSync('graph.png', buffer);
}

generatePressureGraph({
  testNumber: '20252401',
  startDate: '2025-10-27',
  startTime: '11:30:00',
  // ... other parameters
  pressureTests: [
    {
      time: 0,
      duration: 30,
      pressure: 32,
      targetPressure: 32
    }
  ]
});
```

### Python
```python
import requests

def generate_pressure_graph(test_data):
    response = requests.post(
        'http://localhost:3001/api/v1/graph/export/png',
        json=test_data,
        headers={'Authorization': 'Bearer YOUR_API_KEY'}
    )

    with open('graph.png', 'wb') as f:
        f.write(response.content)

test_data = {
    'testNumber': '20252401',
    'startDate': '2025-10-27',
    'startTime': '11:30:00',
    # ... other parameters
    'pressureTests': [
        {
            'time': 0,
            'duration': 30,
            'pressure': 32,
            'targetPressure': 32
        }
    ]
}

generate_pressure_graph(test_data)
```

### cURL
```bash
curl -X POST \
  http://localhost:3001/api/v1/graph/export/png \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d @test_data.json \
  --output graph.png
```

## Performance Considerations

1. **Caching**: Cache generated graphs by settings hash
2. **Queue System**: Use Bull for background processing
3. **CDN**: Serve static graphs via CDN
4. **Horizontal Scaling**: Multiple API instances behind load balancer
5. **Database**: Store graph metadata for analytics

## Monitoring & Analytics

- Track API usage per key
- Monitor generation times
- Error rate tracking
- Popular graph configurations
- Resource utilization (CPU, memory)

## Database Schema (PostgreSQL)

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user', -- 'admin', 'user', 'viewer'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

### API Keys Table
```sql
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 100,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
```

### Graph Generation History
```sql
CREATE TABLE graph_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  api_key_id INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
  test_number VARCHAR(50),
  settings JSONB NOT NULL, -- Полные настройки теста
  export_format VARCHAR(10), -- 'png', 'pdf', 'json'
  file_path VARCHAR(500), -- Путь к сохраненному файлу
  file_size INTEGER, -- Размер в байтах
  generation_time_ms INTEGER, -- Время генерации в мс
  status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'pending'
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_graph_history_user_id ON graph_history(user_id);
CREATE INDEX idx_graph_history_created_at ON graph_history(created_at);
CREATE INDEX idx_graph_history_test_number ON graph_history(test_number);
CREATE INDEX idx_graph_history_settings_gin ON graph_history USING gin(settings);
```

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

### Audit Log
```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'login', 'logout', 'generate_graph', 'export', etc.
  resource_type VARCHAR(50), -- 'graph', 'user', 'api_key'
  resource_id INTEGER,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);
```

### PostgreSQL Extensions
```sql
-- JSON operations
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- IP address operations
CREATE EXTENSION IF NOT EXISTS "cidr";
```

## Setup/Installation Page

### First-Time Setup Endpoint
```
GET /setup
```

Проверяет, инициализировано ли приложение:
- Если БД пуста → показывает форму установки
- Если уже есть пользователи → редирект на /login

### Setup Form
```html
POST /api/v1/setup/initialize

{
  "admin": {
    "username": "admin",
    "email": "admin@example.com",
    "password": "secure_password"
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "database": "pressure_test_db",
    "username": "postgres",
    "password": "postgres_password"
  },
  "application": {
    "siteName": "Pressure Test Visualizer",
    "timezone": "Europe/Moscow",
    "defaultLanguage": "ru"
  }
}
```

**Setup Process:**
1. Валидация входных данных
2. Тест подключения к БД
3. Создание схемы БД
4. Создание администратора
5. Генерация конфигурационного файла
6. Инициализация JWT секретов

**Response:**
```json
{
  "success": true,
  "message": "Приложение успешно инициализировано",
  "adminToken": "jwt_token_here"
}
```

## Admin Panel

### Admin Routes

#### Dashboard
```
GET /api/v1/admin/dashboard
```

**Response:**
```json
{
  "stats": {
    "totalUsers": 45,
    "activeUsers": 38,
    "totalGraphs": 1523,
    "graphsToday": 67,
    "graphsThisWeek": 423,
    "totalStorage": "2.3 GB",
    "avgGenerationTime": 456
  },
  "recentActivity": [
    {
      "id": 12345,
      "user": "john_doe",
      "action": "generate_graph",
      "testNumber": "20252401",
      "timestamp": "2025-10-28T16:30:00Z"
    }
  ],
  "systemHealth": {
    "database": "healthy",
    "redis": "healthy",
    "diskSpace": "75%",
    "memory": "45%",
    "cpu": "23%"
  }
}
```

#### User Management
```
GET /api/v1/admin/users
GET /api/v1/admin/users/:id
POST /api/v1/admin/users
PUT /api/v1/admin/users/:id
DELETE /api/v1/admin/users/:id
```

#### Graph History
```
GET /api/v1/admin/graphs
GET /api/v1/admin/graphs/:id
DELETE /api/v1/admin/graphs/:id
```

#### Analytics
```
GET /api/v1/admin/analytics/usage
GET /api/v1/admin/analytics/performance
GET /api/v1/admin/analytics/errors
```

**Usage Analytics:**
```json
{
  "period": "30d",
  "graphsByFormat": {
    "png": 856,
    "pdf": 543,
    "json": 124
  },
  "graphsByUser": [
    { "username": "john_doe", "count": 234 },
    { "username": "jane_smith", "count": 189 }
  ],
  "peakHours": [
    { "hour": 10, "count": 156 },
    { "hour": 14, "count": 189 }
  ]
}
```

**Performance Analytics:**
```json
{
  "avgGenerationTime": {
    "png": 456,
    "pdf": 892,
    "json": 67
  },
  "p95GenerationTime": {
    "png": 1200,
    "pdf": 2100,
    "json": 150
  },
  "slowestGraphs": [
    {
      "id": 12345,
      "testNumber": "20252401",
      "duration": 3456,
      "timestamp": "2025-10-28T10:00:00Z"
    }
  ]
}
```

#### System Monitoring
```
GET /api/v1/admin/system/health
GET /api/v1/admin/system/logs
```

**Health Check:**
```json
{
  "status": "healthy",
  "uptime": 864000,
  "checks": {
    "database": {
      "status": "healthy",
      "latency": 12
    },
    "redis": {
      "status": "healthy",
      "latency": 3
    },
    "disk": {
      "status": "warning",
      "used": "75%",
      "available": "125 GB"
    },
    "memory": {
      "status": "healthy",
      "used": "45%",
      "total": "16 GB"
    }
  }
}
```

### Admin UI Components

**Frontend Routes:**
```
/admin/dashboard
/admin/users
/admin/graphs
/admin/analytics
/admin/system
/admin/settings
```

**Features:**
- Real-time dashboard with WebSocket updates
- User CRUD operations
- Graph history browser with filters
- Analytics charts (Chart.js / Recharts)
- System health monitoring
- Audit log viewer
- Configuration editor

## Help Page

### Help Routes
```
GET /help
GET /api/v1/help/docs
GET /api/v1/help/search?q=pressure
```

### Help Content Sections

1. **Getting Started**
   - Создание первого графика
   - Понимание параметров теста
   - Экспорт графиков

2. **Test Parameters**
   - Описание каждого поля
   - Примеры значений
   - Ограничения и валидация

3. **Advanced Features**
   - Промежуточные опрессовки
   - Контролируемый дрейф давления
   - Пресеты и шаблоны

4. **API Documentation**
   - Аутентификация
   - Endpoints reference
   - Примеры кода (curl, JavaScript, Python)

5. **Troubleshooting**
   - Частые ошибки
   - FAQ
   - Контакты поддержки

### Interactive Help Features
- Встроенный поиск по документации
- Копирование примеров кода одним кликом
- Интерактивный API explorer (Swagger UI)
- Video tutorials
- Changelog / Release notes

## Future Enhancements

1. **Webhook Support**: Notify external systems when graph is ready
2. **Templates**: Save and reuse common configurations
3. **Scheduled Generation**: Cron-based graph generation
4. **Real-time Updates**: WebSocket for live graph updates
5. **Multi-tenant**: Support for multiple organizations
6. **Graph Comparison**: Side-by-side comparison API
7. **LDAP/SSO Integration**: Enterprise authentication
8. **Custom Branding**: White-label support
9. **Export to Excel**: Tabular data export
10. **Mobile App**: iOS/Android applications
