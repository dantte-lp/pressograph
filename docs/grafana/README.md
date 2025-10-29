# Pressograph Observability Stack

Полноценный observability stack на базе VictoriaMetrics для проекта Pressograph (pressure-test-visualizer).

## Содержание

- [Архитектура](#архитектура)
- [Компоненты](#компоненты)
- [Быстрый старт](#быстрый-старт)
- [Profiles](#profiles)
- [Доступ к UI](#доступ-к-ui)
- [Интеграция с приложением](#интеграция-с-приложением)
- [Конфигурация](#конфигурация)
- [Retention Policies](#retention-policies)
- [Backup стратегия](#backup-стратегия)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Grafana UI                                  │
│              https://grafana-dev.infra4.dev                         │
│                                                                      │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐              │
│  │ VictoriaMetrics│  │VictoriaLogs │  │    Tempo     │              │
│  │  (Metrics)    │  │   (Logs)    │  │  (Traces)    │              │
│  └──────┬─────────┘  └─────┬───────┘  └──────┬───────┘              │
└─────────┼──────────────────┼──────────────────┼────────────────────┘
          │                  │                  │
          │                  │                  │
     ┌────▼─────┐       ┌────▼─────┐      ┌────▼─────┐
     │ vmagent  │       │ Promtail │      │  OTLP    │
     │ (scraper)│       │ (log     │      │Collector │
     └────┬─────┘       │collector)│      │          │
          │             └────┬─────┘      └────┬─────┘
          │                  │                  │
    ┌─────▼──────────────────▼──────────────────▼─────┐
    │         Application Infrastructure                │
    │                                                   │
    │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
    │  │ Backend  │  │ Postgres │  │   Traefik    │  │
    │  │ /metrics │  │  Logs    │  │   Metrics    │  │
    │  └──────────┘  └──────────┘  └──────────────┘  │
    │                                                   │
    │  ┌──────────────┐  ┌─────────────────────────┐ │
    │  │Postgres      │  │   Node Exporter         │ │
    │  │Exporter      │  │   (System Metrics)      │ │
    │  └──────────────┘  └─────────────────────────┘ │
    └───────────────────────────────────────────────────┘
```

### Поток данных

1. **Метрики** → vmagent → VictoriaMetrics → Grafana
2. **Логи** → Promtail → VictoriaLogs → Grafana
3. **Трейсы** → OTLP Collector → Tempo → Grafana

---

## Компоненты

### 1. VictoriaMetrics (Time Series Database)

**Что:** Хранилище метрик (замена Prometheus).

**Преимущества:**
- Производительность выше чем у Prometheus
- Меньше RAM (до 7x)
- Меньше disk usage (сжатие)
- Полная совместимость с Prometheus API
- Retention до 1+ года без проблем

**Метрики:**
- CPU, Memory, Disk, Network (node-exporter)
- PostgreSQL queries, connections, cache hit ratio (postgres-exporter)
- Application metrics (backend /metrics endpoint)
- Traefik requests, errors, latency
- VictoriaMetrics self-monitoring

**Retention:** 30 дней (dev), 90 дней (prod), настраивается через `VM_RETENTION_PERIOD`.

**UI:** https://victoria-dev.infra4.dev

### 2. VictoriaLogs (Log Storage)

**Что:** Хранилище логов (замена Loki).

**Преимущества:**
- Быстрее Loki (до 10x)
- Мощный query language (LogsQL)
- Меньше ресурсов
- Loki-compatible API

**Логи:**
- Все контейнеры приложения (frontend, backend, postgres)
- Structured JSON logs с trace correlation
- Docker/Podman container logs
- System logs (опционально)

**Retention:** 14 дней (dev), 30 дней (prod), настраивается через `VLOGS_RETENTION_PERIOD`.

**UI:** https://logs-dev.infra4.dev

### 3. Tempo (Distributed Tracing)

**Что:** Хранилище distributed traces.

**Преимущества:**
- Lightweight (меньше ресурсов чем Jaeger)
- OTLP native support (OpenTelemetry)
- Интеграция с Grafana для корреляции
- Service graph и dependency visualization

**Traces:**
- HTTP requests через приложение
- Database queries
- External API calls
- Service-to-service communication

**Retention:** 7 дней (dev/prod), настраивается через `TEMPO_RETENTION_PERIOD`.

**Endpoints:**
- OTLP gRPC: `tempo:4317`
- OTLP HTTP: `tempo:4318`
- Jaeger: `tempo:14268`
- Zipkin: `tempo:9411`

### 4. vmagent (Metrics Collector)

**Что:** Agent для сбора метрик (замена Prometheus Agent).

**Функции:**
- Scraping метрик с exporters
- Service discovery (Docker API)
- Remote write в VictoriaMetrics
- Prometheus-compatible

**Targets:**
- Static targets (из `scrape.yml`)
- Dynamic targets (Docker service discovery)

### 5. Promtail (Log Aggregator)

**Что:** Agent для сбора логов из контейнеров.

**Функции:**
- Чтение логов из Docker/Podman socket
- JSON parsing
- Label extraction
- Отправка в VictoriaLogs

**Pipeline:**
1. Docker API → Container logs
2. JSON parsing → Structured data
3. Label extraction → Filtering
4. Batching → VictoriaLogs

### 6. Exporters

#### Node Exporter
- **Метрики:** CPU, Memory, Disk, Network, Load average
- **Port:** 9100
- **Path:** /metrics

#### PostgreSQL Exporter
- **Метрики:** Connections, queries, cache hit ratio, locks, replication lag
- **Port:** 9187
- **Path:** /metrics
- **Custom queries:** `postgres-exporter/queries.yml`

### 7. Grafana (Visualization)

**Что:** Единый UI для метрик, логов и трейсов.

**Datasources (auto-provisioned):**
- VictoriaMetrics (metrics)
- VictoriaLogs (logs)
- Tempo (traces)

**Features:**
- Unified dashboards (метрики + логи + трейсы)
- Trace to logs correlation
- Trace to metrics correlation
- Alerting (Grafana Unified Alerting)

**UI:** https://grafana-dev.infra4.dev

**Credentials:** admin / admin (dev), см. `.env.observability`

---

## Быстрый старт

### Prerequisite

1. **Traefik запущен** и доступна сеть `traefik-public`:
   ```bash
   podman network inspect traefik-public
   ```

2. **DNS записи настроены** (или добавлены в `/etc/hosts`):
   ```
   127.0.0.1 grafana-dev.infra4.dev
   127.0.0.1 victoria-dev.infra4.dev
   127.0.0.1 logs-dev.infra4.dev
   ```

3. **Backend приложение запущено** (для мониторинга):
   ```bash
   cd /opt/projects/repositories/pressure-test-visualizer
   make dev-compose
   ```

### Шаг 1: Подготовка конфигурации

```bash
cd /opt/projects/repositories/pressure-test-visualizer/deploy/compose

# Проверить что .env.observability существует
ls -la .env.observability

# Опционально: отредактировать для production
nano .env.observability
```

### Шаг 2: Запуск observability stack

**Full stack (всё):**
```bash
podman-compose -f compose.observability.yaml --env-file .env.observability --profile full up -d
```

**Или через Makefile:**
```bash
cd /opt/projects/repositories/pressure-test-visualizer
make observability-full
```

### Шаг 3: Проверка статуса

```bash
# Проверить что все контейнеры запущены
podman ps | grep observability

# Проверить логи
podman-compose -f compose.observability.yaml logs -f

# Или через Makefile
make observability-logs
```

### Шаг 4: Доступ к UI

1. **Grafana:** https://grafana-dev.infra4.dev
   - Login: `admin`
   - Password: `admin` (dev) или из `.env.observability`

2. **VictoriaMetrics:** https://victoria-dev.infra4.dev
   - Query interface для метрик
   - Targets status

3. **VictoriaLogs:** https://logs-dev.infra4.dev
   - Query interface для логов

### Шаг 5: Проверка сбора данных

**В Grafana:**

1. Navigate: **Explore** → **VictoriaMetrics**
2. Query: `up`
3. Должны видеть все targets (victoriametrics, vmagent, node-exporter, postgres-exporter, backend)

**Логи:**

1. Navigate: **Explore** → **VictoriaLogs**
2. Query: `{service="pressograph-backend"}`
3. Должны видеть логи backend приложения

**Трейсы (если инструментирован backend):**

1. Navigate: **Explore** → **Tempo**
2. Search traces by service name: `pressograph-backend`

---

## Profiles

Observability stack поддерживает profiles для гибкого запуска компонентов.

### Available Profiles

| Profile | Компоненты | Использование |
|---------|-----------|---------------|
| `monitoring` | VictoriaMetrics + vmagent + exporters + Grafana | Только метрики |
| `logging` | VictoriaLogs + Promtail + Grafana | Только логи |
| `tracing` | Tempo + Grafana | Только трейсы |
| `full` | Все компоненты | Полный stack (по умолчанию) |

### Примеры использования

**Только мониторинг (метрики):**
```bash
podman-compose -f compose.observability.yaml --env-file .env.observability --profile monitoring up -d
```

**Только логи:**
```bash
podman-compose -f compose.observability.yaml --env-file .env.observability --profile logging up -d
```

**Только трейсы:**
```bash
podman-compose -f compose.observability.yaml --env-file .env.observability --profile tracing up -d
```

**Комбинация (мониторинг + логи):**
```bash
podman-compose -f compose.observability.yaml --env-file .env.observability --profile monitoring --profile logging up -d
```

**Full stack (всё):**
```bash
podman-compose -f compose.observability.yaml --env-file .env.observability --profile full up -d
```

**Через Makefile:**
```bash
make observability-monitoring  # Только метрики
make observability-logging     # Только логи
make observability-tracing     # Только трейсы
make observability-full        # Всё
```

---

## Доступ к UI

### Development

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | https://grafana-dev.infra4.dev | admin / admin |
| VictoriaMetrics | https://victoria-dev.infra4.dev | - |
| VictoriaLogs | https://logs-dev.infra4.dev | - |

### Production

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | https://grafana.infra4.dev | admin / (from .env) |
| VictoriaMetrics | https://victoria.infra4.dev | - |
| VictoriaLogs | https://logs.infra4.dev | - |

**Безопасность:**
- Все admin UI защищены Traefik middleware `admin-secure@file`
- Для production настройте IP whitelist или Basic Auth в Traefik
- Grafana credentials ОБЯЗАТЕЛЬНО меняйте для production

---

## Интеграция с приложением

### Backend: Экспорт метрик (Node.js)

#### Установка библиотеки

```bash
cd server
npm install prom-client
```

#### Инструментация (базовая)

Создайте файл `server/monitoring/metrics.js`:

```javascript
const promClient = require('prom-client');

// Создаем registry
const register = new promClient.Registry();

// Добавляем default metrics (CPU, memory, event loop, GC)
promClient.collectDefaultMetrics({
  register,
  prefix: 'pressograph_',
  labels: {
    service: 'pressograph-backend',
    environment: process.env.NODE_ENV || 'development'
  }
});

// Custom metrics

// HTTP request duration histogram
const httpRequestDuration = new promClient.Histogram({
  name: 'pressograph_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 5]  // 1ms, 10ms, 100ms, 500ms, 1s, 5s
});
register.registerMetric(httpRequestDuration);

// HTTP request total counter
const httpRequestTotal = new promClient.Counter({
  name: 'pressograph_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestTotal);

// Active connections gauge
const activeConnections = new promClient.Gauge({
  name: 'pressograph_active_connections',
  help: 'Number of active connections'
});
register.registerMetric(activeConnections);

// Database query duration
const dbQueryDuration = new promClient.Histogram({
  name: 'pressograph_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 5]
});
register.registerMetric(dbQueryDuration);

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  activeConnections,
  dbQueryDuration
};
```

#### Express Middleware для автоматического сбора

Создайте `server/monitoring/middleware.js`:

```javascript
const { httpRequestDuration, httpRequestTotal, activeConnections } = require('./metrics');

// Middleware для автоматического сбора метрик
function metricsMiddleware(req, res, next) {
  const start = Date.now();

  // Increment active connections
  activeConnections.inc();

  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(...args) {
    // Calculate duration
    const duration = (Date.now() - start) / 1000;  // seconds

    // Extract route (без параметров)
    const route = req.route ? req.route.path : req.path;

    // Record metrics
    httpRequestDuration.observe(
      {
        method: req.method,
        route: route,
        status_code: res.statusCode
      },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode
    });

    // Decrement active connections
    activeConnections.dec();

    // Call original end
    originalEnd.apply(res, args);
  };

  next();
}

module.exports = metricsMiddleware;
```

#### Добавление /metrics endpoint

В `server/index.js` или `server/app.js`:

```javascript
const express = require('express');
const metricsMiddleware = require('./monitoring/middleware');
const { register } = require('./monitoring/metrics');

const app = express();

// Apply metrics middleware BEFORE routes
app.use(metricsMiddleware);

// Your routes here...
app.get('/api/users', (req, res) => {
  // ...
});

// Metrics endpoint (для Prometheus/VictoriaMetrics scraping)
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(3001, () => {
  console.log('Backend listening on port 3001');
  console.log('Metrics available at http://localhost:3001/metrics');
});
```

#### Проверка метрик

```bash
# В контейнере backend должны быть метрики:
curl http://pressograph-dev-backend:3001/metrics

# Или из хоста (если порт проброшен):
curl http://localhost:3001/metrics
```

### Backend: Structured Logging (JSON)

#### Установка Pino

```bash
cd server
npm install pino pino-pretty
```

#### Настройка логгера

Создайте `server/monitoring/logger.js`:

```javascript
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Форматирование для structured logging
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },

  // ISO timestamp для парсинга в Promtail
  timestamp: pino.stdTimeFunctions.isoTime,

  // Base fields (добавляются ко всем логам)
  base: {
    service: 'pressograph-backend',
    environment: process.env.NODE_ENV || 'development'
  },

  // Pretty print для development (только в консоли)
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  } : undefined
});

module.exports = logger;
```

#### Использование логгера

```javascript
const logger = require('./monitoring/logger');

// Информационные логи
logger.info({ method: 'GET', path: '/api/users', duration: 45 }, 'Request completed');

// Error логи с stack trace
try {
  // some code
} catch (error) {
  logger.error({
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path
  }, 'Request failed');
}

// Debug логи
logger.debug({ userId: 123, action: 'login' }, 'User authentication');

// С trace_id (для корреляции с трейсами)
logger.info({
  trace_id: req.headers['x-trace-id'],
  method: req.method,
  path: req.path,
  status_code: res.statusCode
}, 'Request processed');
```

### Backend: Distributed Tracing (OpenTelemetry)

#### Установка зависимостей

```bash
cd server
npm install @opentelemetry/sdk-node \
             @opentelemetry/auto-instrumentations-node \
             @opentelemetry/exporter-trace-otlp-grpc
```

#### Инструментация

Создайте `server/monitoring/tracing.js`:

```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// OTLP Exporter (отправка в Tempo)
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://tempo:4317',
  // Headers (опционально)
  // headers: {},
});

// SDK configuration
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'pressograph-backend',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  traceExporter,
  // Auto-instrumentation для популярных библиотек
  instrumentations: [
    getNodeAutoInstrumentations({
      // Настройки auto-instrumentation
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,  // PostgreSQL
      },
    }),
  ],
});

