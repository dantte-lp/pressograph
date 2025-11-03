# Observability Stack - Quick Start Guide

Быстрый старт для запуска observability stack за 5 минут.

## Prerequisites

1. **Traefik запущен** с сетью `traefik-public`:

   ```bash
   podman network inspect traefik-public
   ```

2. **DNS или /etc/hosts настроены**:

   ```bash
   # Для development (локальный доступ)
   echo "127.0.0.1 grafana-dev.infra4.dev victoria-dev.infra4.dev logs-dev.infra4.dev" | sudo tee -a /etc/hosts
   ```

3. **Backend приложение запущено** (опционально, для мониторинга):
   ```bash
   cd /opt/projects/repositories/pressure-test-visualizer
   make dev-compose
   ```

---

## Шаг 1: Запуск observability stack (1 минута)

```bash
cd /opt/projects/repositories/pressure-test-visualizer

# Запустить full stack (всё)
make observability-full

# Или напрямую:
podman-compose -f deploy/compose/compose.observability.yaml \
  --env-file deploy/compose/.env.observability \
  --profile full up -d
```

**Ждём ~30 секунд** пока все сервисы стартуют.

---

## Шаг 2: Проверка статуса (30 секунд)

```bash
# Проверить что все контейнеры запущены
make observability-status

# Ожидаемый вывод:
# pressograph-observability-grafana         Up 30 seconds   3000/tcp
# pressograph-observability-victoriametrics Up 30 seconds   8428/tcp
# pressograph-observability-victorialogs    Up 30 seconds   9428/tcp
# pressograph-observability-tempo           Up 30 seconds   3200/tcp, 4317/tcp, 4318/tcp
# pressograph-observability-vmagent         Up 30 seconds
# pressograph-observability-promtail        Up 30 seconds
# pressograph-observability-node-exporter   Up 30 seconds   9100/tcp
# pressograph-observability-postgres-exporter Up 30 seconds 9187/tcp
```

**Все контейнеры должны быть в статусе "Up".**

---

## Шаг 3: Доступ к UI (1 минута)

### Grafana (главный UI)

**URL:** https://grafana-dev.infra4.dev

**Credentials:**

- Username: `admin`
- Password: `admin`

**Первый вход:**

1. Откройте https://grafana-dev.infra4.dev
2. Введите admin / admin
3. (Опционально) Смените пароль

### VictoriaMetrics UI

**URL:** https://victoria-dev.infra4.dev

**Функции:**

- Query метрик (PromQL)
- Проверка targets (scraping status)
- Cardinality explorer

### VictoriaLogs UI

**URL:** https://logs-dev.infra4.dev

**Функции:**

- Query логов (LogsQL)
- Real-time log streaming
- Логи всех контейнеров

---

## Шаг 4: Проверка данных (2 минуты)

### 4.1 Проверка метрик

1. Откройте **Grafana** → **Explore**
2. Выберите datasource: **VictoriaMetrics**
3. Введите query: `up`
4. Нажмите **Run query**

**Ожидаемый результат:**
Должны видеть метрики от всех targets:

- `victoriametrics`
- `vmagent`
- `node-exporter`
- `postgres-exporter`
- `pressograph-backend` (если запущен)

**Если метрик нет:**

```bash
# Проверить логи vmagent
podman logs pressograph-observability-vmagent | grep ERROR

# Проверить scrape config
podman exec pressograph-observability-vmagent cat /etc/vmagent/scrape.yml
```

### 4.2 Проверка логов

1. Откройте **Grafana** → **Explore**
2. Выберите datasource: **VictoriaLogs**
3. Введите query: `{service="pressograph-backend"}`
4. Нажмите **Run query**

**Ожидаемый результат:**
Логи от backend контейнера (если запущен).

**Если логов нет:**

```bash
# Проверить что Promtail видит контейнеры
podman logs pressograph-observability-promtail | tail -20

# Проверить что backend пишет в stdout
podman logs pressograph-dev-backend --tail 10
```

### 4.3 Проверка трейсов (опционально)

Трейсы появятся только после инструментации backend с OpenTelemetry.

1. Откройте **Grafana** → **Explore**
2. Выберите datasource: **Tempo**
3. Search traces (если backend инструментирован)

---

## Шаг 5: Интеграция с Backend (опционально)

Для полной observability нужно инструментировать backend:

### 5.1 Metrics (5 минут)

```bash
cd server
npm install prom-client
```

**Скопируйте примеры:**

```bash
cp deploy/grafana/integration-examples/metrics-example.js server/monitoring/metrics.js
cp deploy/grafana/integration-examples/middleware-example.js server/monitoring/middleware.js
```

**Добавьте в app.js:**

```javascript
const metricsMiddleware = require('./monitoring/middleware');
const { register } = require('./monitoring/metrics');

app.use(metricsMiddleware);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

**Перезапустите backend:**

```bash
make dev-compose
```

**Проверка:**

```bash
curl http://localhost:3001/metrics
```

### 5.2 Logging (5 минут)

```bash
cd server
npm install pino pino-pretty
```

**Скопируйте пример:**

```bash
cp deploy/grafana/integration-examples/logging-example.js server/monitoring/logger.js
```

**Используйте в коде:**

```javascript
const logger = require('./monitoring/logger');

logger.info({ userId: 123 }, 'User logged in');
```

**Логи автоматически появятся в VictoriaLogs!**

### 5.3 Tracing (10 минут)

```bash
cd server
npm install @opentelemetry/sdk-node \
            @opentelemetry/auto-instrumentations-node \
            @opentelemetry/exporter-trace-otlp-grpc \
            @opentelemetry/api
