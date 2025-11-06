# HOTFIX: Internal Server Error - 2025-11-06

## Проблема

**Дата:** 2025-11-06 22:00 UTC
**Severity:** Critical (P0)
**Статус:** ✅ Resolved
**URL:** https://dev-pressograph.infra4.dev
**Commit:** e2059cd9

---

## Описание

Сайт `dev-pressograph.infra4.dev` возвращал **HTTP 500 Internal Server Error** при любых запросах.

### Симптомы

1. Внешний URL возвращал 500 ошибку
2. Внутренний доступ (localhost:3000) также возвращал 500
3. PM2 процесс `nextjs-dev` находился в crash loop
4. Next.js сервер постоянно перезапускался
5. Пользователи не могли получить доступ к приложению

---

## Root Cause Analysis

### Основные причины

1. **Permission Issues (файловая система)**
   - Каталог `/workspace/docs/authentication` имел права `drwx------` (владелец: root)
   - Каталог `/workspace/docs/decisions` имел права `drwx------` (владелец: root)
   - Turbopack не мог читать эти каталоги при компиляции `globals.css`
   - Файл `.env.local` имел владельца `root:root` вместо `developer:developer`
   - Каталог `.next` имел владельца `root:root`

2. **Process Issues (застрявший процесс)**
   - Старый процесс Next.js (PID 48190) застрял на порту 3000
   - PM2 пытался запустить новый процесс, но получал `EADDRINUSE`
   - Crash loop: PM2 → start → EADDRINUSE → crash → restart

3. **SessionProvider Missing (код)**
   - Component `Header` использовал `useSession()` от next-auth
   - `SessionProvider` отсутствовал в дереве компонентов
   - Провайдер не был добавлен в `src/components/providers.tsx`
   - React выдавал ошибку: `[next-auth]: 'useSession' must be wrapped in a <SessionProvider />`

### Цепочка ошибок

```
Root cause (permission denied)
    ↓
Turbopack не может читать /workspace/docs/authentication
    ↓
CSS compilation fails
    ↓
Next.js app endpoint crashes
    ↓
PM2 restarts процесс
    ↓
Процесс застрял на порту 3000
    ↓
Новые запуски получают EADDRINUSE
    ↓
Crash loop
```

---

## Диагностика

### Шаг 1: Проверка контейнера и логов

```bash
# Контейнер работает
podman ps -a | grep pressograph
# pressograph-dev-workspace - Up 4 hours

# Dev server процесс запущен
podman exec -it pressograph-dev-workspace bash -c "ps aux | grep next"
# develop+   48190  4.1  7.1 next-server (v16.0.1)

# Проверка HTTP доступа
podman exec -it pressograph-dev-workspace bash -c "curl -I http://localhost:3000"
# HTTP/1.1 500 Internal Server Error
```

### Шаг 2: Анализ PM2 логов

```bash
pm2 logs nextjs-dev --err --lines 100
```

Найдены критические ошибки:

1. **Permission denied на .env.local:**
   ```
   ⨯ Failed to load env from .env.local
   Error: EACCES: permission denied, open '/workspace/.env.local'
   ```

2. **Turbopack permission error:**
   ```
   TurbopackInternalError: Failed to write app endpoint /page

   Caused by:
   - [project]/src/styles/globals.css [app-client] (css)
   - Unable to watch /workspace/docs/authentication
   - Permission denied (os error 13) about ["/workspace/docs/authentication"]
   ```

3. **SessionProvider error:**
   ```
   Error: [next-auth]: `useSession` must be wrapped in a <SessionProvider />
       at Header (src/components/layout/header.tsx:20:47)
   ```

4. **Port conflict:**
   ```
   Error: listen EADDRINUSE: address already in use :::3000
   ```

### Шаг 3: Проверка прав доступа

```bash
# Файловая система
ls -la /workspace/.env.local
# -rw-------. 1 root root 3324 Nov 6 21:20 /workspace/.env.local

ls -la /workspace/docs/
# drwx------. 2 root root 36 Nov 6 22:23 authentication
# drwx------. 2 developer developer 52 Nov 6 17:46 decisions

ls -la /workspace/.next/
# drwxr-xr-x. 10 root root 4096 Nov 6 22:14 .
```

---

## Решение

### 1. Исправление прав доступа (Permission Fix)

```bash
# Исправить права на каталоги docs
podman exec -u root -it pressograph-dev-workspace \
  bash -c "chown -R developer:developer /workspace/docs"

# Исправить режим доступа
podman exec -u root -it pressograph-dev-workspace \
  bash -c "chmod 755 /workspace/docs/authentication /workspace/docs/decisions"

# Исправить права на .env.local и .next
podman exec -u root -it pressograph-dev-workspace \
  bash -c "chown -R developer:developer /workspace/.env.local /workspace/.next"
```

### 2. Удаление застрявшего процесса (Process Cleanup)

```bash
# Убить застрявший процесс
podman exec -it pressograph-dev-workspace \
  bash -c "kill -9 48190"

# Удалить PM2 процесс
podman exec -it pressograph-dev-workspace \
  bash -c "pm2 delete nextjs-dev"

# Убить все Next.js процессы
podman exec -it pressograph-dev-workspace \
  bash -c "pkill -9 -f 'next-server' && pkill -9 -f 'next dev'"

# Проверить, что порт освободился
podman exec -it pressograph-dev-workspace \
  bash -c "lsof -i :3000 || echo 'Port 3000 is free'"
```

### 3. Исправление кода (SessionProvider)

