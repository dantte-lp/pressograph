---
id: documentation-overview
title: Обзор документации
sidebar_label: Обзор
---

# Документация Pressograph

Добро пожаловать в официальную документацию **Pressograph** - профессиональной платформы для визуализации гидравлических испытаний.

## 🚀 Быстрый старт

**Новичок в проекте?** Начните здесь:

1. **[Quick Start Guide](getting-started/QUICK_START.md)** - Запустите проект за 5 минут
2. **[Development Guide](DEVELOPMENT.md)** - Полное руководство по разработке
3. **[INDEX.md](INDEX.md)** - Полный индекс всей документации

## 📚 Структура документации

### 🎓 Onboarding
Документация для начала работы с проектом.

- **[Для разработчиков](onboarding/human/README.md)** - Человеческие разработчики
  - [Installation Guide](onboarding/human/installation.md)
  - [Contributing Guide](onboarding/human/CONTRIBUTING.md)
  - [Security Policy](onboarding/human/SECURITY.md)

- **[Для AI агентов](onboarding/ai-agent/README.md)** - AI-assisted development
  - [AI Agent Onboarding](onboarding/ai-agent/AI_AGENT_ONBOARDING.md)
  - [AI Quick Start](onboarding/ai-agent/AI_AGENT_QUICK_START.md)

### 💻 Development
Документация для разработчиков.

- **[Architecture](development/architecture/README.md)** - Архитектурные решения
  - [Current Stack](development/architecture/CURRENT_STACK.md)
  - [Next.js Migration Plan](development/architecture/NEXT_JS_MIGRATION_PLAN.md)
  - [Tech Stack Recommendations](development/architecture/TECH_STACK_RECOMMENDATIONS.md)

- **[Containerization](development/containerization/README.md)** - Docker/Podman
  - [Start Here](development/containerization/START_HERE.md)
  - [Migration Guide](development/containerization/MIGRATION_GUIDE.md)
  - [Cheatsheet](development/containerization/CHEATSHEET.md)

- **[Deployment](development/deployment/README.md)** - Развёртывание
  - [Deployment Guide](development/deployment/DEPLOYMENT.md)
  - [Manual Deployment (RU)](development/deployment/MANUAL_DEPLOYMENT_RU.md)

- **[Grafana/Observability](development/grafana/README.md)** - Мониторинг
  - [Quick Start](development/grafana/QUICKSTART.md)

### 🔌 API
Документация API.

- **[API Design](api/API_DESIGN.md)** - Полная спецификация API (910 строк)
- **[Server API](api/SERVER_API.md)** - Server-side API
- **[API Overview](api/overview.md)** - Краткий обзор

### 📦 Releases
История релизов и спринтов.

- **[Release Notes](releases/release-notes.md)** - Consolidated notes
- **Версии**: [v1.0.0](releases/v1.0.0.md), [v1.0.1](releases/v1.0.1.md), [v1.0.2](releases/v1.0.2.md), [v1.1.0](releases/v1.1.0-2025-10-29.md)
- **Спринты**: Sprint 2, 5, 6, 7 (см. [releases/](releases/))

### 📊 Reports
Аналитические отчёты и аудиты.

- **Analysis**: [Documentation](reports/DOCUMENTATION_ANALYSIS.md), [Infrastructure](reports/INFRASTRUCTURE_ANALYSIS.md), [Performance](reports/PERFORMANCE_ANALYSIS.md)
- **Audits**: [Documentation Audit](reports/DOCUMENTATION_AUDIT_2025-11-01.md), [Dependency Audit](reports/DEPENDENCY_AUDIT_2025-10-31.md), [I18N Audit](reports/I18N_AUDIT.md)
- **Sessions**: [Refactoring](reports/REFACTORING_SESSION_2025-10-31.md), [Migration](reports/MIGRATION_SESSION_REPORT_2025-11-03.md)
- **Handoffs**: [Frontend](reports/HANDOFF_REPORT_FRONTEND.md), [Infrastructure](reports/HANDOFF_REPORT_INFRASTRUCTURE.md)

### 🏃 Scrum
Scrum процесс и методология.

- **[Scrum Implementation Report](scrum/SCRUM_IMPLEMENTATION_REPORT.md)** - Полное описание Scrum setup