// Start SDK
sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

module.exports = sdk;
```

#### Запуск с трейсингом

В `server/index.js` (в самом начале файла):

```javascript
// ВАЖНО: Импорт tracing ПЕРЕД всеми остальными импортами!
require('./monitoring/tracing');

// Остальные импорты
const express = require('express');
// ...
```

**Или через environment variable:**

```bash
NODE_OPTIONS="--require ./monitoring/tracing.js" node index.js
```

### Подключение observability network к приложению

Для сбора метрик и логов нужно подключить контейнеры приложения к observability сети.

**Отредактируйте `compose.dev.yaml`:**

```yaml
services:
  postgres:
    networks:
      - internal
      - observability  # Добавить для postgres-exporter

  backend:
    networks:
      - internal
      - traefik-public
      - observability  # Добавить для metrics scraping

networks:
  observability:
    external: true
    name: pressograph-observability-observability  # Имя из compose.observability.yaml
```

**Или создайте network вручную и используйте:**

```bash
podman network create observability
```

В `compose.observability.yaml` и `compose.dev.yaml` используйте:

```yaml
networks:
  observability:
    external: true
    name: observability
```

---

## Конфигурация

### Environment Variables

Основные переменные находятся в `.env.observability`:

```bash
# Environment
ENVIRONMENT=development  # или production

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin  # CHANGE FOR PRODUCTION!
GRAFANA_SECRET_KEY=...  # GENERATE FOR PRODUCTION!
GRAFANA_DOMAIN=grafana-dev.infra4.dev

