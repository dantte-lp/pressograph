# Анализ и модернизация Compose файлов Pressograph
## Детальный отчет по обновлению согласно Best Practices 2025

**Дата анализа:** 2025-10-29
**Проект:** pressure-test-visualizer (Pressograph)
**Текущая версия:** Compose Spec v3.8 (устаревшая)
**Целевая версия:** Compose Specification 2025 (без version field)

---

## 1. АНАЛИЗ ТЕКУЩЕГО СОСТОЯНИЯ

### 1.1 Найденные проблемы

#### КРИТИЧЕСКИЕ (требуют немедленного исправления)

1. **Устаревший `version: '3.8'` field**
   - **Местоположение:** Оба файла (строки 1)
   - **Проблема:** Устарел с Docker Compose v1.27.0+ (июнь 2020)
   - **Решение:** Удалить полностью

2. **Отсутствие resource limits**
   - **Местоположение:** Все сервисы в обоих файлах
   - **Проблема:** Контейнеры могут потреблять 100% ресурсов хоста
   - **Риск:** OOM killer может убить критические процессы хоста
   - **Решение:** Добавить deploy.resources.limits и reservations

3. **Хардкод паролей в dev файле**
   - **Местоположение:** docker-compose.dev.yml:34, 60
   - **Проблема:**
     - `POSTGRES_PASSWORD: devpassword123`
     - `DATABASE_URL: postgresql://pressograph_dev:devpassword123@...`
   - **Риск:** Пароли в git истории, низкая security baseline
   - **Решение:** Вынести в .env.dev даже для development

4. **Отсутствие logging configuration**
   - **Местоположение:** Все сервисы
   - **Проблема:** Логи могут заполнить диск (no rotation)
   - **Решение:** Настроить json-file driver с rotation

5. **Недостаточные security contexts**
   - **Проблема:** Контейнеры работают с дефолтными capabilities
   - **Решение:** Добавить read_only, no-new-privileges, drop capabilities

#### ВЫСОКИЙ ПРИОРИТЕТ

6. **Отсутствие start_period в production healthchecks**
   - **Местоположение:** docker-compose.prod.yml (postgres, backend)
   - **Проблема:** Сервисы могут быть marked unhealthy во время startup
   - **Решение:** Добавить start_period: 30-60s

7. **Несоответствие именования файлов best practices 2025**
   - **Текущие:** `docker-compose.dev.yml`, `docker-compose.prod.yml`
   - **Рекомендуемые:** `compose.dev.yaml`, `compose.prod.yaml`
   - **Проблема:** Префикс "docker-" устарел, расширение .yml вместо .yaml

8. **Хардкод JWT secrets в env vars**
   - **Местоположение:** docker-compose.dev.yml:71-72
   - **Проблема:** Секреты в compose файле (даже для dev)
   - **Решение:** Использовать .env.dev

9. **Отсутствие OCI labels**
   - **Проблема:** Нет метаданных о версии, описании, источнике
   - **Решение:** Добавить стандартные org.opencontainers.image.* labels

10. **Frontend healthcheck в dev использует curl**
    - **Местоположение:** docker-compose.dev.yml:177
    - **Проблема:** node:22-trixie-slim может не содержать curl
    - **Решение:** Использовать wget или установить curl

#### СРЕДНИЙ ПРИОРИТЕТ

11. **Volumes без явного driver**
    - **Местоположение:** Оба файла (секция volumes)
    - **Проблема:** Неявное использование default driver
    - **Решение:** Явно указать driver: local

12. **Отсутствие profiles для разных сценариев**
    - **Проблема:** Невозможно запустить только часть стека
    - **Примеры:** `profiles: [core]`, `[monitoring]`, `[testing]`
    - **Решение:** Добавить профили

13. **Дублирование Traefik labels**
    - **Проблема:** Повторяющиеся паттерны в labels
    - **Решение:** Использовать YAML anchors & aliases

14. **Postgres volume в dev монтирует /var/lib/postgresql**
    - **Местоположение:** docker-compose.dev.yml:37
    - **Проблема:** Должен монтировать /var/lib/postgresql/data
    - **Риск:** Некорректное хранение данных
    - **Решение:** Изменить на `/var/lib/postgresql/data` как в prod