### 🏗️ Infrastructure
Инфраструктура и observability.

- **[Observability Guide](infrastructure/OBSERVABILITY.md)** - Полное руководство (200+ строк)
- **[Traefik Integration](infrastructure/TRAEFIK_INTEGRATION.md)** - Reverse proxy
- **[Observability Roadmap](infrastructure/OBSERVABILITY_ENHANCEMENT_ROADMAP.md)** - Future plans

### 📂 Other Categories

- **[Examples](examples/README.md)** - Примеры кода и конфигураций
- **[Setup Status](setup/)** - Статусы настройки окружения
- **[Project Management](project-management/)** - Аудиты и спецификации проекта
- **[Archived](archived/)** - Исторические документы

---

## 🎯 По задачам

### Хочу начать разработку
1. [Quick Start Guide](getting-started/QUICK_START.md) - Быстрый старт (5 минут)
2. [Development Guide](DEVELOPMENT.md) - Детальное руководство
3. [Contributing Guide](onboarding/human/CONTRIBUTING.md) - Правила contribution

### Хочу понять архитектуру
1. [Current Stack](development/architecture/CURRENT_STACK.md) - Текущий стек
2. [Architecture Decisions](../sprints/sprint-01/ARCHITECTURE_DECISIONS.md) - Решения (68KB)
3. [Technical Manifesto](development/architecture/Technical%20Upgrade%20Manifesto_%20Pressure%20Test%20Graph%20Generation%20System.docx.md)

### Хочу развернуть проект
1. [Deployment Guide](development/deployment/DEPLOYMENT.md) - Production deployment
2. [Manual Deployment (RU)](development/deployment/MANUAL_DEPLOYMENT_RU.md) - Ручная установка
3. [Quick Start Observability](infrastructure/QUICK_START_OBSERVABILITY.md) - Мониторинг

### Хочу работать с API
1. [API Design](api/API_DESIGN.md) - Полная спецификация
2. [Server API](api/SERVER_API.md) - Server endpoints
3. [API Overview](api/overview.md) - Краткий обзор

### Хочу посмотреть примеры
1. [Examples Directory](examples/README.md) - Все примеры
2. [AI Agent Example](examples/AI_AGENT_ONBOARDING_EXAMPLE.md)
3. [First Issue Example](examples/FIRST_ISSUE_FOR_AI_AGENT.md)

---

## 📊 Технологический стек

### Frontend
- **Framework**: React 19.2.0 + Next.js 15.5.6
- **Language**: TypeScript 5.9.3 (strict mode)
- **Styling**: TailwindCSS 4.1.16
- **UI Library**: Radix UI primitives
- **State**: Zustand 5.0.8 + Immer
- **Data Fetching**: TanStack Query 5.90.6
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts 3.3.0

### Backend
- **Runtime**: Node.js 24 LTS
- **Framework**: Next.js 15.5.6 (App Router)
- **Database**: PostgreSQL 18.0
- **ORM**: Drizzle ORM 0.44.7
- **Cache**: Valkey 9 (Redis-compatible)
- **Auth**: NextAuth v4.24.13

### Infrastructure
- **Container**: Podman / Docker compatible
- **Orchestration**: podman-compose
- **Reverse Proxy**: Traefik 3.x
- **Observability**: VictoriaMetrics, VictoriaLogs, VictoriaTraces
- **Monitoring**: Grafana 11.x
- **Telemetry**: OpenTelemetry

### Development
- **Package Manager**: pnpm 9.x
- **Linting**: ESLint 9 (flat config)
- **Formatting**: Prettier 3.x
- **Testing**: Vitest + Testing Library
- **Task Runner**: Task (go-task)

---

## 🔗 Полезные ссылки

### Project
- **GitHub**: https://github.com/dantte-lp/pressograph
- **Issues**: https://github.com/dantte-lp/pressograph/issues
- **Milestones**: https://github.com/dantte-lp/pressograph/milestones

### Environments
- **Production**: https://pressograph.infra4.dev
- **Development**: https://dev-pressograph.infra4.dev
- **Drizzle Studio**: https://dbdev-pressograph.infra4.dev
- **Grafana**: https://dev-grafana.infra4.dev