# VictoriaMetrics
VM_RETENTION_PERIOD=30d  # 30 дней retention
VM_DOMAIN=victoria-dev.infra4.dev

# VictoriaLogs
VLOGS_RETENTION_PERIOD=14d  # 14 дней retention
VLOGS_DOMAIN=logs-dev.infra4.dev

# Tempo
TEMPO_RETENTION_PERIOD=7d  # 7 дней retention

# PostgreSQL Exporter
POSTGRES_EXPORTER_DSN=postgresql://user:pass@host:5432/db?sslmode=disable
```

### Scrape Configuration

Настройка targets для vmagent находится в:
```
deploy/grafana/provisioning/victoriametrics/scrape.yml
```

**Добавление нового target:**

```yaml
scrape_configs:
  - job_name: 'my-service'
    static_configs:
      - targets: ['hostname:port']
        labels:
          service: 'my-service'
          environment: 'development'
    metrics_path: '/metrics'
    scrape_interval: 15s
```

**Service Discovery (автоматическое обнаружение):**

Контейнеры с labels автоматически обнаруживаются:

```yaml
labels:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"
```

### Grafana Datasources

Datasources автоматически провизионятся из:
```
deploy/grafana/provisioning/datasources/
  - victoriametrics.yaml
  - victorialogs.yaml
  - tempo.yaml