15. **Backend в dev делает npm install при каждом старте**
    - **Местоположение:** docker-compose.dev.yml:86-94
    - **Проблема:** Замедляет startup (но работает с кешированием)
    - **Решение:** Оставить как есть (это feature для dev)

16. **Отсутствие зависимости frontend от backend в dev**
    - **Местоположение:** docker-compose.dev.yml (frontend service)
    - **Проблема:** Frontend может стартовать раньше API
    - **Решение:** Добавить depends_on backend

#### НИЗКИЙ ПРИОРИТЕТ (улучшения)

17. **Комментарии на русском языке**
    - **Статус:** Хорошо для локального проекта
    - **Рекомендация:** Сохранить для удобства команды

18. **Container names хардкод**
    - **Проблема:** Невозможно запустить несколько копий стека
    - **Решение:** Использовать compose project name prefix (опционально)

19. **Отсутствие networks с ipam configuration**
    - **Проблема:** Автоматическое выделение IP подсетей
    - **Решение:** Явно указать subnet для предсказуемости (опционально)

20. **Backend в prod имеет volumes для uploads/logs**
    - **Проблема:** В stateless архитектуре данные должны быть в S3/external storage
    - **Решение:** Документировать как временное решение

---

### 1.2 Отсутствующие Best Practices 2025

#### Должны быть добавлены:

1. **Resource limits (deploy.resources)**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1.0'
         memory: 1G
       reservations:
         cpus: '0.25'
         memory: 256M
   ```

2. **Logging configuration**
   ```yaml
   logging:
     driver: json-file
     options:
       max-size: "10m"
       max-file: "3"
       labels: "service,env"
   ```

3. **Security options**
   ```yaml
   security_opt:
     - no-new-privileges:true
   read_only: true  # где применимо
   tmpfs:  # для read-only контейнеров
     - /tmp
     - /var/run
   ```

4. **User specification (non-root)**
   ```yaml
   user: "node:node"  # для Node.js сервисов
   user: "999:999"    # для PostgreSQL
   ```

5. **Podman-specific volumes с :z suffix**
   ```yaml
   volumes:
     - ./data:/data:z  # SELinux relabeling
   ```

6. **Environment file segregation**
   ```yaml
   env_file:
     - .env.common
     - .env.dev  # или .env.prod
   ```

7. **Secrets management (production)**
   ```yaml
   secrets:
     - postgres_password
     - jwt_secret

   secrets:
     postgres_password:
       file: ./secrets/postgres_password.txt
   ```

8. **OCI Image Labels**
   ```yaml
   labels:
     org.opencontainers.image.title: "Pressograph Backend"
     org.opencontainers.image.version: "1.0.0"
     org.opencontainers.image.created: "2025-10-29"
     org.opencontainers.image.source: "https://github.com/..."
   ```

9. **Profiles для разных scenarios**
   ```yaml
   profiles:
     - core      # postgres, backend, frontend
     - monitoring # prometheus, grafana
     - testing   # test database
   ```

10. **YAML Anchors для DRY**
    ```yaml
    x-common-labels: &common-labels
      org.opencontainers.image.vendor: "Pressograph"

    services:
      backend:
        labels:
          <<: *common-labels
          service: backend
    ```

11. **Healthcheck с failure actions**
    ```yaml
    depends_on:
      postgres:
        condition: service_healthy
        restart: true  # Restart если зависимость падает
    ```

12. **Networks с явной конфигурацией**
    ```yaml
    networks:
      internal:
        driver: bridge
        internal: true  # Явно указать что это internal
        ipam:
          config:
            - subnet: 172.28.0.0/16
    ```

---

### 1.3 Хорошие практики (уже используются)

✅ **Что уже сделано правильно:**

1. External network для Traefik (`traefik-public`)
2. Separate internal network для базы данных
3. Named volumes с явными именами
4. Healthchecks на всех сервисах (кроме frontend prod)
5. `depends_on` с `condition: service_healthy`
6. SELinux-совместимые volume mounts (`:z` суффикс в dev)
7. Правильная изоляция: БД только в internal network
8. Traefik labels с priority для правильной маршрутизации
9. Использование middleware (@file) из централизованной конфигурации
10. restart: unless-stopped для production
11. Детальные комментарии в dev файле
12. Separate compose files для dev/prod

---

## 2. ДЕТАЛЬНЫЙ ПЛАН ОБНОВЛЕНИЯ

### 2.1 ЧТО УДАЛИТЬ

#### Файл: docker-compose.dev.yml

```yaml
# УДАЛИТЬ:
version: '3.8'  # строка 1 - устарел
```

#### Файл: docker-compose.prod.yml

```yaml
# УДАЛИТЬ:
version: '3.8'  # строка 1 - устарел
```

#### Файл: docker-compose.dev.yml (postgres)

```yaml
# ИЗМЕНИТЬ (не удалять, но исправить):
volumes:
  - postgres-dev-data:/var/lib/postgresql  # НЕПРАВИЛЬНО

