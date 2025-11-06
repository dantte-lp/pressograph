---
id: quick-start
title: Quick Start Guide
sidebar_label: Quick Start
---

# Pressograph - Quick Start Guide

**Последнее обновление**: 2025-11-06
**Статус**: Production Ready

## Содержание

1. [Предварительные требования](#предварительные-требования)
2. [Быстрый старт (5 минут)](#быстрый-старт-5-минут)
3. [Полная настройка (с мониторингом)](#полная-настройка-с-мониторингом)
4. [Ежедневный рабочий процесс](#ежедневный-рабочий-процесс)
5. [Доступ к сервисам](#доступ-к-сервисам)
6. [Общие задачи](#общие-задачи)
7. [Решение проблем](#решение-проблем)
8. [Справочник команд](#справочник-команд)

---

## Предварительные требования

### Обязательные
- **Podman** и **podman-compose** установлены
- **Task** (go-task) установлен ([инструкция](https://taskfile.dev/installation/))
- **Git** для работы с репозиторием
- Минимум 4GB RAM и 10GB свободного места на диске

### Опционально (для production)
- Доступ к Traefik instance в сети `traefik-public`
- DNS записи, указывающие на Traefik хост:
  - `dev-pressograph.infra4.dev`
  - `dbdev-pressograph.infra4.dev`
  - `dev-grafana.infra4.dev`
  - `dev-vm.infra4.dev` (VictoriaMetrics)
  - `dev-vl.infra4.dev` (VictoriaLogs)
  - `dev-vt.infra4.dev` (VictoriaTraces)

---

## Быстрый старт (5 минут)

Минимальная настройка для начала разработки.

### 1. Клонирование репозитория

```bash
git clone https://github.com/dantte-lp/pressograph.git
cd pressograph
```

### 2. Генерация секретов

```bash
task secrets:generate
```

Эта команда создаст файл `.env.local` с безопасными секретами для:
- Database passwords
- JWT secrets
- API keys

### 3. Запуск окружения разработки

```bash
# Запустить все необходимые сервисы
task dev:start

# Проверить статус
task ps
```

**Запущенные сервисы**:
- PostgreSQL 18 (порт 5432)
- Valkey 9 / Redis (порт 6379)
- Next.js workspace container (порт 3000)

### 4. Вход в контейнер разработки

```bash
task dev:enter
```

Внутри контейнера:
```bash
# Установить зависимости
pnpm install

# Применить схему базы данных
pnpm db:push

# Запустить dev сервер
pnpm dev
```

### 5. Доступ к приложению

- **Локально**: http://localhost:3000
- **Через Traefik** (если настроен): https://dev-pressograph.infra4.dev

**Готово!** Вы можете начать разработку.

---

## Полная настройка (с мониторингом)

Для production-подобного окружения с полным стеком мониторинга.

### 1. Включить OpenTelemetry (опционально)

```bash
# Редактировать .env.local
sed -i 's/OTEL_ENABLED=false/OTEL_ENABLED=true/' .env.local
```

### 2. Запустить стек мониторинга

```bash
# Запустить VictoriaMetrics stack
task metrics:start

# Проверить статус
task metrics:status
```

**Запущенные сервисы**:
- **VictoriaMetrics** - хранилище метрик
- **VictoriaLogs** - агрегация логов
- **VictoriaTraces** - распределённый трейсинг
- **vmagent** - сбор метрик
- **vmalert** - алертинг
- **Grafana** - визуализация

### 3. Доступ к мониторингу

**URLs**:
- Grafana: https://dev-grafana.infra4.dev (admin/admin)
- VictoriaMetrics: https://dev-vm.infra4.dev
- VictoriaLogs: https://dev-vl.infra4.dev
- VictoriaTraces: https://dev-vt.infra4.dev

**Локальные порты**:
- Grafana: http://localhost:3001
- VictoriaMetrics: http://localhost:8428
- VictoriaLogs: http://localhost:9428
- VictoriaTraces OTLP HTTP: http://localhost:4318

### 4. Настройка Grafana

При первом входе:
1. Логин: `admin`, пароль: `admin`
2. Смените пароль на безопасный
3. Импортируйте дашборды из `deploy/compose/victoria/grafana/provisioning/dashboards/json/`

---

## Ежедневный рабочий процесс

### Начало работы

```bash
# В директории проекта
cd /opt/projects/repositories/pressograph

# Запустить контейнеры (если остановлены)
task dev:start

# Войти в контейнер
task dev:enter

# Внутри контейнера
pnpm dev
```

### Работа с кодом

```bash
# Проверка типов
task type-check

# Линтинг
task lint

# Форматирование
task format

# Запуск тестов
task test

# Просмотр логов
task dev:logs -f
```

### Работа с базой данных

```bash
# Применить изменения схемы (development)
task db:push

# Открыть Drizzle Studio
task db:studio

# Генерация миграций (для production)
task db:migrate

# Seeding данных
task db:seed
```

### Окончание работы

```bash
# Остановить контейнеры
task dev:stop

# Или полностью удалить (с сохранением volumes)
task dev:destroy
```

---

## Доступ к сервисам

### Приложение

| Сервис | URL | Описание |
|--------|-----|----------|
| Next.js App | https://dev-pressograph.infra4.dev | Основное приложение |
| Drizzle Studio | https://dbdev-pressograph.infra4.dev | UI для базы данных |

### Observability Stack

| Сервис | URL | Credentials | Описание |
|--------|-----|-------------|----------|
| Grafana | https://dev-grafana.infra4.dev | admin/admin | Дашборды и визуализация |
| VictoriaMetrics | https://dev-vm.infra4.dev | - | UI метрик |
| VictoriaLogs | https://dev-vl.infra4.dev | - | UI логов |
| VictoriaTraces | https://dev-vt.infra4.dev | - | UI трейсов |

### Локальные порты

| Сервис | Порт | Доступ |
|--------|------|--------|
| Next.js | 3000 | http://localhost:3000 |
| PostgreSQL | 5432 | localhost:5432 |
| Valkey (Redis) | 6379 | localhost:6379 |
| Drizzle Studio | 5555 | http://localhost:5555 |
| Grafana | 3001 | http://localhost:3001 |
| VictoriaMetrics | 8428 | http://localhost:8428 |

### Подключение к базе данных

**Из контейнера**:
```bash
# Через Drizzle Studio
pnpm db:studio

# Через psql
PGPASSWORD=postgres psql -h db -U postgres -d pressograph
```

**С хоста**:
```bash
# Прямое подключение
podman exec -it pressograph-dev-db psql -U postgres -d pressograph

# Connection string
postgresql://postgres:postgres@localhost:5432/pressograph
```

---

## Общие задачи

### Перезапуск сервисов

```bash
# Перезапуск dev окружения
task dev:restart

# Перезапуск мониторинга
task metrics:restart

# Перезапуск конкретного контейнера
podman restart pressograph-dev-workspace
```

### Просмотр логов

```bash
# Все dev сервисы
task dev:logs

# Следить за логами в реальном времени
task dev:logs -f

# Конкретный сервис
task dev:logs workspace
task metrics:logs grafana
```

### Мониторинг ресурсов

```bash
# Статистика контейнеров
task stats

# Список запущенных контейнеров
task ps

# Детальная информация
podman inspect pressograph-dev-workspace
```

### Очистка

```bash
# Остановить и удалить контейнеры (volumes сохраняются)
task dev:destroy

# Полная очистка включая volumes
podman-compose -f deploy/compose/compose.dev.yaml down -v
podman-compose -f deploy/compose/compose.victoria.yaml down -v

# Очистка неиспользуемых образов
podman image prune -a
```

---

## Решение проблем

### Ошибки Taskfile

```bash
# Проверить синтаксис
task --list

# Валидация
task --dry
```

### Ошибки Compose файлов

```bash
# Валидация dev compose
podman-compose -f deploy/compose/compose.dev.yaml config

# Валидация victoria compose
podman-compose -f deploy/compose/compose.victoria.yaml config
```

### Сервис не запускается

```bash
# Проверить логи
task dev:logs SERVICE_NAME
task metrics:logs SERVICE_NAME

# Статус контейнера
podman ps -a | grep SERVICE_NAME

# Детальная информация
podman inspect CONTAINER_NAME

# Перезапустить конкретный сервис
podman restart CONTAINER_NAME
```

### Проблемы с Traefik

```bash
# Проверить, видит ли Traefik сервис
curl -s https://tr-01.infra4.dev/api/http/routers | grep pressograph

# Проверить labels контейнера
podman inspect pressograph-dev-workspace | grep -A 20 Labels

# Проверить подключение к сети
podman network inspect traefik-public
```

### Проблемы с OpenTelemetry

```bash
# Проверить переменные окружения
podman exec pressograph-dev-workspace env | grep OTEL

# Проверить что Victoria сервисы запущены
task metrics:status

# Тест подключения
podman exec pressograph-dev-workspace curl -v http://victoria-traces:4318/v1/traces
```

### Проблемы подключения к БД

```bash
# Проверить что PostgreSQL запущен
task ps | grep db

# Тест подключения
podman exec pressograph-dev-workspace psql -h db -U postgres -d pressograph -c "SELECT 1"

# Перезапуск БД
podman restart pressograph-dev-db

# Проверка готовности
podman exec pressograph-dev-db pg_isready -U postgres
```

### Проблемы с Grafana

```bash
# Сброс пароля админа
podman exec -it pressograph-grafana grafana-cli admin reset-admin-password newpassword

# Проверка логов
task metrics:logs grafana

# Проверка здоровья
curl http://localhost:3001/api/health
```

### Порты заняты

```bash
# Найти что использует порт
sudo lsof -i :3000
sudo lsof -i :5432
sudo lsof -i :6379

# Изменить порты в compose файле или остановить конфликтующий сервис
```

### TypeScript ошибки

```bash
# Регенерация типов
pnpm db:generate

# Очистка сборки
rm -rf .next
pnpm build
```

### Проблемы с зависимостями

```bash
# Очистка кеша pnpm
pnpm store prune

# Переустановка
rm -rf node_modules .pnpm-store
pnpm install
```

---

## Справочник команд

### Setup

```bash
task secrets:generate              # Генерация безопасных секретов
task secrets:rotate                # Ротация секретов (каждые 90 дней)
```

### Development

```bash
task dev:start                     # Запуск dev окружения
task dev:stop                      # Остановка dev окружения
task dev:restart                   # Перезапуск dev окружения
task dev:enter                     # Вход в контейнер
task dev:logs                      # Просмотр логов
task dev:destroy                   # Удаление контейнеров
```

### Application

```bash
task dev:next                      # Запуск Next.js dev сервера
task build                         # Production сборка
task start                         # Запуск production сервера
```

### Database

```bash
task db:push                       # Применить схему (dev)
task db:studio                     # Открыть Drizzle Studio
task db:migrate                    # Генерация миграций
task db:seed                       # Заполнить тестовыми данными
```

### Code Quality

```bash
task lint                          # Запуск ESLint
task lint:fix                      # Автофикс ESLint проблем
task format                        # Форматирование с Prettier
task format:check                  # Проверка форматирования
task type-check                    # TypeScript проверка
task test                          # Запуск тестов
task test:watch                    # Тесты в watch режиме
task test:coverage                 # Тесты с coverage
```

### Observability

```bash
task metrics:start                 # Запуск Victoria stack
task metrics:stop                  # Остановка Victoria stack
task metrics:restart               # Перезапуск Victoria stack
task metrics:logs                  # Просмотр логов
task metrics:status                # Статус сервисов
task grafana:open                  # Открыть Grafana в браузере
```

### Monitoring

```bash
task ps                            # Статус контейнеров
task stats                         # Использование ресурсов
task health                        # Health check всех сервисов
```

---

## Best Practices

### Разработка
- ✅ Всегда используйте `task` команды вместо прямых podman-compose
- ✅ Храните `.env.local` в безопасности и никогда не коммитьте
- ✅ Используйте `task dev:enter` для интерактивной работы в контейнере
- ✅ Мониторьте логи во время разработки: `task dev:logs -f`
- ✅ Работайте внутри контейнера для консистентности окружения
- ✅ Редактируйте файлы на хосте с любимым редактором (hot reload)

### Observability
- ✅ Измените пароль Grafana при первом входе
- ✅ Создавайте custom дашборды для ваших метрик
- ✅ Экспортируйте дашборды в `victoria/grafana/provisioning/dashboards/json/`
- ✅ Проверяйте и настраивайте пороги алертов в `vmalert-rules.yml`

### Безопасность
- ✅ Ротируйте секреты каждые 90 дней: `task secrets:rotate`
- ✅ Не выставляйте database/cache в сеть traefik-public
- ✅ Используйте Traefik middleware для дополнительной безопасности
- ✅ Регулярно проверяйте логи контейнеров

### Производительность
- ✅ Мониторьте использование ресурсов: `task stats`
- ✅ Настройте retention VictoriaMetrics при ограниченном дисковом пространстве
- ✅ Используйте named volumes для лучшей производительности
- ✅ Периодически очищайте неиспользуемые volumes

---

## Дополнительная документация

### Документация проекта
- [Полное руководство по разработке](../development/README.md)
- [Руководство по Observability](../infrastructure/OBSERVABILITY.md)
- [Конфигурация VictoriaMetrics](../../deploy/compose/victoria/README.md)
- [API документация](../api/README.md)
- [Архитектурные решения](../development/architecture/README.md)

### Внешние ресурсы
- [Compose Specification](https://github.com/compose-spec/compose-spec)
- [Podman Documentation](https://docs.podman.io/)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [VictoriaMetrics Docs](https://docs.victoriametrics.com/)
- [Traefik Docker Provider](https://doc.traefik.io/traefik/providers/docker/)
- [OpenTelemetry Docs](https://opentelemetry.io/docs/)

---

## Получение помощи

### Проверка статуса

```bash
# Общий статус
task ps
task metrics:status

# Детальная информация о сервисе
podman inspect CONTAINER_NAME
podman logs CONTAINER_NAME
```

### Health Checks

```bash
# VictoriaMetrics
curl http://localhost:8428/health

# VictoriaLogs
curl http://localhost:9428/health

# Grafana
curl http://localhost:3001/api/health

# PostgreSQL
podman exec pressograph-dev-db pg_isready -U postgres

# Next.js (health endpoint)
curl http://localhost:3000/api/health
```

### Валидация конфигурации

```bash
# Taskfile
task --list

# Compose файлы
podman-compose -f deploy/compose/compose.dev.yaml config
podman-compose -f deploy/compose/compose.victoria.yaml config

# Environment variables
cat .env.local
```

---

## Поддержка

Для вопросов или проблем:

1. ✅ Проверьте логи: `task dev:logs` или `task metrics:logs`
2. ✅ Просмотрите документацию в `/docs/`
3. ✅ Валидируйте конфигурацию командами выше
4. ✅ Проверьте Traefik routing и DNS записи
5. ✅ Создайте issue на GitHub: https://github.com/dantte-lp/pressograph/issues

---

**Статус**: ✅ Все сервисы операционные и готовы к разработке
**Последнее обновление**: 2025-11-06
**Версия документа**: 2.0