```

Не требуется ручная настройка!

### Grafana Dashboards

Dashboards можно добавлять в:
```
deploy/grafana/provisioning/dashboards/dashboards/
  - *.json
```

Будут автоматически загружены при старте Grafana.

---

## Retention Policies

### Дисковое пространство

Примерные требования для retention policies:

| Component | Retention | Estimated Size | Notes |
|-----------|-----------|----------------|-------|
| VictoriaMetrics | 30d | 2-5 GB | Зависит от кол-ва time series |
| VictoriaMetrics | 90d | 10-20 GB | Production рекомендация |
| VictoriaLogs | 14d | 5-15 GB | Зависит от объема логов |
| VictoriaLogs | 30d | 15-40 GB | Production рекомендация |
| Tempo | 7d | 3-8 GB | Зависит от sampling rate |
| Grafana | - | < 1 GB | SQLite database |

**TOTAL для development (30d/14d/7d):** ~20-30 GB

**TOTAL для production (90d/30d/7d):** ~40-80 GB

### Настройка Retention

Через `.env.observability`:

```bash
# Метрики (примеры: 7d, 30d, 90d, 180d, 1y)
VM_RETENTION_PERIOD=90d

# Логи (примеры: 7d, 14d, 30d, 90d)
VLOGS_RETENTION_PERIOD=30d

