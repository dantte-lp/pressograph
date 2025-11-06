# Техническое задание: Pressograph 2.0 (монолит на Next.js)

**Дата:** 2025-11-04  
**Ответственный за подготовку:** внутренний аудит и архитектурная группа (на основе отчёта Senior Fullstack TS + документации `docs/development/architecture`)  
**Источники:** текущий репозиторий `/opt/projects/repositories/pressograph`, архив Vite-проекта `/opt/backup/pressograph-20251103-051742`, документы архитектуры (`CURRENT_STACK.md`, `REFACTORING_PLAN.md`, `NEXT_JS_MIGRATION_PLAN.md`, `Pressograph Next.js Migration & UI_UX Overhaul Plan.docx.md`, `Technical Upgrade Manifesto...`) и GitHub (issues/milestones/commits).

---

## 1. Контекст и цели

Pressograph — платформа для визуализации результатов гидравлических испытаний и обмена отчётами. Ветка v1.2.0 (React + Vite + Express) признана устаревшей; принято решение переписать продукт в виде **монолита на Next.js 15.x/16** (App Router, server components, API routes, server actions) с сохранением функционала и усилением UX/DevOps дисциплины.

### Цели 2025–2026
- Сконцентрировать фронтенд и бекенд в едином Next.js-приложении без отдельного Express-сервера.
- Обеспечить guided workflow (4 шага) для настройки тестов с поддержкой многошаговых сценариев.
- Сохранить мощные возможности экспорта (PNG, PDF) и публичные share-ссылки.
- Восстановить и улучшить аутентификацию (NextAuth + Drizzle + Valkey) с ролями и доступами.
- Покрыть код тестами (≥70% критических модулей), настроить CI/CD и observability (OpenTelemetry → Uptrace/VictoriaMetrics).
- Поддержать двуязычность (ru/en) и WCAG 2.1 AA.

### Ключевые KPI
| Направление | Целевое значение |
|-------------|------------------|
| Время первичной загрузки (TTFB SSR страниц) | < 600 мс (внутренний дев, без CDN) |
| Время от открытия до отображения графика | < 3.5 с при тесте 24 ч/70 МПа |
| Уровень покрытия тестами (unit + integration) | ≥ 60% к горизонту Stage 2, ≥ 80% к Stage 4 |
| Успешные e2e сценарии (CI) | 100% критических потоков |
| Accessibility score (Lighthouse) | ≥ 90 в светлой/тёмной теме |
| Время реакции на инцидент (алерты OTEL) | < 15 минут (в пределах Day-2)|

---

## 2. Область охвата

### Функциональная
1. **Аутентификация и управление доступами**: OAuth (GitHub, Google), Credentials (с bcrypt), роли `admin|user|viewer`, двухфакторная авторизация (двухфакторка опционально Stage 4), управление API-ключами.
2. **Организации и проекты**: CRUD для `organizations`, `projects`, назначение владельцев, настройки брендинга, тарифы.
3. **Pressure Tests**: создание/редактирование тестов, шаблоны, промежуточные этапы, статусы `draft|scheduled|running|completed`, публичные share-токены.
4. **Test Runs**: запуск испытаний, агрегация результатов, журналирование, сравнение запусков.
5. **Файлы и экспорт**: генерация PNG/PDF, история загрузок, хранение шаблонов, скачивание отчётов.
6. **Уведомления и журнал**: in-app/почтовые уведомления, audit logs, webhooks (план Stage 4+).
7. **Админ-панель**: управление пользователями, ролями, лимитами, настройками системы.

### Нефункциональная
- Монолит Next.js (Node runtime) с server actions, оптимизированный Turbopack (когда стабилен) или webpack fallback.
- Поддержка PostgreSQL 18 + Drizzle ORM (строгие схемы, миграции в `drizzle/`).
- Valkey (Redis) для сессий, кеша предпочтений, rate limiting.
- Поддержка локализации через `next-intl` (ru/en), сохранение выбора через cookie + user preferences.
- Tailwind CSS 4.1 + shadcn (или кастомный набор компонентов) + Radix primitives.
- Обязательные проверки: `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm db:check` в CI.
- Full Dev Container/Podman окружение, Taskfile как единый интерфейс команд (`task dev`, `task db:migrate`, `task test` и т.д.).
- Observability: OpenTelemetry SDK + Uptrace (трейсы), VictoriaMetrics (метрики), структурированные логи и health-check.