### Documentation
- **Full Index**: [INDEX.md](INDEX.md)
- **Quick Start**: [Quick Start Guide](getting-started/QUICK_START.md)
- **Development**: [Development Guide](DEVELOPMENT.md)

---

## 📈 Статистика проекта

### Development
- **Total Documents**: 100+
- **Lines of Documentation**: 50,000+
- **Code Coverage**: В разработке (цель: 60%)
- **Active Sprints**: 2

### GitHub
- **Total Issues**: 58
- **Open Issues**: 22
- **Closed Issues**: 36
- **Milestones**: 17 active
- **Contributors**: 2

### Releases
- **Latest Stable**: v1.1.0
- **In Development**: v2.0.0-alpha (Next.js migration)
- **Sprint**: Sprint 1 (Foundation Setup)

---

## 🛠️ Команды разработки

### Setup
```bash
task secrets:generate              # Генерация секретов
task dev:start                     # Запуск окружения
task dev:enter                     # Вход в контейнер
```

### Development
```bash
pnpm install                       # Установка зависимостей
pnpm dev                           # Dev сервер
pnpm build                         # Production сборка
pnpm lint                          # Линтинг
pnpm type-check                    # TypeScript проверка
pnpm test                          # Тесты
```

### Database
```bash
pnpm db:push                       # Применить схему
pnpm db:studio                     # Drizzle Studio
pnpm db:generate                   # Генерация миграций
```

### Observability
```bash
task metrics:start                 # Запуск мониторинга
task grafana:open                  # Открыть Grafana
task metrics:logs                  # Логи
```

---

## 📝 Соглашения о документации

### Формат
- Markdown с frontmatter (где применимо)
- Четкая иерархия заголовков
- Code blocks с указанием языка
- Ссылки на связанные документы
- Дата последнего обновления

### Структура файлов
- `README.md` - Обзор категории
- `UPPERCASE.md` - Важные самостоятельные документы
- `lowercase-with-dashes.md` - Обычные документы

### Категории
- **getting-started/** - Руководства быстрого старта
- **onboarding/** - Onboarding (human/ai-agent)
- **development/** - Разработка и архитектура
- **api/** - API документация
- **examples/** - Примеры кода
- **releases/** - Release notes и sprint docs
- **reports/** - Отчёты и аудиты
- **scrum/** - Scrum процесс
- **infrastructure/** - Инфраструктура
- **setup/** - Статусы setup
- **project-management/** - Управление проектом
- **archived/** - Архивные документы

---

## 🤝 Contributing

Хотите улучшить документацию?

1. Прочитайте [Contributing Guide](onboarding/human/CONTRIBUTING.md)
2. Следуйте соглашениям о документации
3. Обновляйте [INDEX.md](INDEX.md) при добавлении новых файлов
4. Создайте pull request

---

## 📞 Поддержка

### Вопросы?
1. Проверьте [INDEX.md](INDEX.md) - полный индекс документации
2. Посмотрите [Quick Start Guide](getting-started/QUICK_START.md)
3. Поищите в [GitHub Issues](https://github.com/dantte-lp/pressograph/issues)
4. Создайте новый issue

### Проблемы?
1. Проверьте [Troubleshooting](getting-started/QUICK_START.md#решение-проблем) в Quick Start
2. Просмотрите логи: `task dev:logs`
3. Проверьте статус: `task ps`
4. Создайте issue с подробным описанием

---

## 🎯 Roadmap

### v2.0.0 (In Progress)
- ✅ Next.js 15.5.6 migration
- ✅ Drizzle ORM integration
- ✅ OpenTelemetry observability
- ⏳ NextAuth v4 full integration
- ⏳ Theme Provider с server-side
- ⏳ Complete UI component library

### v2.1.0 (Planned)
- Public share links
- Real-time collaboration
- Advanced analytics
- Mobile app

См. [GitHub Milestones](https://github.com/dantte-lp/pressograph/milestones) для деталей.

---

**Статус документации**: ✅ Активно поддерживается
**Последнее обновление**: 2025-11-06
**Версия документа**: 2.0

**Совет**: Добавьте эту страницу в закладки и используйте [INDEX.md](INDEX.md) для быстрой навигации!
