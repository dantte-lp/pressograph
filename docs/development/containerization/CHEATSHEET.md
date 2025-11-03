# Pressograph Compose Cheatsheet

Быстрая справка по командам для работы с Compose deployment.

---

## Быстрый старт

```bash
# Development
cd /opt/projects/repositories/pressure-test-visualizer
make dev-compose

# Production
make prod-compose
```

---

## Основные команды

### Через Makefile

```bash
make dev-compose      # Запустить dev
make prod-compose     # Запустить prod
make help             # Показать все команды
```

### Через podman-compose

```bash
# Development
alias dc-dev='podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev'

dc-dev up -d          # Запустить
dc-dev ps             # Статус
dc-dev logs -f        # Логи
dc-dev down           # Остановить

# Production
alias dc-prod='podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod'

dc-prod up -d
dc-prod ps
dc-prod logs -f
dc-prod down
```

---

## Управление сервисами

```bash
# Restart сервиса
dc-dev restart backend

# Пересоздать сервис
dc-dev up -d --force-recreate backend

# Остановить один сервис
dc-dev stop backend

# Запустить один сервис
dc-dev start backend

# Логи одного сервиса
dc-dev logs -f backend
```

---

## Проверка здоровья

```bash
# Health checks
curl https://dev-pressograph.infra4.dev/api/health
curl https://pressograph.infra4.dev/api/health

# Container status
podman ps | grep pressograph
podman ps --format "table {{.Names}}\t{{.Status}}"

# Healthcheck details
podman inspect pressograph-backend --format '{{.State.Health.Status}}'
```

---

## Database

```bash
# Backup
podman exec pressograph-db pg_dump -U pressograph pressograph > backup.sql

# Restore
podman exec -i pressograph-db psql -U pressograph pressograph < backup.sql

# Connect
podman exec -it pressograph-db psql -U pressograph pressograph

# Migrations
podman exec pressograph-backend npm run migrate
```

---

## Логи

```bash
# Все сервисы
dc-prod logs -f

# Один сервис
podman logs -f pressograph-backend

# Последние 100 строк
podman logs --tail 100 pressograph-backend

# С timestamp
podman logs --timestamps pressograph-backend

# Поиск ошибок
podman logs pressograph-backend | grep -i error
```

---

## Resource usage

```bash
# Real-time
podman stats

# Snapshot
podman stats --no-stream | grep pressograph

# Specific service
podman stats pressograph-backend --no-stream
```

---

## Debugging

```bash
# Exec в контейнер
podman exec -it pressograph-backend sh

# Проверить env vars
podman exec pressograph-backend env | grep -E "(POSTGRES|JWT)"

# Inspect
podman inspect pressograph-backend | jq .

# Network
podman network inspect traefik-public | grep pressograph

# Volume
podman volume inspect pressograph-postgres-data
```

---

## Traefik

```bash
# Routers
curl -s https://tr-01.infra4.dev/api/http/routers | python3 -m json.tool | grep pressograph

# Services
curl -s https://tr-01.infra4.dev/api/http/services | python3 -m json.tool | grep pressograph

# Labels
podman inspect pressograph-backend --format '{{json .Config.Labels}}' | jq . | grep traefik
```

---

## Cleanup

```bash
# Prune images
podman image prune -a

# Prune volumes (ОСТОРОЖНО!)
podman volume prune

# Prune containers
podman container prune

# Удалить все pressograph containers
podman rm -f $(podman ps -a | grep pressograph | awk '{print $1}')
```

---

## Environment файлы

```bash
# Проверить что загружены
dc-prod config | grep -A 5 environment

# Сгенерировать новые секреты
openssl rand -hex 32        # JWT secrets
openssl rand -base64 32     # Passwords

# Отредактировать
nano deploy/compose/.env.prod
```

---

## Updates