---

## 3. Целевая архитектура

### 3.1 Логическая структура
```
Next.js App Router (монолит)
├─ app/ (server components, layouts, routing)
│  ├─ (public) pages: /login, /share/[token], /api/*
│  ├─ (auth) protected areas: /dashboard, /projects/[id], /tests/[id]
│  └─ layout.tsx + global providers (theme, query, auth)
├─ server actions: обработка бизнес-операций (создание тестов, экспорт)
├─ API routes / route handlers: webhooks, интеграции, health, background tasks
├─ lib/
│  ├─ db/ (Drizzle schemas, migrations, repo-слой)
│  ├─ auth/ (NextAuth, RBAC, middleware)
│  ├─ cache/ (Valkey)
│  ├─ observability/ (otel, metrics)
│  ├─ services/ (доменные use-cases, бизнес-логика)
│  └─ utils/
└─ components/
   ├─ ui/ (базовые атомы shadcn, shared styles)
   ├─ layout/ (header, sidebar, breadcrumbs)
   ├─ features/
       ├─ tests/ (forms, wizards, graph rendering)
       ├─ exports/ (pdf/png flows)
       ├─ admin/
       └─ notifications/
```

### 3.2 Ключевые модули
- **Auth слой**: NextAuth v5 c `@auth/drizzle-adapter`, JWT strategy, session store в Valkey, middleware `middleware.ts` для защиты маршрутов, RBAC проверки через server actions.
- **Data access**: Drizzle ORM, строгие типы, репозитории для доменных сущностей (`users`, `organizations`, `projects`, `pressure_tests`, `test_runs`, `audit_logs`, `api_keys`, `file_uploads`, `user_preferences`, `notifications`).
- **State & data fetching**: React Query (client-side), SSR/SSG для публичных страниц, server actions + `revalidateTag`/`cache` для данных dashboard.
- **Theme & дизайн система**: Tailwind design tokens (`@theme inline`), ThemeProvider с cookie (`theme=`) + user preference sync, поддержка темных/светлых схем и high-contrast режима (Stage 3).
- **Workflow Engine**: 4-ступенчатый мастер создания теста (server actions + client wizard), сохранение черновиков, валидация через Zod.
- **Graph Rendering**: Recharts (быстрый старт) + custom Canvas/WebGL слой для высокоточной линии. Серверные расчёты выполняются server action -> сериализация данных -> client canvas component.
- **Export Engine**: jsPDF + jsPDF-autotable, канвас -> blob (PNG). Серверная генерация PDF (Node) для стабильности, with fallback client-side.
- **Observability**: `instrumentation.ts` и `otel.ts` инициализируют OTEL в prod/dev, экспортеры в Uptrace, metrics в VictoriaMetrics (через OTLP HTTP), логирование на stdout structured JSON.
- **Notifications**: Заложить сервис для in-app (таблица `notifications`), почтовые оповещения через будущий SMTP провайдер (Stage 4).

### 3.3 Интеграция с окружением
- Контейнеры: Podman Compose (workspace, db, cache, traefik, victoria, uptrace). Скрипты автоматизации в `deploy/scripts` и `Taskfile.yml`.
- Secrets: `.env.local` (dev), `.env.prod` (prod), использование Doppler/Vault на перспективу.
- CI/CD: GitHub Actions (build, lint, test, db:check), артефакты: Docker image (Node.js 24), `pnpm install --frozen-lockfile`.

---

## 4. Глобальные требования

### 4.1 Функциональные детали
1. **Аутентификация**
   - Провайдеры: GitHub, Google, Credentials (bcrypt hash из Drizzle), (Stage 3) SSO через SAML/OpenID — в backlog.
   - Роли и разрешения: `admin` (полный доступ), `manager` (организация, проекты, тесты), `operator` (создание/запуск тестов), `viewer` (просмотр/экспорт). Настройки в `user_roles` (расширить схему).
   - Обязательные страницы: `/login`, `/logout`, `/auth/error`, `/onboarding` (первичная настройка профиля, выбор организации).

