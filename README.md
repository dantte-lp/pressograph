# Pressure Test Visualizer

Современный веб-генератор графиков испытаний давления с поддержкой экспорта в PNG/PDF и темной темы.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![React](https://img.shields.io/badge/React-19.0-61dafb)
![Vite](https://img.shields.io/badge/Vite-6.0-646cff)

## Особенности

- ⚡ **Современный стек**: React 19, TypeScript 5.7, Vite 6, Tailwind CSS 3.4
- 🎨 **Темная/светлая тема** с сохранением настроек
- 📊 **Canvas-based графики** с высоким разрешением
- 📤 **Экспорт**: PNG (4K), PDF (A4 альбомная), JSON (настройки)
- 🔄 **Hot reload** в режиме разработки
- 🐳 **Контейнеризация**: Podman/Docker с multi-stage build
- 📱 **Responsive design** для мобильных устройств
- 💾 **Persistent storage** настроек в localStorage
- 🎯 **TypeScript** строгая типизация
- 🧩 **Модульная архитектура** с переиспользуемыми компонентами

## Технологический стек

### Frontend
- **React 19** - UI библиотека
- **TypeScript 5.7** - статическая типизация
- **Vite 6** - сборщик и dev-сервер
- **Tailwind CSS 3.4** - utility-first CSS framework
- **Zustand 5** - управление состоянием
- **jsPDF 2.5** - генерация PDF
- **date-fns 4.1** - работа с датами

### Инфраструктура
- **Podman/Docker** - контейнеризация
- **Nginx 1.29 (Trixie)** - production веб-сервер
- **Node.js (current-trixie-slim)** - runtime для сборки

## Быстрый старт

### Требования
- Podman или Docker
- Podman Compose или Docker Compose

### Разработка

```bash
# Запуск dev-сервера с hot reload
make dev

# Доступен по адресу: http://localhost:5173
```

### Production

```bash
# Сборка production образа
make build

# Запуск production сервера
make prod

# Доступен по адресу: http://localhost:8080
```

### Все команды Makefile

```bash
make help              # Показать все команды
make dev               # Запустить dev-сервер
make dev-build         # Пересобрать и запустить dev
make dev-down          # Остановить dev-сервер
make build             # Собрать production образ
make prod              # Запустить production
make prod-down         # Остановить production
make logs              # Показать логи (ENV=dev|prod)
make clean             # Удалить контейнеры и образы
make stop              # Остановить все контейнеры
make install           # Установить зависимости локально
make lint              # Запустить ESLint
make test              # Запустить тесты
make status            # Показать статус контейнеров
make info              # Системная информация
make rebuild           # Полная пересборка
make restart-dev       # Перезапустить dev
make restart-prod      # Перезапустить prod
```

## Структура проекта

```
pressure-test-visualizer/
├── deploy/
│   ├── compose/
│   │   ├── docker-compose.dev.yml    # Development конфигурация
│   │   └── docker-compose.prod.yml   # Production конфигурация
│   ├── Containerfile                 # Multi-stage build
│   └── nginx.conf                    # Nginx конфигурация
├── src/
│   ├── components/
│   │   ├── ui/                       # UI компоненты (Button, Input, Select)
│   │   ├── forms/                    # Формы (параметры, опрессовки)
│   │   └── graph/                    # График и экспорт
│   ├── store/
│   │   ├── useTestStore.ts           # Zustand store для настроек
│   │   └── useThemeStore.ts          # Zustand store для темы
│   ├── types/
│   │   └── index.ts                  # TypeScript типы
│   ├── utils/
│   │   ├── helpers.ts                # Вспомогательные функции
│   │   ├── graphGenerator.ts         # Генерация данных графика
│   │   ├── canvasRenderer.ts         # Рендеринг на Canvas
│   │   └── export.ts                 # Экспорт PNG/PDF/JSON
│   ├── App.tsx                       # Главный компонент
│   ├── main.tsx                      # Точка входа
│   └── index.css                     # Глобальные стили
├── public/                           # Статические файлы
├── index.html                        # HTML шаблон
├── package.json                      # Зависимости
├── vite.config.ts                    # Vite конфигурация
├── tailwind.config.js                # Tailwind конфигурация
├── tsconfig.json                     # TypeScript конфигурация
├── Makefile                          # Команды управления
└── README.md                         # Документация
```

## Архитектура

### Управление состоянием (Zustand)

Приложение использует два store:

1. **useTestStore** - настройки испытаний
   - Параметры теста (давление, температура, даты)
   - Промежуточные опрессовки
   - Шаблоны и пресеты
   - Импорт/экспорт настроек

2. **useThemeStore** - тема оформления
   - Переключение dark/light
   - Сохранение в localStorage

### Генерация графика

1. **graphGenerator.ts** - создание точек данных с:
   - Подъемами давления (30 сек)
   - Удержанием с флуктуациями
   - Сбросами давления
   - Промежуточными опрессовками

2. **canvasRenderer.ts** - рендеринг на Canvas:
   - Оси и сетка
   - График с заливкой
   - Информационная панель
   - Адаптация под тему

### Экспорт

- **PNG**: Canvas → Blob → Download (4x разрешение)
- **PDF**: Canvas → jsPDF → Download (A4 landscape)
- **JSON**: Settings → JSON → Download

## Docker образы

### Development
```yaml
image: node:current-trixie-slim
```
- Hot reload с Vite
- Volume mapping для кода
- Port 5173

### Production
```dockerfile
# Build stage
FROM node:current-trixie-slim AS builder
# ... сборка приложения

# Runtime stage
FROM nginx:1.29-trixie-perl
# ... копирование dist
```
- Multi-stage оптимизированная сборка
- Nginx для статики
- Port 8080
- Health checks

## Функционал

### Параметры испытания
- Номер испытания
- Дата и время начала/окончания
- Продолжительность испытания
- Рабочее и максимальное давление
- Температура среды
- Продолжительность опрессовки

### Промежуточные опрессовки
- Добавление/удаление опрессовок
- Время (часы от начала)
- Длительность (минуты)
- Быстрые пресеты: 6ч, 8ч, 12ч, 24ч

### Шаблоны
- **Стандартный** (15.33ч, 3 проверки)
- **Суточный** (24ч, 5 проверок)
- **Расширенный** (48ч, 7 проверок)
- Сброс к дефолтным значениям

### Экспорт/Импорт
- Экспорт графика в PNG (высокое разрешение)
- Экспорт графика в PDF (A4 альбомная)
- Экспорт настроек в JSON
- Импорт настроек из JSON

### Темизация
- Светлая тема
- Темная тема
- Сохранение выбора
- Адаптация графика под тему

## Разработка

### Локальная установка (без контейнеров)

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка
npm run build

# Preview production build
npm run preview

# Линтинг
npm run lint
```

### Добавление новых компонентов

1. Создайте компонент в `src/components/`
2. Определите типы в `src/types/`
3. Экспортируйте через `index.ts`
4. Используйте Tailwind CSS для стилей
5. Следуйте существующим паттернам

### Работа с Canvas

Рендеринг использует Canvas API с:
- High DPI поддержкой (масштабирование)
- Адаптивными цветами (тема)
- Оптимизированной перерисовкой

## Production Deployment

### С использованием Podman/Docker

```bash
# 1. Сборка образа
make build

# 2. Запуск контейнера
make prod

# 3. Проверка
curl http://localhost:8080/health
```

### С использованием systemd (Quadlet)

Создайте файл `/etc/containers/systemd/pressure-test-visualizer.container`:

```ini
[Container]
Image=pressure-test-visualizer:latest
ContainerName=pressure-test-visualizer
PublishPort=8080:80
Network=bridge

[Service]
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start pressure-test-visualizer
sudo systemctl enable pressure-test-visualizer
```

## Конфигурация

### Vite
Настройки в `vite.config.ts`:
- Server host: 0.0.0.0 (для Docker)
- Port: 5173
- Hot reload с polling

### Nginx
Конфигурация в `deploy/nginx.conf`:
- Gzip сжатие
- Кеширование статики
- Security headers
- Health check endpoint

### Tailwind CSS
Конфигурация в `tailwind.config.js`:
- Dark mode: class
- Content: HTML и TSX файлы

## Лицензия

MIT

## Автор

Refactored from single HTML file to modern React + TypeScript application

---

**Сделано с ❤️ используя React, TypeScript, и Podman**
