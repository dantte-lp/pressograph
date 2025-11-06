# Traefik Integration Guide for Pressograph

Полное руководство по интеграции Pressograph с Traefik reverse proxy для автоматического HTTPS и маршрутизации.

## Обзор

Pressograph настроен для работы с глобальным Traefik instance через **Docker Provider** для автоматического обнаружения сервисов.

### Что включено

- Автоматическое обнаружение через container labels
- HTTPS с Let's Encrypt (Cloudflare DNS challenge)
- HTTP → HTTPS редирект
- Подключение к внешней сети `traefik-public`
- Альтернативная конфигурация через File Provider

### Домены

- **Development:** `dev-pressograph.infra4.dev`
- **Production:** (настраивается отдельно)

---

## Предварительные требования

### 1. Traefik должен быть запущен

Убедитесь, что глобальный Traefik instance работает:

```bash
# Проверить статус
podman ps | grep traefik

# Если Traefik находится в /opt/projects/repositories/traefik
cd /opt/projects/repositories/traefik
podman-compose ps
```

### 2. Сеть traefik-public существует

```bash
# Проверить наличие сети
podman network ls | grep traefik-public

# Если сеть не существует, создать
podman network create traefik-public
```

### 3. DNS запись настроена

Создайте DNS A или CNAME запись для домена:

```dns
dev-pressograph.infra4.dev  IN  A     <YOUR_SERVER_IP>
# или
dev-pressograph.infra4.dev  IN  CNAME <YOUR_SERVER_HOSTNAME>
```

**Проверка:**

```bash
# Проверить DNS резолв
dig dev-pressograph.infra4.dev
nslookup dev-pressograph.infra4.dev

# Проверить доступность сервера
ping dev-pressograph.infra4.dev
```

---

## Конфигурация (Docker Provider)

### Метод 1: Через Podman Compose (Рекомендуется)

Конфигурация уже включена в `deploy/compose/compose.dev.yaml`. При запуске контейнеров через compose, Traefik автоматически обнаружит сервис.

**Запуск:**

```bash
cd /opt/projects/repositories/pressograph

# Запустить все сервисы
task dev:start
# или
podman-compose -f deploy/compose/compose.dev.yaml up -d

# Проверить контейнер подключен к сети traefik-public
podman inspect pressograph-dev-workspace | grep -A 10 Networks
```

**Labels конфигурация в compose.dev.yaml:**

```yaml
services:
  workspace:
    networks:
      - pressograph-dev
      - traefik-public    # Внешняя сеть Traefik
    
    labels:
      # Включить Traefik
      traefik.enable: "true"
      traefik.docker.network: traefik-public

      # HTTP Router (redirect to HTTPS)
      traefik.http.routers.pressograph-dev-http.rule: Host(`dev-pressograph.infra4.dev`)
      traefik.http.routers.pressograph-dev-http.entrypoints: web
      traefik.http.routers.pressograph-dev-http.middlewares: pressograph-dev-redirect

      # HTTPS Router
      traefik.http.routers.pressograph-dev.rule: Host(`dev-pressograph.infra4.dev`)
      traefik.http.routers.pressograph-dev.entrypoints: websecure
      traefik.http.routers.pressograph-dev.tls: "true"
      traefik.http.routers.pressograph-dev.tls.certresolver: cloudflare

      # Service
      traefik.http.services.pressograph-dev.loadbalancer.server.port: "3000"

      # Middleware: HTTPS redirect
      traefik.http.middlewares.pressograph-dev-redirect.redirectscheme.scheme: https
      traefik.http.middlewares.pressograph-dev-redirect.redirectscheme.permanent: "true"
```

---

## Конфигурация (File Provider)

Если Docker Provider не используется или требуется дополнительная кастомизация, используйте File Provider.

### Метод 2: File Provider (Альтернатива)

**Шаг 1: Скопировать конфигурацию**

```bash
# Убедитесь, что Traefik настроен с file provider
# В traefik.yml должно быть:
# providers:
#   file:
#     directory: /config/dynamic
#     watch: true

# Скопировать конфигурацию
cp /opt/projects/repositories/pressograph/deploy/traefik/pressograph-dev.yml \
   /opt/projects/repositories/traefik/config/dynamic/pressograph-dev.yml
```

**Шаг 2: Подключить контейнер к сети**

```bash
# Получить ID контейнера
CONTAINER_ID=$(podman ps --filter name=pressograph-dev-workspace --format "{{.ID}}")

# Подключить к traefik-public
podman network connect traefik-public $CONTAINER_ID

# Проверить
podman network inspect traefik-public | grep pressograph
```

**Шаг 3: Перезагрузить Traefik (если watch отключен)**

```bash
podman restart traefik
# или
cd /opt/projects/repositories/traefik
podman-compose restart
```

---

## Проверка работы

### 1. Проверить container labels

```bash
podman inspect pressograph-dev-workspace --format '{{json .Config.Labels}}' | python3 -m json.tool | grep traefik
```