# НА:
volumes:
  - postgres-dev-data:/var/lib/postgresql/data  # ПРАВИЛЬНО
```

---

### 2.2 ЧТО ДОБАВИТЬ

#### Глобально для всех сервисов:

1. **Resource limits**
   - PostgreSQL: 512M RAM, 0.5 CPU
   - Backend: 1G RAM, 1.0 CPU
   - Frontend (dev Vite): 512M RAM, 0.5 CPU
   - Frontend (prod Nginx): 256M RAM, 0.25 CPU

2. **Logging configuration**
   ```yaml
   logging:
     driver: json-file
     options:
       max-size: "10m"
       max-file: "3"
       labels: "service,env,project"
   ```

3. **Security options**
   ```yaml
   security_opt:
     - no-new-privileges:true
   cap_drop:
     - ALL
   cap_add:
     - NET_BIND_SERVICE  # только для сервисов на привилегированных портах
   ```

4. **User specification**
   - PostgreSQL: `user: "999:999"`
   - Node.js: `user: "node:node"`
   - Nginx: `user: "101:101"`

5. **OCI Labels** (все сервисы)
   ```yaml
   labels:
     org.opencontainers.image.title: "Service Name"
     org.opencontainers.image.version: "${VERSION:-1.0.0}"
     org.opencontainers.image.created: "2025-10-29"
     org.opencontainers.image.authors: "Pressograph Team"
     org.opencontainers.image.source: "https://github.com/your-org/pressure-test-visualizer"
     org.opencontainers.image.vendor: "Pressograph"
     com.pressograph.environment: "development"  # или production
   ```

#### Специфично для сервисов:

**PostgreSQL (оба файла):**
```yaml
# Добавить:
user: "999:999"
shm_size: 128m  # для PostgreSQL performance
environment:
  POSTGRES_INITDB_ARGS: "-E UTF8 --locale=en_US.UTF-8"
healthcheck:
  start_period: 30s  # добавить в prod (в dev уже есть интервалы)
```

**Backend (dev):**
```yaml
# Добавить:
depends_on:
  - postgres  # уже есть
healthcheck:
  start_period: 90s  # увеличить с 60s (npm install может быть медленным)
env_file:
  - .env.dev
# Удалить хардкод паролей из environment секции
```

**Backend (prod):**
```yaml
# Добавить:
healthcheck:
  test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 45s
env_file:
  - .env.prod
```

**Frontend (dev):**
```yaml
# Добавить:
depends_on:
  backend:
    condition: service_healthy
```

**Frontend (prod):**
```yaml
# Добавить:
healthcheck:
  test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 15s
read_only: true
tmpfs:
  - /var/cache/nginx
  - /var/run
  - /tmp
```

#### Новые секции:

**YAML Anchors (в начале файла после удаления version):**
```yaml
# Общие конфигурации
x-common-labels: &common-labels
  org.opencontainers.image.vendor: "Pressograph"
  org.opencontainers.image.source: "https://github.com/your-org/pressure-test-visualizer"

x-common-logging: &common-logging
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"

x-common-security: &common-security
  security_opt:
    - no-new-privileges:true
  cap_drop:
    - ALL

x-healthcheck-defaults: &healthcheck-defaults
  interval: 30s
  timeout: 5s
  retries: 3
```

**Profiles (опционально):**
```yaml
services:
  postgres:
    profiles: ["core"]
  backend:
    profiles: ["core"]
  frontend:
    profiles: ["core"]