```bash
# Pull новые images
dc-prod pull

# Rebuild images
cd /opt/projects/repositories/pressure-test-visualizer
podman build -t pressograph-backend:latest -f server/Dockerfile server/
podman build -t pressograph-frontend:latest -f deploy/Containerfile .

# Update with new images
dc-prod up -d --force-recreate
```

---

## Troubleshooting

```bash
# Контейнер не стартует
podman logs pressograph-backend --tail 100

# Healthcheck fails
podman inspect pressograph-backend --format '{{json .State.Health}}' | jq .

# API недоступен
curl -I https://pressograph.infra4.dev/api/health
podman logs traefik | grep pressograph

# База недоступна
podman exec -it pressograph-db psql -U pressograph pressograph

# OOM issues
journalctl -xe | grep -i "out of memory"
free -h
```

---

## Production Deployment Checklist

```bash
# 1. Backup
podman exec pressograph-db pg_dump -U pressograph pressograph > backup_$(date +%Y%m%d).sql

# 2. Check secrets
cat deploy/compose/.env.prod | grep -E "(PASSWORD|SECRET)"

# 3. Validate config
dc-prod config > /dev/null

# 4. Pull/build images
dc-prod pull

# 5. Deploy
dc-prod up -d --force-recreate

# 6. Verify
curl https://pressograph.infra4.dev/api/health
podman ps | grep pressograph

# 7. Monitor
dc-prod logs -f --tail 100
```

---

## Monitoring

```bash
# Watch health
watch -n 5 'podman ps --format "table {{.Names}}\t{{.Status}}" | grep pressograph'

# Watch resources
watch -n 5 'podman stats --no-stream | grep pressograph'

# Watch logs
dc-prod logs -f --tail 20

# Check uptime
podman ps --format "table {{.Names}}\t{{.Status}}" | grep pressograph
```

---

## Файлы и пути

```
/opt/projects/repositories/pressure-test-visualizer/
├── deploy/compose/
│   ├── compose.dev.yaml          # Dev config
│   ├── compose.prod.yaml         # Prod config
│   ├── .env.dev                  # Dev vars
│   ├── .env.prod                 # Prod secrets
│   └── .env.example              # Template
```

---

## Полезные alias

```bash
# Добавить в ~/.bashrc или ~/.zshrc

# Development
alias ptv-dev='cd /opt/projects/repositories/pressure-test-visualizer && podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev'
alias ptv-dev-up='ptv-dev up -d'
alias ptv-dev-down='ptv-dev down'
alias ptv-dev-logs='ptv-dev logs -f'
alias ptv-dev-ps='ptv-dev ps'

# Production
alias ptv-prod='cd /opt/projects/repositories/pressure-test-visualizer && podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod'
alias ptv-prod-up='ptv-prod up -d'
alias ptv-prod-down='ptv-prod down'
alias ptv-prod-logs='ptv-prod logs -f'
alias ptv-prod-ps='ptv-prod ps'

# Quick checks
alias ptv-health='curl -s https://pressograph.infra4.dev/api/health | jq .'
alias ptv-dev-health='curl -sk https://dev-pressograph.infra4.dev/api/health | jq .'
```

---

## URL-ы

- **Dev Frontend:** https://dev-pressograph.infra4.dev
- **Dev API:** https://dev-pressograph.infra4.dev/api
- **Dev Health:** https://dev-pressograph.infra4.dev/api/health
- **Prod Frontend:** https://pressograph.infra4.dev
- **Prod API:** https://pressograph.infra4.dev/api
- **Prod Health:** https://pressograph.infra4.dev/api/health
- **Traefik Dashboard:** https://tr-01.infra4.dev

---

## Документация

- **README:** `deploy/compose/README.md`
- **Анализ:** `deploy/compose/MODERNIZATION_ANALYSIS.md`
- **Миграция:** `deploy/compose/MIGRATION_GUIDE.md`
- **Cheatsheet:** `deploy/compose/CHEATSHEET.md` (этот файл)

---

**Версия:** 2.0
**Последнее обновление:** 2025-10-29