# Трейсы (примеры: 3d, 7d, 14d)
TEMPO_RETENTION_PERIOD=7d
```

После изменения перезапустите stack:

```bash
podman-compose -f compose.observability.yaml --env-file .env.observability down
podman-compose -f compose.observability.yaml --env-file .env.observability --profile full up -d
```

### Мониторинг дискового пространства

```bash
# Проверка размера volumes
podman volume ls | grep observability
du -sh /var/lib/containers/storage/volumes/pressograph-observability-*

# VictoriaMetrics storage size
podman exec pressograph-observability-victoriametrics du -sh /storage

# VictoriaLogs storage size
podman exec pressograph-observability-victorialogs du -sh /storage

# Tempo storage size
podman exec pressograph-observability-tempo du -sh /tmp/tempo
```

---

## Backup стратегия

### Критичные данные (ТРЕБУЮТ backup)

1. **VictoriaMetrics data**
   - Volume: `pressograph-observability-victoria-metrics-data`
   - Path: `/var/lib/containers/storage/volumes/pressograph-observability-victoria-metrics-data/_data`
   - Frequency: Ежедневно
   - Method: rsync / tar + compression

2. **Grafana data**
   - Volume: `pressograph-observability-grafana-data`
   - Path: `/var/lib/containers/storage/volumes/pressograph-observability-grafana-data/_data`
   - Frequency: Еженедельно
   - Method: SQLite dump / volume backup

### Опциональные данные (можно НЕ бэкапить)

3. **VictoriaLogs data**
   - Логи можно потерять (временные данные)
   - Если критичны — бэкапить аналогично VictoriaMetrics

4. **Tempo data**
   - Трейсы временные (7-14 дней)
   - Обычно НЕ требуется backup

### Backup скрипт (пример)

Создайте `backup-observability.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backups/observability"
DATE=$(date +%Y%m%d_%H%M%S)

