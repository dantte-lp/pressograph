# Configuration Files Structure

Структурированное хранилище конфигурационных файлов для всех компонентов проекта.

## 📁 Структура

```
config/
├── nginx/              # Nginx конфигурации (production frontend)
├── postgres/           # PostgreSQL настройки
├── grafana/            # Grafana кастомизация
├── traefik/            # Traefik routing rules (если нужны локальные)
└── application/        # Конфигурация приложения (backend/frontend)
```

---

## 📝 Назначение директорий

### `nginx/`
**Для:** Production frontend (Nginx в контейнере)

**Содержит:**
- `nginx.conf` - основная конфигурация Nginx
- `default.conf` - site configuration для SPA
- `ssl/` - SSL сертификаты (если используются локально)
- `gzip.conf` - настройки сжатия
- `security-headers.conf` - HTTP security headers

**Используется в:** `deploy/compose/compose.prod.yaml`

---

### `postgres/`
**Для:** PostgreSQL database customization

**Содержит:**
- `postgresql.conf` - кастомные настройки БД
- `pg_hba.conf` - authentication rules
- `init-scripts/` - SQL скрипты инициализации
- `backup-scripts/` - скрипты для бэкапов
- `tuning/` - performance tuning configs

**Используется в:** Development и Production compose files

---

### `grafana/`
**Для:** Grafana customization beyond provisioning

**Содержит:**
- `grafana.ini` - кастомные настройки Grafana (уже создан в deploy/grafana/)
- `ldap.toml` - LDAP authentication config (если используется)
- `plugins/` - кастомные плагины
- `custom-css/` - UI customization

**Используется в:** `deploy/compose/compose.observability.yaml`

---

### `traefik/`
**Для:** Traefik routing rules (опционально)

**Содержит:**
- `dynamic/` - dynamic configuration files
- `static/` - static configuration
- `middlewares/` - custom middleware definitions
- `tls/` - TLS configurations

**Примечание:** В текущей setup Traefik управляется отдельно. Эта директория для локальных/override конфигов если понадобится.

---

### `application/`
**Для:** Backend и Frontend конфигурации

**Содержит:**
- `backend/` - Node.js/Express configs
  - `production.json` - production settings
  - `development.json` - development settings
  - `logging.json` - logging configuration
- `frontend/` - React/Vite configs
  - `vite.config.production.ts` - production build config
  - `proxy.config.json` - API proxy settings
- `shared/` - конфиги, используемые обоими

---

## 🔗 Интеграция с Compose

Конфигурационные файлы монтируются в контейнеры через volumes в compose files:

### Development example:
```yaml
services:
  postgres:
    volumes:
      - ../../config/postgres/postgresql.conf:/etc/postgresql/postgresql.conf:ro
      - ../../config/postgres/init-scripts:/docker-entrypoint-initdb.d:ro
```

### Production example:
```yaml
services:
  frontend:
    volumes:
      - ../../config/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../../config/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
```

---

## 📚 Примеры использования

### 1. Кастомизация PostgreSQL

```bash
# Скопировать пример
cp config/postgres/postgresql.conf.example config/postgres/postgresql.conf

# Редактировать
nano config/postgres/postgresql.conf

# Применить (пересоздать контейнер)
podman-compose -f deploy/compose/compose.dev.yaml up -d --force-recreate postgres
```

### 2. Добавить Nginx security headers

```bash
# Создать файл
nano config/nginx/security-headers.conf

# Подключить в nginx.conf
include /etc/nginx/security-headers.conf;
```

### 3. Кастомный Grafana plugin

```bash
# Скачать plugin
wget -P config/grafana/plugins/ https://...

# Монтировать в compose
volumes:
  - ../../config/grafana/plugins:/var/lib/grafana/plugins
```

---

## ⚠️ Важно

### Безопасность
- **НЕ коммитить** файлы с паролями и секретами
- Использовать `.example` суффикс для шаблонов
- Добавить реальные конфиги в `.gitignore`

### Версионирование
- Коммитить `.example` файлы как templates
- Документировать все изменения в комментариях
- Использовать semantic versioning для breaking changes

### Backup
- Регулярно делать backup критичных конфигов
- Хранить production конфиги в секретном vault
- Тестировать restore процедуры

---

## 📖 Дополнительная документация

- [Nginx Configuration](./nginx/README.md)
- [PostgreSQL Tuning](./postgres/README.md)
- [Grafana Customization](./grafana/README.md)
- [Application Configs](./application/README.md)

---

**Обновлено:** 29 октября 2025
