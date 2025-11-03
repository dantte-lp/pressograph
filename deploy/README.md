# Pressograph Development Environment

Полноценная контейнеризованная среда разработки на Podman для проекта Pressograph.

## Архитектура

### Образы

- **node:lts-trixie** - Node.js LTS на Debian Trixie
- **postgres:18-trixie** - PostgreSQL 18 на Debian Trixie
- **docker.io/valkey/valkey:9-trixie** - Valkey 9 (Redis-compatible) на Debian Trixie

### Контейнеры

1. **pressograph-dev-workspace** - Основной контейнер разработки
   - Node.js с pnpm
   - Zsh с Oh My Zsh
   - Dev инструменты: TypeScript, ESLint, Prettier, Drizzle Kit, Turbo
   - PostgreSQL и Redis клиенты
   - Пользователь: `developer` (UID 1000)
   - Рабочая директория: `/workspace`

2. **pressograph-dev-db** - PostgreSQL 18
   - База данных: `pressograph`
   - Пользователь: `postgres`
   - Пароль: `postgres`
   - Порт: `5432`

3. **pressograph-dev-cache** - Valkey (Redis)
   - Порт: `6379`

### Volumes

- `pressograph-dev-postgres-data` - Данные PostgreSQL
- `pressograph-dev-cache-data` - Данные Valkey
- `pressograph-dev-node-modules` - Node.js зависимости (для производительности)
- `pressograph-dev-next-cache` - Next.js build cache
- `pressograph-dev-pnpm-store` - pnpm store

### Сети

- `pressograph-dev-network` (172.20.0.0/16) - Внутренняя сеть для всех контейнеров
- `traefik-public` - Внешняя сеть для интеграции с Traefik reverse proxy

## Traefik интеграция

Pressograph настроен для работы с глобальным Traefik instance через Docker Provider.

### Автоматическое обнаружение

При запуске через `podman-compose`, контейнер `workspace` автоматически регистрируется в Traefik через labels:

- **Домен:** `dev-pressograph.infra4.dev`
- **HTTPS:** Автоматический сертификат через Let's Encrypt (Cloudflare DNS)
- **Редирект:** HTTP → HTTPS
- **Порт:** 3000 (Next.js dev server)

### Необходимые шаги

1. **DNS запись:** Создать A/CNAME запись `dev-pressograph.infra4.dev` → ваш сервер
2. **Traefik запущен:** Убедитесь, что `/opt/projects/repositories/traefik` работает
3. **Сеть существует:** `podman network ls | grep traefik-public`

### Проверка интеграции

```bash
# Проверить labels контейнера
podman inspect pressograph-dev-workspace | grep -A 20 Labels

# Проверить сеть
podman network inspect traefik-public | grep pressograph

# Проверить Traefik dashboard
# https://tr-01.infra4.dev (если настроен)

# Проверить маршруты через API
curl -s https://tr-01.infra4.dev/api/http/routers | grep pressograph
```

### Альтернатива: File Provider

Если Docker Provider не используется, доступен File Provider конфигурация:

```bash
# Скопировать конфигурацию в Traefik
cp deploy/traefik/pressograph-dev.yml /opt/projects/repositories/traefik/config/dynamic/

# Перезагрузить Traefik (если auto-reload отключен)
podman restart traefik
```

Подробнее см. `TRAEFIK_INTEGRATION.md` в корне проекта

## Быстрый старт

### Первичная настройка

```bash
cd /opt/projects/repositories/pressograph

# Автоматическая настройка (build + up)
./deploy/scripts/dev-setup.sh

# ИЛИ вручную с помощью скриптов
chmod +x deploy/scripts/*.sh
./deploy/scripts/dev-setup.sh
```

### Вход в контейнер разработки

```bash
# Войти в контейнер
./deploy/scripts/dev-enter.sh

# Внутри контейнера:
pnpm install          # Установка зависимостей
pnpm db:push          # Применение схемы БД
pnpm dev              # Запуск Next.js dev server
```

### Управление средой

