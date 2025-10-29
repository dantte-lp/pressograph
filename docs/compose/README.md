# Pressograph Compose Deployments

Production-ready container orchestration для Pressograph pressure test visualization platform.

**Версия:** 2.0 (модернизировано 2025-10-29)
**Стандарт:** Compose Specification 2025
**Container Runtime:** Podman 4.4+

---

## Quick Start

### Development Environment

```bash
cd /opt/projects/repositories/pressure-test-visualizer

# Запуск через Makefile (рекомендуется)
make dev-compose

# Или напрямую
podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev up -d

# Логи
make logs-compose  # или
podman-compose -f deploy/compose/compose.dev.yaml logs -f

# Остановка
podman-compose -f deploy/compose/compose.dev.yaml down
```

**Доступ:**
- Frontend: https://dev-pressograph.infra4.dev
- Backend API: https://dev-pressograph.infra4.dev/api
- Health: https://dev-pressograph.infra4.dev/api/health

---

### Production Environment

```bash
cd /opt/projects/repositories/pressure-test-visualizer

# ВАЖНО: Сначала создать .env.prod с production секретами!
# cp deploy/compose/.env.example deploy/compose/.env.prod
# nano deploy/compose/.env.prod  # Заполнить сильными паролями

# Запуск
make prod-compose

# Или напрямую
podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod up -d

# Проверка
curl https://pressograph.infra4.dev/api/health
```

**Доступ:**
- Frontend: https://pressograph.infra4.dev
- Backend API: https://pressograph.infra4.dev/api

---

## Структура файлов

```
deploy/compose/
├── compose.dev.yaml          # Development окружение
├── compose.prod.yaml         # Production окружение
├── .env.dev                  # Dev переменные (коммитится)
├── .env.prod                 # Prod секреты (gitignored)
├── .env.example              # Шаблон с документацией
├── .gitignore                # Защита секретов
├── README.md                 # Эта документация
├── MODERNIZATION_ANALYSIS.md # Детальный анализ обновлений
└── MIGRATION_GUIDE.md        # Пошаговая миграция
```

---

## Файлы окружений

### .env.dev (Development)
- ✅ Безопасно коммитить в git
- ✅ Содержит слабые пароли (для dev)
- ✅ CORS открыт для localhost
- ✅ DEBUG режим включен

### .env.prod (Production)
- ❌ НЕ коммитить в git (в .gitignore)
- ✅ Сильные сгенерированные пароли
- ✅ CORS ограничен production доменом
- ✅ Logging уровень: info

### .env.example (Template)
- ✅ Шаблон для новых deployments
- ✅ Документация всех переменных
- ✅ Примеры генерации секретов
- ✅ Security checklist

---

## Best Practices 2025

### ✅ Что изменилось (vs. старые docker-compose файлы)

1. **Compose Specification 2025**
   - ❌ Удален устаревший `version: '3.8'` field
   - ✅ Современный синтаксис без version
   - ✅ Файлы: `compose.yaml` (вместо `docker-compose.yml`)

2. **Resource Management**
   - ✅ CPU limits на всех сервисах
   - ✅ Memory limits (предотвращение OOM killer)
   - ✅ Resource reservations (guaranteed QoS)

3. **Security Hardening**
   - ✅ `no-new-privileges:true` на всех контейнерах
   - ✅ Dropped ALL capabilities, добавлены только необходимые
   - ✅ Non-root users (node:node, postgres:999)
   - ✅ Read-only filesystem (frontend production)
   - ✅ Database isolated в internal network

4. **Logging & Observability**
   - ✅ JSON logs с rotation (10MB max, 3-5 файлов)
   - ✅ Compression enabled
   - ✅ Предотвращение заполнения диска

5. **OCI Standard Labels**
   - ✅ `org.opencontainers.image.*` labels
   - ✅ Version, description, source tracking
   - ✅ Metadata для inventory management

6. **Healthchecks**
   - ✅ Все сервисы имеют healthchecks
   - ✅ `start_period` настроен (предотвращает false unhealthy)
   - ✅ Traefik integration для load balancing

7. **Dependency Management**
   - ✅ `depends_on` с `condition: service_healthy`
   - ✅ `restart: true` для auto-restart при падении зависимости