```

---

### 2.3 ЧТО ИЗМЕНИТЬ

#### Структура именования файлов

**ВАРИАНТ A (Рекомендуемый):** Простое переименование
```
docker-compose.dev.yml  → compose.dev.yaml
docker-compose.prod.yml → compose.prod.yaml
.env                    → .env.prod
# Создать новый: .env.dev
```

**Преимущества:**
- Соответствие best practices 2025
- Минимальные изменения в workflows
- Четкое разделение окружений

**Изменения в Makefile:**
```makefile
dev-compose:
	podman-compose -f deploy/compose/compose.dev.yaml up -d

prod-compose:
	podman-compose -f deploy/compose/compose.prod.yaml up -d
```

---

**ВАРИАНТ B:** Base + Override pattern
```
compose.yaml          # Base configuration (shared)
compose.override.yaml # Development overrides (default)
compose.prod.yaml     # Production configuration
.env.dev              # Dev environment vars
.env.prod             # Prod environment vars
```

**Преимущества:**
- DRY (Don't Repeat Yourself)
- Стандартный паттерн Docker Compose
- `podman-compose up` автоматически использует override

**Недостатки:**
- Требует больше рефакторинга
- Сложнее для понимания новичками

---

**ВАРИАНТ C:** Директории (для больших проектов)
```
deploy/compose/
├── dev/
│   ├── compose.yaml
│   └── .env
├── prod/
│   ├── compose.yaml
│   └── .env
└── shared/
    ├── compose.base.yaml
    └── middleware.yaml
```

**Преимущества:**
- Максимальная изоляция
- Легко добавить staging, test окружения

**Недостатки:**
- Overkill для текущего проекта
- Усложняет структуру

---

**РЕКОМЕНДАЦИЯ:** Использовать **ВАРИАНТ A** для Pressograph

**Причины:**
1. Простота миграции (минимальные изменения)
2. Соответствие best practices 2025
3. Четкое разделение dev/prod
4. Текущий проект не требует сложной иерархии
5. Легко понимается командой

---

### 2.4 Environment Variables Reorganization

#### Текущая структура:
```
.env  # только production secrets
```

#### Новая структура:
```
.env.example         # Шаблон с документацией
.env.dev             # Development environment
.env.prod            # Production secrets (gitignored)
.env.common          # Shared variables (опционально)
```

#### .env.dev (новый файл):
```bash
# ═══════════════════════════════════════════════════════════════════
# Pressograph Development Environment Variables
# ═══════════════════════════════════════════════════════════════════

# PostgreSQL
POSTGRES_DB=pressograph_dev
POSTGRES_USER=pressograph_dev
POSTGRES_PASSWORD=devpassword_changeme_2025

# Node.js Backend
NODE_ENV=development
PORT=3001
DEBUG=pressograph:*
LOG_LEVEL=debug

# Database Connection
DATABASE_URL=postgresql://pressograph_dev:devpassword_changeme_2025@postgres:5432/pressograph_dev

# JWT Secrets (DEV ONLY - NOT FOR PRODUCTION!)
JWT_SECRET=dev_jwt_secret_change_in_production_2025
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_production_2025
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS & URLs
ALLOWED_ORIGINS=https://dev-pressograph.infra4.dev,http://localhost:5173,http://localhost:5174
BASE_URL=https://dev-pressograph.infra4.dev
MAX_FILE_SIZE=10mb

# Frontend (Vite)
VITE_API_URL=/api

# OCI Labels
VERSION=1.0.0-dev
BUILD_DATE=2025-10-29
```

#### .env.prod (переименовать текущий .env):
```bash
# ═══════════════════════════════════════════════════════════════════
# Pressograph Production Environment Variables
# ═══════════════════════════════════════════════════════════════════
# WARNING: This file contains production secrets!
# Keep secure, never commit to git
# ═══════════════════════════════════════════════════════════════════

# PostgreSQL
POSTGRES_DB=pressograph
POSTGRES_USER=pressograph
POSTGRES_PASSWORD=PrGr@ph_S3cur3_P@ssw0rd_2025

# Node.js Backend
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Database Connection
DATABASE_URL=postgresql://pressograph:${POSTGRES_PASSWORD}@postgres:5432/pressograph

# JWT Secrets
JWT_SECRET=PrGr@ph_JWT_S3cr3t_K3y_Ch@ng3_In_Pr0ducti0n_2025_XyZ
JWT_REFRESH_SECRET=PrGr@ph_Refr3sh_S3cr3t_K3y_Ch@ng3_In_Pr0ducti0n_2025_AbC
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# URLs
ALLOWED_ORIGINS=https://pressograph.infra4.dev
BASE_URL=https://pressograph.infra4.dev
MAX_FILE_SIZE=10mb