2. **Организации/проекты**
   - CRUD + настройки бренда (цвета, логотип), тарифный план, лимиты по количеству тестов/экспортов.
   - Передача проектов между организациями запрещена (нужна дублирующая копия).

3. **Pressure Tests Workflow**
   - **Step 1:** выбор шаблона (daily, extended, custom), предзаполнение параметров.
   - **Step 2:** ввод базовых параметров (давление, длительность, температурные допуски).
   - **Step 3:** настройка промежуточных этапов (опционально), добавление точек, пауз, замечаний.
   - **Step 4:** предпросмотр графика, автоматическая проверка (валидаторы: превышение лимитов, пересечения координат), запуск экспорта.
   - Возможность сохранения черновика на любом шаге, автосохранение каждые 30 с.
   - Тесты поддерживают статусы и историю изменений (audit trail).

4. **Graph & Export**
   - Рендер графика (Canvas/WebGL) с поддержкой тем, повышенная читаемость (инженерная сетка, подсветка ключевых точек, возможность аннотаций).
   - Экспорт PNG (4096x2160 max), PDF (A3/A4, тёмная/светлая тема). Экспорт должен учитывать локализацию и логотип организации.
   - Настройка Watermark (Stage 4).

5. **История и аудит**
   - `/history`: список тестов и запусков, фильтры по проекту/статусу/дате, экспорт CSV.
   - `audit_logs`: фиксировать ключевые действия (создание теста, изменение параметров, экспорт, изменение ролей).
   - Отдельный `/admin/audit` для администраторов.

6. **Уведомления**
   - In-app: список уведомлений на панели, отметка «прочитано».
   - Email: опциональные уведомления об окончании теста, экспорте, перевышении лимитов.
   - Webhooks (Stage 4+): отправка событий внешним системам.

7. **Публичные ссылки**
   - `/share/[token]`: SSR страница с временной ссылкой, настройки срока действия, ограничение просмотров, отключение загрузки.
   - Аудит: логировать все обращения по публичной ссылке.

### 4.2 Нефункциональные требования
- **Performance**: bundle split, использование `app/` server components, `Suspense` + `Stream`. Меньше 250 КБ initial JS (Stage 3), lazy-load тяжелых модулей.
- **Security**: CSP, HTTPS (Traefik), rate limit на `/api`, защита от SSRF (валидировать внешние URL), защита от DOS через Valkey лимиты, регулярные обновления зависимостей.
- **Accessibility**: WCAG 2.1 AA, фокус-стили, ARIA-атрибуты, контраст 4.5:1, полноценная клавиатурная навигация.
- **Localization**: `next-intl`, храним переводные ключи в JSON, покрытие 100% UI, fallback английский.
- **Testing**: Vitest + Testing Library (unit), Playwright (e2e), contract tests для server actions, smoke для экспортов. Интеграция с CI.
- **Observability**: health-check `/api/health`, OTEL traces (запросы, actions, БД), метрики (latency, error rate), логирование (pino/winston JSON).
- **Dev Experience**: lint + format + type-check pre-commit (lint-staged), Taskfile команды, devcontainer, обзор в docs/DEVELOPMENT.md.

---

## 5. Этапы реализации

| Stage | Срок (ориентир) | Цель | Ключевые результаты |
|-------|-----------------|------|---------------------|
| **Stage 0: Stabilization** | до 2025-11-10 | Очистка и синхронизация | Удалены артефакты (`.next`, `node_modules`), локальный код синхронизирован с GitHub, CI базово запускает lint/type-check/test, миграции приведены в актуальный вид |
| **Stage 1: Platform** | 2025-11-17 | Базовый монолит | NextAuth на Drizzle, Query/Theme провайдеры в `layout`, рабочие server actions для CRUD пользователя, импорт реальных данных из старого бэкапа |
| **Stage 2: Core Workflow** | 2025-12-15 | 4-шаговый мастер и граф | Реализован мастер, расчёт графа, экспорт PNG/PDF, история тестов, покрытие тестами ≥60% |
| **Stage 3: Experience & Accessibility** | 2026-01-30 | UX/Accessibility/Perf | Черновой UI заменён на промышленный дизайн (shadcn), WCAG ≥90, bundle контролируется, тема сохраняется в preferences, локализация полная |
| **Stage 4: Observability & Operations** | 2026-03-15 | Observability, уведомления, webhooks | OTEL включён, Uptrace/Victoria стеки рабочие, email-уведомления, начальная аналитика, CI/CD поток деплоя |
| **Stage 5: Advanced** | Q2 2026 | Расширения | RBAC расширенный, webhooks, share-flow, mobile оптимизации, подготовка к коммерческому релизу |