```

**Скопируйте пример:**

```bash
cp deploy/grafana/integration-examples/tracing-example.js server/monitoring/tracing.js
```

**Добавьте В САМОМ НАЧАЛЕ index.js:**

```javascript
// ПЕРВАЯ строка!
require('./monitoring/tracing');

// Остальные импорты...
const express = require('express');
```

**Перезапустите backend:**

```bash
make dev-compose
```

**Трейсы автоматически отправятся в Tempo!**

---

## Полезные команды

### Управление

```bash
# Запустить
make observability-full

# Остановить
make observability-down

# Перезапустить
make observability-restart

# Логи
make observability-logs

# Статус
make observability-status
```

### Profiles (запуск только части stack)

```bash
# Только метрики
make observability-monitoring

# Только логи
make observability-logging

# Только трейсы
make observability-tracing

# Всё
make observability-full
```

### Debugging

```bash
# Проверить что backend экспортирует метрики
curl http://pressograph-dev-backend:3001/metrics

# Проверить targets в VictoriaMetrics
curl -s https://victoria-dev.infra4.dev/api/v1/targets | python3 -m json.tool

# Проверить логи конкретного сервиса
podman logs pressograph-observability-grafana -f

# Проверить network connectivity
podman exec pressograph-observability-vmagent ping pressograph-dev-backend
```

### Cleanup

```bash
# Остановить и удалить volumes (ОПАСНО - потеря данных!)
make observability-clean

# Или:
podman-compose -f deploy/compose/compose.observability.yaml down -v
```

---

## Troubleshooting

### Grafana не открывается

**Проблема:** https://grafana-dev.infra4.dev недоступен

**Решение:**

1. Проверить что Grafana запущен:

   ```bash
   podman ps | grep grafana
   ```

2. Проверить логи:

   ```bash
   podman logs pressograph-observability-grafana
   ```

3. Проверить Traefik:

   ```bash
   curl -s https://tr-01.infra4.dev/api/http/routers | grep grafana
   ```

4. Проверить DNS:
   ```bash
   dig grafana-dev.infra4.dev
   # или добавить в /etc/hosts
   ```

### Метрики не собираются

**Проблема:** `up` query не показывает targets

**Решение:**

1. Проверить scrape config:

   ```bash
   podman exec pressograph-observability-vmagent cat /etc/vmagent/scrape.yml
   ```

2. Проверить логи vmagent:

   ```bash
   podman logs pressograph-observability-vmagent | grep ERROR
   ```

3. Проверить что backend доступен:
   ```bash
   podman exec pressograph-observability-vmagent nc -zv pressograph-dev-backend 3001
   ```

### Логи не появляются

**Проблема:** VictoriaLogs пустой

**Решение:**

1. Проверить Promtail:

   ```bash
   podman logs pressograph-observability-promtail
   ```

2. Проверить Docker socket:

   ```bash
   podman exec pressograph-observability-promtail ls -la /var/run/docker.sock
   ```

3. Проверить что контейнеры логируют:
   ```bash
   podman logs pressograph-dev-backend --tail 10
   ```

---

## Следующие шаги

### 1. Импортировать готовые dashboards

В Grafana UI:

1. Navigate: **Dashboards** → **New** → **Import**
2. Введите ID готового dashboard:
   - **Node Exporter Full:** `1860`
   - **PostgreSQL Database:** `9628`
   - **Traefik 2:** `11462`
3. Выберите datasource: **VictoriaMetrics**
4. Нажмите **Import**

### 2. Настроить Alerting

1. Navigate: **Alerting** → **Alert rules**
2. Создать rules:
   - CPU usage > 80%
   - Disk usage > 90%
   - HTTP 5xx errors > 100/min
   - Slow database queries > 1s

### 3. Настроить Notifications

1. Navigate: **Alerting** → **Contact points**
2. Добавить Slack/Discord/Email webhook
3. Настроить notification policies

### 4. Production deployment

1. Скопировать `.env.observability` в `.env.observability.prod`
2. Сгенерировать сильные пароли:
   ```bash
   openssl rand -base64 32  # Grafana admin password
   openssl rand -hex 32     # Grafana secret key
   ```
3. Обновить domains в `.env.observability.prod`:
   - `grafana.infra4.dev`
   - `victoria.infra4.dev`
   - `logs.infra4.dev`
4. Увеличить retention periods:
   - VM_RETENTION_PERIOD=90d
   - VLOGS_RETENTION_PERIOD=30d
5. Запустить:
   ```bash
   podman-compose -f deploy/compose/compose.observability.yaml \
     --env-file deploy/compose/.env.observability.prod \
     --profile full up -d
   ```

---

## Полезные ссылки

- **Полная документация:** [deploy/grafana/README.md](README.md)
- **Примеры интеграции:** [deploy/grafana/integration-examples/](integration-examples/)
- **VictoriaMetrics docs:** https://docs.victoriametrics.com/
- **Grafana docs:** https://grafana.com/docs/
- **OpenTelemetry docs:** https://opentelemetry.io/docs/

---

**Готово!** 🎉

Теперь у вас полноценный observability stack:

- ✅ Метрики в VictoriaMetrics
- ✅ Логи в VictoriaLogs
- ✅ Трейсы в Tempo (после инструментации)
- ✅ Визуализация в Grafana

**Следующий шаг:** Инструментируйте Backend для полной observability!