# Frontend Build Args
VITE_API_URL=/api

# OCI Labels
VERSION=1.0.0
BUILD_DATE=2025-10-29
```

#### .env.example (новый файл):
```bash
# ═══════════════════════════════════════════════════════════════════
# Pressograph Environment Variables Template
# ═══════════════════════════════════════════════════════════════════
# Copy to .env.dev or .env.prod and fill in the values
# ═══════════════════════════════════════════════════════════════════

# PostgreSQL Configuration
POSTGRES_DB=pressograph
POSTGRES_USER=pressograph
POSTGRES_PASSWORD=<generate-strong-password>

# Database Connection URL
# Format: postgresql://user:password@host:port/database
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}

# JWT Authentication
# Generate with: openssl rand -hex 32
JWT_SECRET=<generate-with-openssl-rand-hex-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-hex-32>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application URLs
ALLOWED_ORIGINS=https://pressograph.infra4.dev
BASE_URL=https://pressograph.infra4.dev
MAX_FILE_SIZE=10mb

# Frontend Build
VITE_API_URL=/api

# Versioning
VERSION=1.0.0
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ═══════════════════════════════════════════════════════════════════
# SECURITY NOTES:
# ═══════════════════════════════════════════════════════════════════
# 1. Never commit .env.prod to git
# 2. Use strong passwords (32+ characters, mixed case, numbers, symbols)
# 3. Rotate secrets regularly (every 90 days recommended)
# 4. Use different secrets for dev and prod
# 5. Consider using Podman Secrets for production
# ═══════════════════════════════════════════════════════════════════
```

---

## 3. РЕКОМЕНДАЦИИ ПО СТРУКТУРЕ

### 3.1 Финальная структура директорий

```
/opt/projects/repositories/pressure-test-visualizer/
├── deploy/
│   └── compose/
│       ├── compose.dev.yaml          # Development environment (новое имя)
│       ├── compose.prod.yaml         # Production environment (новое имя)
│       ├── .env.dev                  # Dev environment variables (новый)
│       ├── .env.prod                 # Prod secrets (переименованный .env)
│       ├── .env.example              # Template with docs (новый)
│       ├── .gitignore                # Ignore .env.prod (обновить)
│       ├── README.md                 # Compose docs (обновить)
│       └── MODERNIZATION_ANALYSIS.md # Этот документ
├── Makefile                          # Обновить пути к compose файлам
└── ...
```

### 3.2 .gitignore обновления

```gitignore
# Environment files with secrets
.env.prod
.env.local

# Keep templates
!.env.example
!.env.dev

# Compose overrides (if using)
compose.override.yaml
```

### 3.3 README.md структура

Обновить `/opt/projects/repositories/pressure-test-visualizer/deploy/compose/README.md`:

```markdown
# Pressograph Compose Deployments

## Quick Start

### Development
```bash
cd /opt/projects/repositories/pressure-test-visualizer
make dev-compose
# or directly:
podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev up -d
```

### Production
```bash
cd /opt/projects/repositories/pressure-test-visualizer
make prod-compose
# or directly:
podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod up -d
```

## Files Overview

- `compose.dev.yaml` - Development with hot reload
- `compose.prod.yaml` - Production optimized
- `.env.dev` - Development variables (committed)
- `.env.prod` - Production secrets (gitignored)
- `.env.example` - Template for new deployments

## Best Practices 2025

✅ Compose Specification (no version field)
✅ Resource limits configured
✅ Logging rotation enabled
✅ Security hardening (no-new-privileges, read-only where applicable)
✅ Healthchecks with start_period
✅ Proper dependency ordering
✅ OCI labels for metadata
✅ SELinux compatible volume mounts
```

---

## 4. МИГРАЦИОННЫЙ ПУТЬ (Zero Downtime)

### 4.1 Подготовка (5 минут)

```bash
cd /opt/projects/repositories/pressure-test-visualizer/deploy/compose

# 1. Создать резервные копии
cp docker-compose.dev.yml docker-compose.dev.yml.backup
cp docker-compose.prod.yml docker-compose.prod.yml.backup
cp .env .env.backup