**Ожидаемый результат:** Список всех traefik.* labels

### 2. Проверить подключение к сети

```bash
podman network inspect traefik-public
```

**Ожидаемый результат:** Контейнер `pressograph-dev-workspace` в списке

### 3. Проверить Traefik обнаружил сервис

```bash
# Через Traefik API (если доступен)
curl -s https://tr-01.infra4.dev/api/http/routers | python3 -m json.tool | grep pressograph

# Или через Traefik dashboard
# https://tr-01.infra4.dev/dashboard/
```

### 4. Проверить HTTPS доступ

```bash
# Проверить HTTP редирект
curl -I http://dev-pressograph.infra4.dev
# Должен вернуть: 301/308 redirect to https://

# Проверить HTTPS
curl -I https://dev-pressograph.infra4.dev
# Должен вернуть: 200 OK (или 502 если Next.js не запущен)

# Проверить SSL сертификат
openssl s_client -connect dev-pressograph.infra4.dev:443 -servername dev-pressograph.infra4.dev < /dev/null
```

### 5. Запустить Next.js и проверить в браузере

```bash
# Войти в контейнер
task dev:enter

# Запустить dev server
pnpm dev

# Открыть в браузере:
# https://dev-pressograph.infra4.dev
```

---

## SSL Сертификаты

### Let's Encrypt через Cloudflare DNS

Traefik автоматически запрашивает и обновляет SSL сертификаты через Let's Encrypt с Cloudflare DNS challenge.

**Требования:**

1. Домен управляется через Cloudflare
2. Traefik настроен с Cloudflare credentials:
   ```yaml
   certificatesResolvers:
     cloudflare:
       acme:
         email: admin@example.com
         storage: /letsencrypt/acme.json
         dnsChallenge:
           provider: cloudflare
   ```
3. Environment variables в Traefik:
   - `CF_API_EMAIL`
   - `CF_API_KEY` или `CF_DNS_API_TOKEN`

### Проверка генерации сертификата

```bash
# Просмотр логов Traefik для ACME
podman logs traefik 2>&1 | grep -i acme
podman logs traefik 2>&1 | grep -i certificate

# Проверить файл сертификатов (внутри контейнера Traefik)
podman exec traefik cat /letsencrypt/acme.json
```

### Troubleshooting SSL

**Проблема: Сертификат не генерируется**

1. Проверьте DNS запись доступна публично:
   ```bash
   dig @8.8.8.8 dev-pressograph.infra4.dev
   ```

2. Проверьте Cloudflare credentials в Traefik:
   ```bash
   podman exec traefik env | grep CF_
   ```

3. Проверьте rate limits Let's Encrypt (5 сертификатов на домен в неделю)

4. Используйте staging сервер для тестирования:
   ```yaml
   certificatesResolvers:
     cloudflare:
       acme:
         caServer: https://acme-staging-v02.api.letsencrypt.org/directory
   ```

---

## Troubleshooting

### 1. Traefik не видит контейнер

**Симптомы:** Контейнер запущен, но Traefik не создает роутеры

**Решения:**

```bash
# Проверить label traefik.enable=true
podman inspect pressograph-dev-workspace | grep -i "traefik.enable"

# Проверить подключение к traefik-public
podman network inspect traefik-public | grep pressograph

# Перезапустить контейнер
podman restart pressograph-dev-workspace

# Проверить логи Traefik
podman logs traefik --tail 100
```

### 2. 503 Service Unavailable

**Симптомы:** HTTPS работает, но возвращает 503

**Причины:**

1. Next.js dev server не запущен
2. Неправильный порт в labels
3. Контейнер не здоров

**Решения:**

```bash
# Проверить контейнер работает
podman ps | grep pressograph-dev-workspace

# Проверить Next.js запущен
podman logs pressograph-dev-workspace --tail 50

# Войти в контейнер и запустить
task dev:enter
pnpm dev

# Проверить порт в labels (должен быть 3000)
podman inspect pressograph-dev-workspace | grep loadbalancer.server.port
```

### 3. SSL Certificate Invalid

**Симптомы:** Браузер показывает ошибку сертификата

**Решения:**

```bash
# Проверить certResolver настроен
podman inspect pressograph-dev-workspace | grep certresolver

# Очистить старые сертификаты
podman exec traefik rm /letsencrypt/acme.json
podman restart traefik

# Подождать несколько минут для генерации нового сертификата
```

### 4. HTTP не редиректит на HTTPS

**Симптомы:** HTTP работает, но не редиректит

**Решения:**

```bash
# Проверить middleware для редиректа
podman inspect pressograph-dev-workspace | grep -i redirect

# Проверить HTTP router существует
curl -v http://dev-pressograph.infra4.dev

# Убедитесь, что entrypoint 'web' настроен в Traefik
```

### 5. DNS не резолвится

**Симптомы:** `ping dev-pressograph.infra4.dev` не работает

**Решения:**