8. **SELinux Compatibility**
   - ✅ Volume mounts с `:z` suffix (Podman rootless)
   - ✅ Tested на RHEL/OL/Fedora

---

## Архитектура

### Development Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     Traefik (external)                       │
│              https://dev-pressograph.infra4.dev              │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴──────────────┐
         │                              │
┌────────▼────────┐            ┌────────▼────────┐
│   Frontend      │            │    Backend      │
│   (Vite HMR)    │            │  (Node + watch) │
│   Port: 5173    │            │   Port: 3001    │
│   User: node    │            │   User: node    │
│   Mem: 1GB      │            │   Mem: 1GB      │
└─────────────────┘            └────────┬────────┘
                                        │
                               ┌────────▼────────┐
                               │   PostgreSQL    │
                               │   (internal)    │
                               │   Port: 5432    │
                               │   User: 999     │
                               │   Mem: 512MB    │
                               └─────────────────┘

Networks:
  - traefik-public (external, shared)
  - internal (isolated, no internet)
```

### Production Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     Traefik (external)                       │
│                https://pressograph.infra4.dev                │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴──────────────┐
         │                              │
┌────────▼────────┐            ┌────────▼────────┐
│   Frontend      │            │    Backend      │
│  (Nginx+React)  │            │ (Node built)    │
│   Port: 80      │            │   Port: 3001    │
│   User: 101     │            │   User: node    │
│   Mem: 256MB    │            │   Mem: 2GB      │
│   READ-ONLY FS  │            │   Mem: 2GB      │
└─────────────────┘            └────────┬────────┘
                                        │
                               ┌────────▼────────┐
                               │   PostgreSQL    │
                               │   (internal)    │
                               │   Port: 5432    │
                               │   User: 999     │
                               │   Mem: 1GB      │
                               └─────────────────┘

Networks:
  - traefik-public (external, shared)
  - pressograph-internal (isolated, no internet)
```

---

## Resource Limits

### Development

| Service | CPU Limit | Memory Limit | CPU Reserved | Memory Reserved |
|---------|-----------|--------------|--------------|-----------------|
| PostgreSQL | 0.5 | 512MB | 0.1 | 128MB |
| Backend | 1.0 | 1GB | 0.25 | 256MB |
| Frontend | 1.0 | 1GB | 0.25 | 256MB |
| **Total** | **2.5** | **2.5GB** | **0.6** | **640MB** |

### Production

| Service | CPU Limit | Memory Limit | CPU Reserved | Memory Reserved |
|---------|-----------|--------------|--------------|-----------------|
| PostgreSQL | 1.0 | 1GB | 0.25 | 256MB |
| Backend | 2.0 | 2GB | 0.5 | 512MB |
| Frontend | 0.5 | 256MB | 0.1 | 64MB |
| **Total** | **3.5** | **3.25GB** | **0.85** | **832MB** |

**Минимальные требования сервера:**
- Development: 4 CPU cores, 4GB RAM
- Production: 4 CPU cores, 8GB RAM (рекомендуется)

---

## Команды управления

### Через Makefile (рекомендуется)

```bash
# Development
make dev-compose          # Запустить dev окружение
make dev-compose-logs     # Логи (если есть target)

# Production
make prod-compose         # Запустить prod окружение

# Общие
make help                 # Показать все команды
```

### Напрямую через podman-compose

```bash
# Старт
podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev up -d

# Логи (все сервисы)
podman-compose -f deploy/compose/compose.dev.yaml logs -f

# Логи (один сервис)
podman-compose -f deploy/compose/compose.dev.yaml logs -f backend

# Статус
podman-compose -f deploy/compose/compose.dev.yaml ps

# Остановка
podman-compose -f deploy/compose/compose.dev.yaml down

# Restart одного сервиса
podman-compose -f deploy/compose/compose.dev.yaml restart backend

# Пересоздать сервис
podman-compose -f deploy/compose/compose.dev.yaml up -d --force-recreate backend

# Проверка конфигурации
podman-compose -f deploy/compose/compose.dev.yaml config
```

### Прямое управление через Podman