# 2. Создать новые env файлы
cp .env .env.prod
touch .env.dev
# Заполнить .env.dev согласно секции 2.4

# 3. Создать .env.example
touch .env.example
# Заполнить согласно секции 2.4

# 4. Обновить .gitignore
echo ".env.prod" >> .gitignore
echo ".env.local" >> .gitignore
```

### 4.2 Обновление Development (без даунтайма)

```bash
# 1. Проверить текущее состояние
podman-compose -f docker-compose.dev.yml ps

# 2. Переименовать файл
mv docker-compose.dev.yml compose.dev.yaml

# 3. Применить обновления (создать новый файл с модернизацией)
# См. секцию 5 - готовые файлы

# 4. Протестировать конфигурацию
podman-compose -f compose.dev.yaml --env-file .env.dev config

# 5. Постепенное переключение (по одному сервису)
# Frontend (без данных, можно рестартовать)
podman-compose -f compose.dev.yaml up -d --force-recreate frontend

# Backend (graceful restart)
podman-compose -f compose.dev.yaml up -d --force-recreate backend

# PostgreSQL (осторожно! есть данные)
# Убедиться что volume path правильный
podman-compose -f compose.dev.yaml up -d --no-recreate postgres

# 6. Проверить работоспособность
curl -k https://dev-pressograph.infra4.dev/api/health
curl -k https://dev-pressograph.infra4.dev/
```

### 4.3 Обновление Production (с минимальным даунтаймом)

**ВАЖНО: Делать в maintenance window!**

```bash
# 1. Уведомить пользователей (если есть)
echo "Maintenance window: starting"

# 2. Создать backup базы данных
podman exec pressograph-db pg_dump -U pressograph pressograph > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Переименовать файл
mv docker-compose.prod.yml compose.prod.yaml

# 4. Применить обновления
# См. секцию 5 - готовые файлы

# 5. Validate configuration
podman-compose -f compose.prod.yaml --env-file .env.prod config

# 6. Rolling update

# Остановить только frontend (пользователи увидят offline)
podman stop pressograph-frontend

# Обновить backend (graceful)
podman-compose -f compose.prod.yaml up -d --force-recreate backend
# Ждем healthcheck: ~45 секунд
sleep 50

# Обновить frontend
podman-compose -f compose.prod.yaml up -d --force-recreate frontend
# Ждем healthcheck: ~15 секунд
sleep 20

# PostgreSQL - только обновить metadata (не пересоздавать!)
podman-compose -f compose.prod.yaml up -d --no-recreate postgres

# 7. Проверка
curl -k https://pressograph.infra4.dev/api/health
curl -k https://pressograph.infra4.dev/

# 8. Мониторинг логов
podman-compose -f compose.prod.yaml logs -f --tail 100
```

**Ожидаемый даунтайм:**
- Frontend: ~30 секунд (restart)
- Backend: ~60 секунд (rebuild + healthcheck)
- Database: 0 секунд (no restart)
- **Общий даунтайм: ~90 секунд**

### 4.4 Обновление Makefile

```bash
# Заменить в Makefile:
sed -i 's/docker-compose.dev.yml/compose.dev.yaml/g' Makefile
sed -i 's/docker-compose.prod.yml/compose.prod.yaml/g' Makefile

# Добавить env-file flags:
# Добавить в dev-compose target:
#   podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev up -d

# Добавить в prod-compose target:
#   podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod up -d
```

### 4.5 Rollback Plan (если что-то пошло не так)

```bash
# Development rollback
podman-compose -f compose.dev.yaml down
podman-compose -f docker-compose.dev.yml.backup up -d

# Production rollback
podman-compose -f compose.prod.yaml down
podman-compose -f docker-compose.prod.yml.backup up -d