**Файл:** `src/components/providers.tsx`

**До:**
```typescript
'use client';

import { SimpleQueryProvider } from "@/lib/query/query-provider-simple";

export function Providers({ children }: ProvidersProps) {
  return (
    <SimpleQueryProvider>
      {children}
    </SimpleQueryProvider>
  );
}
```

**После:**
```typescript
'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { SimpleQueryProvider } from "@/lib/query/query-provider-simple";

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SimpleQueryProvider>
          {children}
        </SimpleQueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
```

### 4. Перезапуск сервера

```bash
# Запустить PM2 процесс
podman exec -it pressograph-dev-workspace \
  bash -c "cd /workspace && pm2 start ecosystem.config.js --only nextjs-dev"

# Проверить статус
pm2 status
# nextjs-dev | online | 99095 | 68s
```

---

## Verification

### Тесты после исправления

1. **Internal HTTP Access:**
   ```bash
   curl -I http://localhost:3000
   # HTTP/1.1 200 OK ✅
   ```

2. **External HTTPS Access:**
   ```bash
   curl -I https://dev-pressograph.infra4.dev
   # HTTP/2 200 ✅
   ```

3. **HTML Content:**
   ```bash
   curl -s http://localhost:3000 | head -30
   # <!DOCTYPE html><html lang="en"><head>...
   # Landing page loads correctly ✅
   ```

4. **PM2 Process:**
   ```bash
   pm2 status
   # nextjs-dev | online | stable ✅
   ```

5. **Server Logs:**
   ```bash
   pm2 logs nextjs-dev --lines 20
   # ✓ Ready in 3.3s
   # GET / 200 in 277ms ✅
   # [Proxy] GET /api/auth/session ✅
   ```

---

## Timeline

| Time (UTC)  | Event                                          |
|-------------|------------------------------------------------|
| 22:00       | User reports Internal Server Error             |
| 22:05       | Diagnosis started - checked container status   |
| 22:10       | Found PM2 crash loop in logs                   |
| 22:15       | Identified Turbopack permission error          |
| 22:20       | Fixed file permissions (docs, .env, .next)     |
| 22:25       | Killed stuck Next.js process (PID 48190)       |
| 22:28       | Identified SessionProvider missing             |
| 22:29       | Fixed Providers component code                 |
| 22:30       | Restarted PM2 process                          |
| 22:31       | Verified fix - 200 OK responses                |
| 22:35       | Committed fix to GitHub (e2059cd9)             |
| 22:40       | Documentation created                          |

**Total Resolution Time:** ~40 minutes

---

## Impact

### Downtime

- **Start:** 2025-11-06 ~21:50 UTC (estimated)
- **End:** 2025-11-06 22:31 UTC
- **Duration:** ~40 minutes
- **Severity:** Complete service outage

### Affected Users

- All users attempting to access dev-pressograph.infra4.dev
- Development team unable to test features

---

## Prevention Measures

### Immediate Actions (Completed)

1. ✅ Fixed file permissions on critical directories
2. ✅ Added SessionProvider to component tree
3. ✅ Added ThemeProvider for theme management
4. ✅ Documented the incident
5. ✅ Committed fix to repository

### Short-term Improvements (Next Sprint)

1. **Monitoring:** Add health check endpoint (issue #84)
2. **Alerts:** Configure alerting for 5xx errors (issue #85)
3. **Process Management:** Improve PM2 configuration with proper restart policies
4. **Permissions:** Review and fix all file/directory permissions in container
5. **Documentation:** Create runbook for common production issues

### Long-term Improvements (Backlog)

1. **CI/CD:** Add pre-deployment health checks
2. **Container:** Review Dockerfile for proper user permissions
3. **Automation:** Automated permission checks in CI
4. **Error Handling:** Better error boundaries and fallbacks
5. **Testing:** Integration tests for authentication flow
6. **Observability:** Better structured logging with OpenTelemetry

---

## Related Issues

- **Closed:** N/A (hotfix)
- **Created:**
  - #84: Add health check endpoint (P1)
  - #85: Configure 5xx error alerting (P1)

---

## Lessons Learned

### What Went Well

1. Fast diagnosis using PM2 logs and Turbopack error messages
2. Clear error messages helped identify root causes
3. Systematic approach to troubleshooting
4. Good documentation of the fix

### What Could Be Improved

1. Earlier detection - should have had monitoring/alerts
2. File permissions should be validated in CI/CD
3. SessionProvider should have been caught in code review
4. Need better health checks for production readiness

### Action Items

1. [ ] Set up Uptime Robot or similar monitoring (issue #86)
2. [ ] Add pre-commit hooks for TypeScript strict checks
3. [ ] Create PR checklist including provider verification
4. [ ] Document common container permission patterns
5. [ ] Add automated tests for authentication flow

---

## References

- **Commit:** e2059cd9 - "fix: исправлена критическая ошибка Internal Server Error"
- **Files Changed:**
  - `src/components/providers.tsx` (SessionProvider + ThemeProvider added)
- **Logs:** `/tmp/pm2/nextjs-error.log`, `/tmp/pm2/nextjs-out.log`
- **Container:** pressograph-dev-workspace
- **PM2 Process:** nextjs-dev (ID: 4)

---

## Sign-off

**Incident Commander:** Claude Code Agent
**Resolved By:** Claude Code Agent
**Verified By:** User
**Date:** 2025-11-06
**Status:** ✅ RESOLVED

---

**End of Hotfix Report**