# Создать директорию бэкапов
mkdir -p "$BACKUP_DIR"

# Backup VictoriaMetrics data
echo "Backing up VictoriaMetrics..."
podman run --rm \
  -v pressograph-observability-victoria-metrics-data:/data:ro \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/victoria-metrics-$DATE.tar.gz" -C /data .

# Backup Grafana data
echo "Backing up Grafana..."
podman run --rm \
  -v pressograph-observability-grafana-data:/data:ro \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/grafana-$DATE.tar.gz" -C /data .

# Удалить старые бэкапы (> 30 дней)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR"
ls -lh "$BACKUP_DIR"
```

Добавьте в crontab:

```bash
# Ежедневный backup в 3:00 AM
0 3 * * * /path/to/backup-observability.sh >> /var/log/observability-backup.log 2>&1
```

### Restore

```bash
# Остановить stack
podman-compose -f compose.observability.yaml down

# Restore VictoriaMetrics
podman run --rm \
  -v pressograph-observability-victoria-metrics-data:/data \
  -v /backups/observability:/backup \
  alpine tar xzf /backup/victoria-metrics-YYYYMMDD_HHMMSS.tar.gz -C /data

# Restore Grafana
podman run --rm \
  -v pressograph-observability-grafana-data:/data \
  -v /backups/observability:/backup \
  alpine tar xzf /backup/grafana-YYYYMMDD_HHMMSS.tar.gz -C /data

# Запустить stack
podman-compose -f compose.observability.yaml --env-file .env.observability --profile full up -d
```

---

## Troubleshooting

### Проблема: Grafana не стартует

**Симптомы:**
```
Error: failed to start container: container died on startup
```

**Решения:**

1. Проверить логи:
   ```bash
   podman logs pressograph-observability-grafana
   ```

2. Проверить permissions на volumes:
   ```bash
   podman volume inspect pressograph-observability-grafana-data
   ```

3. Пересоздать volume:
   ```bash
   podman-compose -f compose.observability.yaml down -v
   podman-compose -f compose.observability.yaml --profile full up -d
   ```

### Проблема: vmagent не видит targets

**Симптомы:**
- В VictoriaMetrics UI targets помечены как DOWN

**Решения:**

1. Проверить что backend экспортирует метрики:
   ```bash
   curl http://pressograph-dev-backend:3001/metrics
   ```

2. Проверить network connectivity:
   ```bash
   podman exec pressograph-observability-vmagent ping pressograph-dev-backend
   ```

3. Проверить scrape config:
   ```bash
   podman exec pressograph-observability-vmagent cat /etc/vmagent/scrape.yml
   ```

4. Проверить логи vmagent:
   ```bash
   podman logs pressograph-observability-vmagent | grep ERROR
   ```

### Проблема: Promtail не собирает логи

**Симптомы:**
- В VictoriaLogs нет логов

**Решения:**

1. Проверить что Promtail видит Docker socket:
   ```bash
   podman exec pressograph-observability-promtail ls -la /var/run/docker.sock
   ```

2. Проверить логи Promtail:
   ```bash
   podman logs pressograph-observability-promtail | grep ERROR
   ```

3. Проверить что контейнеры пишут в stdout/stderr:
   ```bash
   podman logs pressograph-dev-backend --tail 10
   ```

### Проблема: Tempo не принимает трейсы

**Симптомы:**
- В Grafana Tempo нет трейсов

**Решения:**

1. Проверить OTLP endpoint доступен:
   ```bash
   podman exec pressograph-dev-backend nc -zv tempo 4317
   ```

2. Проверить логи Tempo:
   ```bash
   podman logs pressograph-observability-tempo | grep ERROR
   ```

3. Проверить что backend отправляет трейсы:
   ```bash
   # В backend logs должно быть:
   podman logs pressograph-dev-backend | grep -i "tracing\|telemetry"
   ```

### Проблема: PostgreSQL Exporter не подключается к БД

**Симптомы:**
- Metrics `/metrics` возвращает ошибку
- В логах: `connection refused` или `authentication failed`

**Решения:**

1. Проверить DSN в `.env.observability`:
   ```bash
   cat .env.observability | grep POSTGRES_EXPORTER_DSN
   ```

2. Проверить что БД доступна:
   ```bash
   podman exec pressograph-observability-postgres-exporter nc -zv pressograph-dev-postgres 5432
   ```

3. Проверить credentials:
   ```bash
   # Должны совпадать с compose.dev.yaml
   podman exec pressograph-dev-postgres env | grep POSTGRES
   ```

4. Добавить observability network к postgres контейнеру (см. раздел "Интеграция").

### Проблема: Диск заполнен

**Симптомы:**
- `no space left on device`

**Решения:**

1. Проверить размер volumes:
   ```bash
   du -sh /var/lib/containers/storage/volumes/pressograph-observability-*
   ```

2. Уменьшить retention periods в `.env.observability`

3. Удалить старые данные (ОПАСНО - потеря данных!):
   ```bash
   # Остановить stack
   podman-compose -f compose.observability.yaml down

   # Удалить volumes
   podman volume rm pressograph-observability-victoria-logs-data
   podman volume rm pressograph-observability-tempo-data

   # Запустить снова (пересоздаст volumes)
   podman-compose -f compose.observability.yaml --profile full up -d
   ```

### Проблема: Traefik не маршрутизирует на Grafana

**Симптомы:**
- `https://grafana-dev.infra4.dev` возвращает 404 или timeout