# Database restore (критический случай)
podman exec -i pressograph-db psql -U pressograph pressograph < backup_YYYYMMDD_HHMMSS.sql
```

---

## 5. ГОТОВЫЕ ОБНОВЛЕННЫЕ ФАЙЛЫ

См. следующие файлы в этой же директории:

1. `compose.dev.yaml` - Модернизированный development
2. `compose.prod.yaml` - Модернизированный production
3. `.env.dev` - Development переменные
4. `.env.example` - Шаблон
5. `MIGRATION.md` - Пошаговая инструкция миграции
6. `Makefile.patch` - Изменения для Makefile

---

## 6. ПРОВЕРОЧНЫЙ ЧЕКЛИСТ

### После миграции проверить:

- [ ] Version field удален из обоих файлов
- [ ] Resource limits настроены на всех сервисах
- [ ] Logging rotation включен
- [ ] Healthchecks имеют start_period
- [ ] Security options добавлены (no-new-privileges)
- [ ] OCI labels добавлены
- [ ] PostgreSQL volume path исправлен (/var/lib/postgresql/data)
- [ ] .env.dev создан и используется
- [ ] .env.prod содержит production secrets
- [ ] .env.example создан с документацией
- [ ] .gitignore обновлен
- [ ] Makefile обновлен с новыми путями
- [ ] Frontend depends_on backend в dev
- [ ] Все healthchecks работают: `podman ps` (здоровый статус)
- [ ] Traefik routing работает
- [ ] Логи не содержат ошибок
- [ ] API доступен: `curl https://dev-pressograph.infra4.dev/api/health`
- [ ] Frontend загружается: `curl https://dev-pressograph.infra4.dev`

### Production специфично:

- [ ] Backend healthcheck использует wget (а не curl)
- [ ] Frontend read_only режим работает
- [ ] Volumes persistent после рестарта
- [ ] SSL сертификаты валидны (Traefik)
- [ ] Database backups перед миграцией
- [ ] Мониторинг resource usage после обновления

---

## 7. ДОПОЛНИТЕЛЬНЫЕ УЛУЧШЕНИЯ (Опционально)

### 7.1 Podman Secrets (вместо env файлов для prod)

```yaml
# compose.prod.yaml
services:
  postgres:
    secrets:
      - postgres_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password

secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
```

**Создание:**
```bash
mkdir -p secrets
echo "secure_password" > secrets/postgres_password.txt
chmod 600 secrets/postgres_password.txt
echo "secrets/" >> .gitignore
```

### 7.2 Profiles для частичного запуска

```yaml
# compose.dev.yaml
services:
  postgres:
    profiles: ["core", "db"]
  backend:
    profiles: ["core", "api"]
  frontend:
    profiles: ["core", "web"]

# Запуск только backend:
podman-compose --profile core --profile api up -d
```

### 7.3 Extensions для DRY

```yaml
x-backend-env: &backend-env
  NODE_ENV: ${NODE_ENV:-production}
  PORT: ${PORT:-3001}
  DATABASE_URL: ${DATABASE_URL}
  JWT_SECRET: ${JWT_SECRET}

services:
  backend:
    environment:
      <<: *backend-env
      CUSTOM_VAR: value
```

### 7.4 Monitoring stack (отдельный compose файл)

```yaml
# compose.monitoring.yaml
services:
  prometheus:
    image: prom/prometheus:latest
    profiles: ["monitoring"]
    # ...

  grafana:
    image: grafana/grafana:latest
    profiles: ["monitoring"]
    # ...

# Запуск с мониторингом:
podman-compose -f compose.prod.yaml -f compose.monitoring.yaml up -d
```

### 7.5 Automated Testing

```yaml
# compose.test.yaml
services:
  test-db:
    image: postgres:18-trixie
    profiles: ["test"]
    environment:
      POSTGRES_DB: pressograph_test
    tmpfs:
      - /var/lib/postgresql/data  # In-memory для тестов

  test-runner:
    build: ../../server
    profiles: ["test"]
    depends_on: [test-db]
    command: npm test

# Запуск тестов:
podman-compose -f compose.test.yaml --profile test up --abort-on-container-exit
```

---

## 8. КОМАНДЫ ДЛЯ ПРИМЕНЕНИЯ ИЗМЕНЕНИЙ

### Полная миграция (скрипт)