Каждый Stage завершается демо, ретроспективой, обновлением документации и ревизией бэклога GitHub (issues/milestones).

---

## 6. План миграции данных
- Использовать бэкап `/opt/backup/pressograph-20251103-051742` как эталон схемы и данных.
- Шаги:
  1. Генерировать Drizzle миграции из актуальных схем (`pnpm db:generate`), проверить соответствие старым таблицам.
  2. Настроить скрипт миграции данных (Node script) для копирования `users`, `organizations`, `projects`, `pressure_tests`, `test_runs`, `audit_logs` из старой базы (через CSV/pg_dump) в новую схему (в dev окружении).
  3. Верифицировать целостность: count*, выборочные проверки, чексуммы.
  4. Обновить документацию по миграциям (`docs/development/database.md`).
  5. Обеспечить откат (`pnpm db:drop`, `pnpm db:migrate` + restore).

---

## 7. Управление качеством
- **Документация:** обновлять `docs/DEVELOPMENT.md`, `NEXT_STEPS.md`, вести changelog.
- **Код-ревью:** 2 approve от core-команды, обязательный линт и тесты.
- **Тестирование:** Smoke-тесты после каждого Stage, нагрузочные тесты для экспортов и графов (Stage 3).
- **Мониторинг:** health-check + synthetic тесты (Stage 4).
- **Обратная связь:** проводить UX-тесты с инженерами, фиксировать инсайты.

---

## 8. Риски и их нивелирование
| Риск | Вероятность | Влияние | Митиграция |
|------|-------------|---------|------------|
| Turbopack нестабилен | средняя | высокая | придерживаться Next.js 15.5.6 + webpack до стабилизации Turbopack; включать Turbopack только в Stage 3 |
| Несогласованность с GitHub-историей | высокая | средняя | синхронизировать локальную ветку с основным репо, фиксировать «истину» в `main`, обновлять issues |
| Сложность миграции NextAuth | средняя | высокая | приоритизировать Stage 1, покрыть auth тестами, использовать официальные примеры `@auth/drizzle-adapter` |
| Перегрузка команды объёмом задач | средняя | высокая | дробить Epic'и на небольшие issue (≤5 SP), проводить планирования каждые 2 недели |
| UX-требования конфликтуют с техническими ограничениями | низкая | средняя | ранние прототипы, согласование с UX, включение пользовательских тестов |
| Observability отложена | средняя | средняя | внедрять instrumentation в Stage 1 (флаги), полностью активировать в Stage 4 |

---

## 9. Требуемые артефакты
- `docs/TECHNICAL_SPEC_MONOLITH.md` (данный документ) — актуализировать по итогам каждого Stage.
- Обновлённый `NEXT_STEPS.md` и дорожная карта (GitHub Milestones синхронизированы с Stage).
- Типовые схемы последовательности (sequence diagrams) для ключевых потоков (auth, creation, export) — добавить в `docs/development/architecture/diagrams/`.
- Тест-план и отчёты (QA) — `docs/testing/`.

---

## 10. Критерии приёмки релиза Pressograph 2.0
1. Все Stage 1–4 выполнены, issues закрыты, документация обновлена.
2. Аутентификация, создание теста, экспорт, история, уведомления работают в dev/staging без критических дефектов.
3. CI/CD гоняет линт/типы/тесты/миграции, сборка контейнера, деплой на staging.
4. OTEL метрики и трейсы доступны, алерты настроены.
5. Пользовательские тесты (ru/en) подтверждают UX (≥80% задач успешно выполнено респондентами).
6. Руководство (Product/Engineering) подписывает акт приёмки.

---

**Примечание:** Все изменения по сравнению с историческим кодом обязаны сохранять доменную корректность (формулы расчёта давления, правила шаблонов). При сомнениях обращаться к архиву `/opt/backup/pressograph-20251103-051742` и техническим специалистам по гидравлическим испытаниям.
