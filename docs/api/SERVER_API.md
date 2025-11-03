# Pressure Test Visualizer - Backend API

REST API backend для приложения визуализации испытаний давления с JWT аутентификацией, PostgreSQL и Express.js.

## Быстрый старт

### 1. Установка зависимостей

```bash
cd server
npm install
```

### 2. Настройка окружения

Скопируйте `.env.example` в `.env` и настройте параметры:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - параметры PostgreSQL
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - сгенерируйте надежные ключи
- `ALLOWED_ORIGINS` - URL frontend приложения

### 3. Запуск PostgreSQL

#### Docker (рекомендуется):

```bash
docker run --name pressure-test-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=pressure_test_db \
  -p 5432:5432 \
  -d postgres:15
```

#### Или используйте локальный PostgreSQL:

```bash
createdb pressure_test_db
```

### 4. Инициализация базы данных

База данных будет автоматически инициализирована при первом запуске setup endpoint.

Альтернативно, вы можете запустить миграцию вручную:

```bash
psql -d pressure_test_db -f migrations/1_initial_schema.sql
```

### 5. Запуск сервера

#### Development:

```bash
npm run dev
```

#### Production:

```bash
npm run build
npm start
```

Сервер запустится на `http://localhost:3001`

## Endpoints

### Setup

- `GET /api/v1/setup/status` - Check initialization status
- `POST /api/v1/setup/initialize` - Initialize application

### Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user

### Graph Generation

- `POST /api/v1/graph/generate` - Generate graph data
- `POST /api/v1/graph/export/png` - Export to PNG
- `POST /api/v1/graph/export/pdf` - Export to PDF
- `POST /api/v1/graph/validate` - Validate settings
- `GET /api/v1/graph/history` - Get generation history

### Admin

- `GET /api/v1/admin/dashboard` - Dashboard stats
- `GET /api/v1/admin/users` - List users
- `GET /api/v1/admin/graphs` - List all graphs
- `GET /api/v1/admin/system/health` - System health check

## Первичная настройка через API

### 1. Проверка статуса

```bash
curl http://localhost:3001/api/v1/setup/status
```

### 2. Инициализация

```bash
curl -X POST http://localhost:3001/api/v1/setup/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "admin": {
      "username": "admin",
      "email": "admin@example.com",
      "password": "SecurePassword123!"
    },
    "application": {
      "siteName": "Pressure Test Visualizer",
      "timezone": "Europe/Moscow",
      "defaultLanguage": "ru"
    }
  }'
```

Ответ будет содержать JWT токен администратора.

### 3. Логин

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePassword123!"
  }'
```

## Разработка

### Структура проекта

```
server/
├── src/
│   ├── config/          # Database config
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── routes/          # Route definitions
│   ├── utils/           # Utilities (logger, etc.)
│   └── index.ts         # Entry point
├── migrations/          # SQL migrations
├── logs/                # Application logs
└── uploads/             # File uploads
```

### Логирование

Логи записываются в:

- `logs/combined.log` - все логи
- `logs/error.log` - только ошибки
- Console (в development mode)

### Тестирование API

#### Health Check:

```bash
curl http://localhost:3001/health
```

#### С аутентификацией:

```bash
TOKEN="your_jwt_token_here"

curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

```bash
docker build -t pressure-test-api .
docker run -p 3001:3001 --env-file .env pressure-test-api
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: pressure_test_db
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  api:
    build: ./server
    ports:
      - '3001:3001'
    environment:
      DB_HOST: postgres
      DB_PASSWORD: your_password
    depends_on:
      - postgres

volumes:
  postgres_data:
```

## Безопасность

- Все пароли хешируются с использованием bcrypt
- JWT токены с истечением срока действия
- Rate limiting на endpoints
- Helmet.js для security headers
- CORS настроен для specific origins
- SQL injection защита (parameterized queries)

## Производительность

- Connection pooling для PostgreSQL (max 20 connections)
- Индексы на часто запрашиваемые поля
- JSONB для гибкого хранения настроек
- Логирование с ротацией файлов

## Troubleshooting

### База данных не подключается

Проверьте:

- PostgreSQL запущен: `pg_isready`
- Правильные credentials в `.env`
- Firewall не блокирует порт 5432

### JWT ошибки

- Убедитесь что `JWT_SECRET` установлен в `.env`
- Проверьте что токен не истек
- Используйте `Authorization: Bearer <token>` header

## TODO

- [ ] Реализовать graph generation с node-canvas
- [ ] Реализовать PDF export с PDFKit
- [ ] Добавить rate limiting middleware
- [ ] Добавить WebSocket для real-time updates
- [ ] Реализовать batch export
- [ ] Добавить unit/integration тесты
- [ ] Добавить API documentation (Swagger)
- [ ] Настроить CI/CD pipeline

## Лицензия

MIT