```bash
#!/bin/bash
# migrate-compose.sh

set -e

echo "🔄 Starting Compose files modernization..."

# Backup
echo "📦 Creating backups..."
cp docker-compose.dev.yml docker-compose.dev.yml.backup
cp docker-compose.prod.yml docker-compose.prod.yml.backup
cp .env .env.backup

# Rename
echo "📝 Renaming files..."
mv docker-compose.dev.yml compose.dev.yaml
mv docker-compose.prod.yml compose.prod.yaml
mv .env .env.prod

# Create new files
echo "📄 Creating new environment files..."
# (копировать содержимое из секции 2.4)

# Update Makefile
echo "🔧 Updating Makefile..."
sed -i 's/docker-compose.dev.yml/compose.dev.yaml/g' ../Makefile
sed -i 's/docker-compose.prod.yml/compose.prod.yaml/g' ../Makefile

# Validate
echo "✅ Validating configurations..."
podman-compose -f compose.dev.yaml --env-file .env.dev config > /dev/null
podman-compose -f compose.prod.yaml --env-file .env.prod config > /dev/null

echo "✅ Migration complete!"
echo "Next steps:"
echo "  1. Review compose.dev.yaml and compose.prod.yaml"
echo "  2. Test dev: make dev-compose"
echo "  3. Test prod: make prod-compose (in maintenance window)"
```

---

## 9. СПРАВОЧНАЯ ИНФОРМАЦИЯ

### 9.1 Полезные команды

```bash
# Проверка синтаксиса
podman-compose -f compose.dev.yaml config

# Вывод итоговой конфигурации
podman-compose -f compose.dev.yaml --env-file .env.dev config

# Dry-run (показать что будет создано)
podman-compose -f compose.dev.yaml up --no-start

# Пересоздать только один сервис
podman-compose -f compose.dev.yaml up -d --force-recreate backend

# Проверка healthchecks
podman ps --format "table {{.Names}}\t{{.Status}}"

# Проверка resource usage
podman stats --no-stream

# Инспекция labels
podman inspect pressograph-backend | jq '.[0].Config.Labels'
```

### 9.2 Документация

- Compose Specification: https://github.com/compose-spec/compose-spec/blob/main/spec.md
- Podman Compose: https://docs.podman.io/en/latest/markdown/podman-compose.1.html
- OCI Image Spec: https://github.com/opencontainers/image-spec/blob/main/annotations.md
- Podman Secrets: https://docs.podman.io/en/latest/markdown/podman-secret.1.html

### 9.3 Сравнение размеров файлов

```
docker-compose.dev.yml:  209 строк → compose.dev.yaml:  ~280 строк (+34%)
docker-compose.prod.yml: 121 строка → compose.prod.yaml: ~180 строк (+48%)
```

**Причины увеличения:**
- Resource limits (6 строк на сервис)
- Logging configuration (5 строк на сервис)
- Security options (4 строки на сервис)
- OCI labels (8 строк на сервис)
- YAML anchors (20 строк в начале)
- Дополнительные комментарии

**Выгоды:**
✅ Production-ready конфигурация
✅ Resource safety (no OOM killer)
✅ Security hardening
✅ Proper observability (logs rotation)
✅ Compliance с best practices 2025

---

## 10. ЗАКЛЮЧЕНИЕ

Модернизация Compose файлов Pressograph принесет:

1. **Соответствие стандартам 2025**
   - Удаление устаревшего version field
   - Современное именование (compose.yaml)

2. **Безопасность**
   - Resource limits защитят хост от OOM
   - Security options (no-new-privileges, cap_drop)
   - Secrets management для production
   - Read-only файловые системы где применимо

3. **Observability**
   - Log rotation (предотвращение заполнения диска)
   - OCI labels для inventory и мониторинга
   - Healthchecks с правильными start_period

4. **Надежность**
   - Правильные зависимости (depends_on with conditions)
   - Resource reservations для QoS
   - Graceful degradation (restart policies)

5. **Maintainability**
   - DRY через YAML anchors
   - Четкое разделение dev/prod (.env.dev, .env.prod)
   - Документация и примеры (.env.example)

**Рекомендуемая последовательность:**
1. ✅ Сегодня: Обновить development (низкий риск)
2. ⏳ Через 1-2 дня: Протестировать dev в течение недели
3. ⏳ После тестирования: Обновить production (в maintenance window)

**Время выполнения:**
- Preparation: 15 минут
- Development migration: 10 минут
- Testing: 1-2 дня
- Production migration: 30 минут (в maintenance window)

**Риски:** Минимальные при следовании migration plan
**Выгоды:** Существенные для долгосрочной поддержки проекта

---

**Автор анализа:** Claude (DevOps Engineer)
**Дата:** 2025-10-29
**Статус:** ✅ Готово к применению