```bash
# Список контейнеров
podman ps | grep pressograph

# Логи контейнера
podman logs -f pressograph-backend

# Exec в контейнер
podman exec -it pressograph-backend sh

# Инспекция
podman inspect pressograph-backend

# Stats
podman stats --no-stream pressograph-backend

# Health status
podman inspect pressograph-backend --format '{{.State.Health.Status}}'
```

---

## Database Management

### Backup (Production)

```bash
# SQL dump
podman exec pressograph-db pg_dump -U pressograph pressograph > backup_$(date +%Y%m%d).sql

# Compressed dump
podman exec pressograph-db pg_dump -U pressograph pressograph | gzip > backup_$(date +%Y%m%d).sql.gz

# Volume backup
podman run --rm \
  -v pressograph-postgres-data:/data:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres_volume_$(date +%Y%m%d).tar.gz -C /data .
```

### Restore

```bash
# From SQL dump
podman exec -i pressograph-db psql -U pressograph pressograph < backup_20251029.sql

# From compressed dump
gunzip -c backup_20251029.sql.gz | podman exec -i pressograph-db psql -U pressograph pressograph
```

### Migrations

```bash
# Run migrations (backend должен быть запущен)
podman exec pressograph-backend npm run migrate

# Rollback
podman exec pressograph-backend npm run migrate:rollback

# Create migration
podman exec pressograph-backend npm run migrate:create -- migration_name
```

---

## Troubleshooting

### Контейнер не стартует

```bash
# Проверить логи
podman logs pressograph-backend --tail 100

# Проверить healthcheck
podman inspect pressograph-backend --format '{{.State.Health}}'

# Проверить зависимости
podman-compose -f deploy/compose/compose.dev.yaml ps

# Пересоздать
podman-compose -f deploy/compose/compose.dev.yaml up -d --force-recreate backend
```

### Healthcheck fails

```bash
# Проверить health status
podman inspect pressograph-backend --format '{{json .State.Health}}' | jq .

# Вручную запустить healthcheck команду
podman exec pressograph-backend wget --no-verbose --tries=1 --spider http://localhost:3001/health

# Проверить что прошел start_period (45-90s)
# Если прошло - смотреть логи
```

### API недоступен через Traefik

```bash
# 1. Проверить что контейнер в сети traefik-public
podman network inspect traefik-public | grep pressograph

# 2. Проверить Traefik routing
curl -s https://tr-01.infra4.dev/api/http/routers | python3 -m json.tool | grep pressograph

# 3. Проверить labels
podman inspect pressograph-backend --format '{{json .Config.Labels}}' | jq . | grep traefik

# 4. Проверить что Traefik видит сервис
curl -s https://tr-01.infra4.dev/api/http/services | python3 -m json.tool | grep pressograph
```

### База данных не доступна

```bash
# Проверить статус
podman ps | grep postgres

# Проверить healthcheck
podman inspect pressograph-dev-postgres --format '{{.State.Health.Status}}'

# Проверить логи
podman logs pressograph-dev-postgres --tail 50

# Попробовать подключиться
podman exec -it pressograph-dev-postgres psql -U pressograph_dev pressograph_dev

# Проверить volume
podman volume inspect pressograph-dev-postgres-data
```

### Out of Memory (OOM)

```bash
# Проверить текущее использование
podman stats --no-stream | grep pressograph

# Проверить OOM kills
journalctl -xe | grep -i "out of memory"

# Увеличить limits в compose файле
# deploy.resources.limits.memory

# Проверить system memory
free -h
```

### Логи заполняют диск

```bash
# Проверить размер логов
du -sh /var/lib/containers/storage/overlay-containers/

# Проверить log rotation config
podman inspect pressograph-backend --format '{{.HostConfig.LogConfig}}'

# Должно быть:
# {json-file map[compress:true max-file:3 max-size:10m]}

# Принудительно очистить
podman logs pressograph-backend --tail 0 > /dev/null 2>&1
```

---

## Security Checklist

### Development

- [x] Weak passwords (допустимо для dev)
- [x] CORS открыт для localhost
- [x] DEBUG режим включен
- [x] .env.dev в git (безопасно)
- [x] Resource limits настроены
- [x] no-new-privileges enabled
- [x] Database в internal network

### Production