**Решения:**

1. Проверить что Traefik видит контейнер:
   ```bash
   curl -s https://tr-01.infra4.dev/api/http/routers | grep grafana
   ```

2. Проверить что Grafana подключен к traefik-public network:
   ```bash
   podman network inspect traefik-public | grep grafana
   ```

3. Проверить Traefik labels на Grafana контейнере:
   ```bash
   podman inspect pressograph-observability-grafana --format '{{json .Config.Labels}}' | python3 -m json.tool | grep traefik
   ```

4. Проверить DNS resolution:
   ```bash
   dig grafana-dev.infra4.dev
   # или добавить в /etc/hosts:
   echo "127.0.0.1 grafana-dev.infra4.dev" | sudo tee -a /etc/hosts
   ```

---

## Best Practices

### Security

1. **Grafana Credentials:**
   - ОБЯЗАТЕЛЬНО меняйте admin пароль для production
   - Используйте `openssl rand -base64 32`
   - Храните в password manager

2. **Traefik Middleware:**
   - Настройте IP whitelist для admin UI
   - Или используйте Basic Auth
   - Пример в `traefik/config/dynamic.yml`:
     ```yaml
     http:
       middlewares:
         admin-secure:
           chain:
             middlewares:
               - admin-auth
               - admin-ipwhitelist
         admin-auth:
           basicAuth:
             users:
               - "admin:$apr1$..."
         admin-ipwhitelist:
           ipWhiteList:
             sourceRange:
               - "10.0.0.0/8"
               - "192.168.0.0/16"
     ```

3. **PostgreSQL Exporter:**
   - Используйте read-only PostgreSQL user
   - Не давайте SUPERUSER права

4. **Network Isolation:**
   - observability network внутренняя (internal: false для доступа к targets)
   - БД не подключайте к traefik-public

### Performance

1. **Scrape Interval:**
   - 15s — хороший баланс
   - Не ставьте < 10s (перегрузка)
   - Для low-frequency metrics: 30s-60s

2. **Retention vs Disk:**
   - Метрики: 30d (dev), 90d (prod)
   - Логи: 14d (dev), 30d (prod)
   - Трейсы: 7d (достаточно)

3. **Log Sampling:**
   - В production используйте sampling для high-volume логов
   - Или фильтруйте debug logs в Promtail