```bash
# Просмотр логов
./deploy/scripts/dev-logs.sh           # Все сервисы
./deploy/scripts/dev-logs.sh workspace # Только workspace

# Остановка
podman-compose -f deploy/compose/compose.dev.yaml stop

# Запуск после остановки
podman-compose -f deploy/compose/compose.dev.yaml start

# Полное удаление
./deploy/scripts/dev-destroy.sh
```

## Использование с Taskfile

Если установлен [Task](https://taskfile.dev/):

```bash
# Управление средой
task dev:setup      # Первичная настройка
task dev:start      # Запуск контейнеров
task dev:stop       # Остановка
task dev:restart    # Перезапуск
task dev:enter      # Вход в контейнер
task dev:logs       # Просмотр логов
task dev:destroy    # Полное удаление
task dev:rebuild    # Пересборка с нуля

# Выполнение команд внутри контейнера
task install        # pnpm install
task dev:next       # pnpm dev
task build          # pnpm build
task lint           # pnpm lint
task type-check     # pnpm type-check
task test           # pnpm test

# Работа с базой данных
task db:push        # pnpm db:push
task db:studio      # pnpm db:studio
task db:migrate     # pnpm db:generate
task db:seed        # pnpm db:seed

# Статус
task ps             # Статус контейнеров
task stats          # Ресурсы контейнеров
```

## Полезные команды

### Работа с контейнерами

```bash
# Список контейнеров
podman ps

# Статус compose
podman-compose -f deploy/compose/compose.dev.yaml ps

# Перезапуск одного контейнера
podman restart pressograph-dev-workspace

# Выполнение команды
podman exec -it pressograph-dev-workspace pnpm --version
podman exec -it -u root pressograph-dev-workspace apt update
```

### Работа с базой данных

```bash
# Подключение к PostgreSQL
podman exec -it pressograph-dev-db psql -U postgres -d pressograph

# Из контейнера workspace
PGPASSWORD=postgres psql -h db -U postgres -d pressograph

# Бэкап
podman exec pressograph-dev-db pg_dump -U postgres pressograph > backup.sql

# Восстановление
cat backup.sql | podman exec -i pressograph-dev-db psql -U postgres -d pressograph
```

### Работа с Valkey (Redis)

```bash
# Подключение к Valkey
podman exec -it pressograph-dev-cache valkey-cli

# Из контейнера workspace
redis-cli -h cache
```

### Отладка

```bash
# Логи контейнера
podman logs pressograph-dev-workspace -f

# Проверка сети
podman exec pressograph-dev-workspace ping db
podman exec pressograph-dev-workspace ping cache

# Проверка volumes
podman volume inspect pressograph-dev-postgres-data
podman volume ls | grep pressograph
```

## Переменные окружения

### Шаблоны окружения

В корне проекта доступны три шаблона:

1. **`.env.example`** - Основной шаблон со всеми доступными переменными
2. **`.env.dev.example`** - Настройки для development с примерами
3. **`.env.prod.example`** - Настройки для production с чеклистом безопасности

### Генерация секретов

Используйте встроенный скрипт для генерации криптографически стойких секретов:

```bash
# Автоматическая генерация .env.local для development
task secrets:generate

# Или запустить скрипт напрямую
./deploy/scripts/generate-secrets.sh

# Для production
task secrets:generate:prod
# или
./deploy/scripts/generate-secrets.sh --env prod

# Ротация секретов
task secrets:rotate
```

Скрипт генерирует:
- `NEXTAUTH_SECRET` - 64 hex символа (256-bit)
- `APP_SECRET` - 64 hex символа (256-bit)
- `JWT_SECRET` - 64 hex символа (256-bit)
- `API_SECRET_KEY` - 64 hex символа (256-bit)
- `ENCRYPTION_KEY` - 64 hex символа (256-bit)
- `POSTGRES_PASSWORD` - 32 случайных символа
- `VALKEY_PASSWORD` - 24 случайных символа (только для prod)

### Основные переменные

Минимально необходимые для запуска (генерируются автоматически):

```bash
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_TELEMETRY_DISABLED=1

# Database
DATABASE_URL=postgresql://postgres:GENERATED_PASSWORD@db:5432/pressograph
POSTGRES_USER=postgres
POSTGRES_PASSWORD=GENERATED_PASSWORD
POSTGRES_DB=pressograph

# Cache
REDIS_URL=redis://cache:6379

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=GENERATED_SECRET

# Application Secrets
APP_SECRET=GENERATED_SECRET
JWT_SECRET=GENERATED_SECRET
API_SECRET_KEY=GENERATED_SECRET
```

### Опциональные переменные

См. `.env.example` для полного списка:
- Email/SMTP настройки
- S3-совместимое хранилище
- Analytics и мониторинг
- Feature flags
- Rate limiting

## Порты

- **3000** - Next.js dev server
- **5555** - Drizzle Studio
- **5432** - PostgreSQL
- **6379** - Valkey (Redis)

## Структура проекта

```
pressograph/
├── .containerignore           # Исключения для контейнера
├── .devcontainer/
│   └── .zshrc                 # Zsh конфигурация
├── deploy/
│   ├── containerfiles/
│   │   └── Containerfile.dev  # Dev образ
│   ├── compose/
│   │   └── compose.dev.yaml   # Dev compose
│   ├── scripts/
│   │   ├── dev-setup.sh       # Первичная настройка
│   │   ├── dev-enter.sh       # Вход в контейнер
│   │   ├── dev-logs.sh        # Просмотр логов
│   │   └── dev-destroy.sh     # Очистка
│   └── README.md              # Эта документация
├── Taskfile.yml               # Task automation
└── [Next.js project files]
```

## Особенности

### Hot Reload

Весь проект примонтирован как bind mount в `/workspace`, поэтому все изменения на хосте сразу видны в контейнере. Next.js автоматически перезагружается при изменениях.

### Node Modules Volume

`node_modules` хранятся в named volume для улучшения производительности на Linux. Это предотвращает проблемы с permissions и ускоряет операции с файлами.

### Non-root пользователь

Контейнер workspace работает от пользователя `developer` (UID 1000). Это безопасно и соответствует best practices.

### Zsh с Oh My Zsh

Включены плагины: git, node, npm, pnpm, docker, sudo.

Алиасы:
- `pn` → `pnpm`
- `dev` → `pnpm dev`
- `build` → `pnpm build`
- `lint` → `pnpm lint`
- `tc` → `pnpm type-check`
- `test` → `pnpm test`
- `db` → `pnpm db:studio`

## Типичные проблемы

### Контейнер не запускается

```bash
# Проверка логов
podman logs pressograph-dev-workspace

# Проверка образа
podman images | grep pressograph-dev

# Пересборка
./deploy/scripts/dev-destroy.sh
./deploy/scripts/dev-setup.sh
```

### БД недоступна

```bash
# Проверка здоровья
podman healthcheck run pressograph-dev-db

# Перезапуск БД
podman restart pressograph-dev-db

# Ждём запуска (10-15 секунд)
sleep 15
```

### Проблемы с node_modules

```bash
# Очистка volume
podman volume rm pressograph-dev-node-modules

# Переустановка внутри контейнера
./deploy/scripts/dev-enter.sh
pnpm install
```

### Нехватка места

```bash
# Очистка неиспользуемых ресурсов
podman system prune -a

# Очистка volumes
podman volume prune
```

## Production

Для production используйте отдельный Containerfile и compose:

```bash
deploy/
├── containerfiles/
│   ├── Containerfile.dev   # Разработка
│   └── Containerfile.prod  # Production
└── compose/
    ├── compose.dev.yaml    # Разработка
    └── compose.prod.yaml   # Production
```

Production образ должен:
- Использовать multi-stage build
- Копировать только необходимые файлы
- Не включать dev зависимости
- Использовать `pnpm build` и `pnpm start`
- Работать от non-root пользователя

## Дополнительные ресурсы

- [Podman Documentation](https://docs.podman.io/)
- [Podman Compose](https://github.com/containers/podman-compose)
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Valkey](https://valkey.io/)

## Поддержка

Для вопросов и проблем создавайте issue в репозитории проекта.