```bash
# Проверить DNS propagation
dig @8.8.8.8 dev-pressograph.infra4.dev
dig @1.1.1.1 dev-pressograph.infra4.dev

# Очистить DNS cache локально
sudo systemd-resolve --flush-caches

# Добавить временную запись в /etc/hosts
echo "YOUR_SERVER_IP dev-pressograph.infra4.dev" | sudo tee -a /etc/hosts
```

---

## Production Configuration

Для production используйте отдельный домен и compose файл.

### Production domain

```yaml
# deploy/compose/compose.prod.yaml
services:
  workspace:
    labels:
      traefik.http.routers.pressograph-prod.rule: Host(`pressograph.com`)
      traefik.http.routers.pressograph-prod.entrypoints: websecure
      traefik.http.routers.pressograph-prod.tls.certresolver: cloudflare
```

### Security Headers

Добавьте security headers middleware для production:

```yaml
labels:
  # Security headers middleware
  traefik.http.middlewares.pressograph-security.headers.stsSeconds: "31536000"
  traefik.http.middlewares.pressograph-security.headers.stsIncludeSubdomains: "true"
  traefik.http.middlewares.pressograph-security.headers.stsPreload: "true"
  traefik.http.middlewares.pressograph-security.headers.forceSTSHeader: "true"
  traefik.http.middlewares.pressograph-security.headers.frameDeny: "true"
  traefik.http.middlewares.pressograph-security.headers.contentTypeNosniff: "true"
  traefik.http.middlewares.pressograph-security.headers.browserXssFilter: "true"
  
  # Apply middleware
  traefik.http.routers.pressograph-prod.middlewares: pressograph-security
```

---

## Advanced Configuration

### Multiple Domains

Для нескольких доменов используйте OR в правилах:

```yaml
labels:
  traefik.http.routers.pressograph-multi.rule: Host(`pressograph.com`) || Host(`www.pressograph.com`)
```

### Path-based Routing

Для маршрутизации по путям (например, отдельный API):

```yaml
labels:
  # API router (higher priority)
  traefik.http.routers.pressograph-api.rule: Host(`dev-pressograph.infra4.dev`) && PathPrefix(`/api`)
  traefik.http.routers.pressograph-api.priority: "100"
  
  # Frontend router (lower priority)
  traefik.http.routers.pressograph-fe.rule: Host(`dev-pressograph.infra4.dev`)
  traefik.http.routers.pressograph-fe.priority: "1"
```

### Rate Limiting

```yaml
labels:
  # Rate limit middleware
  traefik.http.middlewares.pressograph-ratelimit.ratelimit.average: "100"
  traefik.http.middlewares.pressograph-ratelimit.ratelimit.burst: "50"
  
  # Apply to router
  traefik.http.routers.pressograph-prod.middlewares: pressograph-ratelimit
```

### Basic Auth

Для защиты development environment:

```yaml
labels:
  # Generate password: htpasswd -nb admin password
  traefik.http.middlewares.pressograph-auth.basicauth.users: "admin:$$apr1$$H6uskkkW$$IgXLP6ewTrSuBkTrqE8wj/"
  
  # Apply to router
  traefik.http.routers.pressograph-dev.middlewares: pressograph-auth
```

---

## Мониторинг

### Traefik Dashboard

Если Traefik dashboard включен:

```
https://tr-01.infra4.dev/dashboard/
```

### Traefik API

```bash
# Список всех routers
curl -s https://tr-01.infra4.dev/api/http/routers | python3 -m json.tool

# Информация о конкретном router
curl -s https://tr-01.infra4.dev/api/http/routers/pressograph-dev@docker | python3 -m json.tool

# Список services
curl -s https://tr-01.infra4.dev/api/http/services | python3 -m json.tool
```

### Логи

```bash
# Логи Traefik
podman logs traefik -f --tail 100

# Фильтр по Pressograph
podman logs traefik 2>&1 | grep pressograph

# Access logs (если включены)
podman exec traefik cat /var/log/traefik/access.log | grep pressograph
```

---

## Дополнительные ресурсы

- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Docker Provider](https://doc.traefik.io/traefik/providers/docker/)
- [Let's Encrypt](https://doc.traefik.io/traefik/https/acme/)
- [Cloudflare DNS Challenge](https://doc.traefik.io/traefik/https/acme/#dnschallenge)
- [Middlewares](https://doc.traefik.io/traefik/middlewares/overview/)

---

## Быстрая справка

```bash
# Проверить интеграцию
podman inspect pressograph-dev-workspace | grep -A 5 traefik
podman network inspect traefik-public | grep pressograph

# Перезапустить сервисы
task dev:restart
podman restart traefik

# Просмотр логов
podman logs pressograph-dev-workspace -f
podman logs traefik -f

# Проверить HTTPS
curl -I https://dev-pressograph.infra4.dev

# Открыть в браузере
xdg-open https://dev-pressograph.infra4.dev
```

---

**Создано:** 2025-11-03  
**Агент:** podman-devops-expert  
**Проект:** Pressograph Development Environment