4. **Trace Sampling:**
   - 100% в development (для debugging)
   - 1-10% в production (снижает нагрузку)

### Monitoring the Monitoring

Настройте alerting для самого observability stack:

**В Grafana Alerting:**

1. VictoriaMetrics disk usage > 80%
2. VictoriaLogs disk usage > 80%
3. Grafana unhealthy
4. vmagent scrape failures > 10%
5. Promtail errors > 100/min

### Maintenance

1. **Регулярный backup:**
   - VictoriaMetrics: ежедневно
   - Grafana: еженедельно
   - Автоматизируйте через cron

2. **Monitoring disk space:**
   - Настройте alerts
   - Проверяйте вручную раз в неделю

3. **Updates:**
   - Обновляйте образы регулярно (security patches)
   - Тестируйте updates в dev перед prod

4. **Cleanup:**
   - Удаляйте старые dashboards
   - Ротируйте credentials (90 дней)

---

## Полезные команды

### Управление

```bash
# Запуск
podman-compose -f compose.observability.yaml --env-file .env.observability --profile full up -d

# Остановка
podman-compose -f compose.observability.yaml down

# Перезапуск
podman-compose -f compose.observability.yaml restart

# Логи
podman-compose -f compose.observability.yaml logs -f

# Логи конкретного сервиса
podman logs -f pressograph-observability-grafana

# Статус
podman ps | grep observability
```

### Проверка

```bash
# Проверить что все сервисы здоровы
podman ps --filter health=healthy | grep observability

# Проверить volumes
podman volume ls | grep observability

# Проверить размер volumes
du -sh /var/lib/containers/storage/volumes/pressograph-observability-*

# Проверить networks
podman network inspect pressograph-observability-observability
```

### Debugging

```bash
# Exec в контейнер
podman exec -it pressograph-observability-grafana sh

# Проверить метрики endpoint
curl http://pressograph-dev-backend:3001/metrics

# Проверить VictoriaMetrics query
curl "http://victoria-dev.infra4.dev/api/v1/query?query=up"

# Проверить VictoriaLogs query
curl "http://logs-dev.infra4.dev/select/logsql/query?query={service=\"pressograph-backend\"}"

# Проверить Tempo health
curl http://tempo:3200/ready
```

### Cleanup

```bash
# Остановить и удалить контейнеры
podman-compose -f compose.observability.yaml down

# Удалить volumes (ОПАСНО - потеря данных!)
podman-compose -f compose.observability.yaml down -v

# Удалить orphan containers
podman container prune -f

# Удалить unused volumes
podman volume prune -f

# Удалить unused images
podman image prune -a -f
```

---

## Дополнительные ресурсы

### Документация

- **VictoriaMetrics:** https://docs.victoriametrics.com/
- **VictoriaLogs:** https://docs.victoriametrics.com/VictoriaLogs/
- **Grafana:** https://grafana.com/docs/
- **Tempo:** https://grafana.com/docs/tempo/
- **OpenTelemetry:** https://opentelemetry.io/docs/
- **Prometheus:** https://prometheus.io/docs/ (для query reference)

### Grafana Dashboards (готовые)

Импортируйте в Grafana (через UI → Dashboards → Import):

- **Node Exporter Full:** ID `1860`
- **PostgreSQL Database:** ID `9628`
- **Traefik 2:** ID `11462`
- **VictoriaMetrics:** ID `10229`

### Community

- **VictoriaMetrics Community:** https://slack.victoriametrics.com/
- **Grafana Community:** https://community.grafana.com/

---

## Changelog

### v1.0.0 (2025-10-29)

- Initial observability stack
- VictoriaMetrics Single для метрик
- VictoriaLogs для логов
- Tempo для трейсов
- Grafana с auto-provisioning
- vmagent для scraping
- Promtail для log collection
- Node Exporter
- PostgreSQL Exporter
- Profiles support (monitoring/logging/tracing/full)
- Traefik integration
- Documentation

---

## Поддержка

Если возникли проблемы:

1. Проверьте раздел [Troubleshooting](#troubleshooting)
2. Проверьте логи: `podman-compose -f compose.observability.yaml logs -f`
3. Проверьте что все prerequisites выполнены
4. Создайте issue в репозитории проекта

---

**Happy Monitoring!** 📊📈🔍