- [ ] **STRONG passwords** (32+ chars, generated)
- [ ] **JWT secrets** сгенерированы `openssl rand -hex 32`
- [ ] **.env.prod в .gitignore** (НЕ коммитить!)
- [ ] CORS ограничен production доменом
- [ ] LOG_LEVEL=info (не debug)
- [ ] Resource limits настроены
- [ ] Security hardening (read-only FS, cap_drop)
- [ ] Database isolated в internal network
- [ ] Backups настроены и протестированы
- [ ] SSL сертификаты валидны
- [ ] Monitoring настроен

---

## Monitoring & Observability

### Health Checks

```bash
# Все сервисы
curl -k https://dev-pressograph.infra4.dev/api/health
curl -k https://pressograph.infra4.dev/api/health

# Проверить status codes
curl -I https://pressograph.infra4.dev/api/health

# Healthcheck status в Podman
podman ps --format "table {{.Names}}\t{{.Status}}"
```

### Resource Usage

```bash
# Real-time stats
podman stats

# Snapshot
podman stats --no-stream | grep pressograph

# Specific service
podman stats pressograph-backend --no-stream
```

### Logs

```bash
# Все сервисы
podman-compose -f deploy/compose/compose.prod.yaml logs -f

# Один сервис
podman logs -f pressograph-backend

# Последние N строк
podman logs --tail 100 pressograph-backend

# С timestamp
podman logs --timestamps pressograph-backend

# Поиск ошибок
podman logs pressograph-backend | grep -i error
```

---

## Maintenance

### Updates

```bash
# Pull новые images
podman-compose -f deploy/compose/compose.prod.yaml pull

# Restart с новыми images
podman-compose -f deploy/compose/compose.prod.yaml up -d --force-recreate

# Проверить версии
podman images | grep pressograph
```

### Cleanup

```bash
# Удалить unused images
podman image prune -a

# Удалить unused volumes (ОСТОРОЖНО!)
podman volume prune

# Удалить все stopped containers
podman container prune
```

### Rotation Secrets (каждые 90 дней)

```bash
# 1. Сгенерировать новые секреты
echo "NEW_JWT_SECRET=$(openssl rand -hex 32)"
echo "NEW_JWT_REFRESH_SECRET=$(openssl rand -hex 32)"

# 2. Обновить .env.prod
nano deploy/compose/.env.prod

# 3. Restart backend
podman-compose -f deploy/compose/compose.prod.yaml restart backend

# 4. Invalidate старые JWT tokens (опционально)
# Пользователи должны ре-логиниться
```

---

## Documentation

- **Детальный анализ:** [`MODERNIZATION_ANALYSIS.md`](./MODERNIZATION_ANALYSIS.md)
- **Миграционный гайд:** [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)
- **Compose Spec:** https://github.com/compose-spec/compose-spec
- **Podman Compose:** https://docs.podman.io/en/latest/markdown/podman-compose.1.html
- **Traefik docs:** https://doc.traefik.io/traefik/

---

## Changelog

### Version 2.0 (2025-10-29)

**Модернизация до стандартов 2025:**

- ✅ Удален устаревший `version` field
- ✅ Файлы переименованы: `compose.{dev,prod}.yaml`
- ✅ Добавлены resource limits (CPU, memory)
- ✅ Настроена log rotation (10MB, 3-5 файлов)
- ✅ Security hardening (no-new-privileges, cap_drop, read-only FS)
- ✅ OCI standard labels для metadata
- ✅ Healthchecks с `start_period`
- ✅ YAML anchors для DRY
- ✅ Исправлен PostgreSQL volume path
- ✅ Frontend зависит от backend в dev
- ✅ Созданы .env.dev и .env.example
- ✅ Обновлен .gitignore

**Breaking Changes:**
- Файлы переименованы (требуется обновить Makefile)
- Требуется --env-file флаг при запуске
- PostgreSQL volume path изменен (миграция автоматическая)

**Migration:** См. [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)

### Version 1.0 (2024-10-28)

Initial production deployment с Docker Compose v3.8 синтаксисом.

---

## License

MIT License - см. главный репозиторий

## Authors

Pressograph Team
DevOps: Claude Code

---

**Статус:** ✅ Production Ready
**Тестирование:** Пройдено
**Последнее обновление:** 2025-10-29
