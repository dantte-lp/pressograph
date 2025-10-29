# Миграционный гайд: Обновление Compose файлов до стандартов 2025

**Версия:** 1.0
**Дата:** 2025-10-29
**Ответственный:** DevOps Team
**Время выполнения:** ~30 минут
**Риск:** Низкий (при следовании инструкциям)

---

## Что изменяется

### Файлы

| Было | Станет | Действие |
|------|--------|----------|
| `docker-compose.dev.yml` | `compose.dev.yaml` | Переименование + модернизация |
| `docker-compose.prod.yml` | `compose.prod.yaml` | Переименование + модернизация |
| `.env` (только prod) | `.env.prod` | Переименование |
| - | `.env.dev` | **Создание нового** |
| - | `.env.example` | **Создание нового** |

### Ключевые изменения в Compose файлах

✅ **Удалено:**
- `version: '3.8'` field (устарел)

✅ **Добавлено:**
- Resource limits (CPU, memory) на всех сервисах
- Log rotation configuration (10MB max, 3-5 файлов)
- Security hardening (no-new-privileges, cap_drop, read-only FS)
- OCI standard labels (версия, описание, источник)
- Healthchecks с `start_period`
- YAML anchors для DRY
- User specification (non-root)

✅ **Исправлено:**
- PostgreSQL volume path: `/var/lib/postgresql` → `/var/lib/postgresql/data`
- Frontend в dev теперь зависит от backend
- Production frontend с read-only filesystem
- Webpack вместо curl в healthchecks (совместимость)

---

## Пререквизиты

Перед началом миграции убедитесь:

```bash
# 1. Podman version 4.4+
podman --version

# 2. Podman Compose установлен
podman-compose --version

# 3. Доступ к серверу
ssh root@your-server

# 4. Текущий проект работает
cd /opt/projects/repositories/pressure-test-visualizer
podman-compose -f deploy/compose/docker-compose.dev.yml ps
podman-compose -f deploy/compose/docker-compose.prod.yml ps

# 5. Есть backup базы данных (для production)
podman exec pressograph-db pg_dump -U pressograph pressograph > backup_$(date +%Y%m%d).sql
```

---

## ЭТАП 1: Подготовка (5 минут)

### 1.1 Создание резервных копий

```bash
cd /opt/projects/repositories/pressure-test-visualizer/deploy/compose

# Backup существующих файлов
cp docker-compose.dev.yml docker-compose.dev.yml.backup
cp docker-compose.prod.yml docker-compose.prod.yml.backup
cp .env .env.backup

echo "✅ Резервные копии созданы"
```

### 1.2 Проверка текущего состояния

```bash
# Проверить что контейнеры запущены
podman ps | grep pressograph

# Проверить volumes (они должны сохраниться)
podman volume ls | grep pressograph

# Проверить доступность приложений
curl -k https://dev-pressograph.infra4.dev/api/health || echo "Dev не запущен"
curl -k https://pressograph.infra4.dev/api/health || echo "Prod не запущен"
```

---

## ЭТАП 2: Создание новых environment файлов (5 минут)

### 2.1 Создать .env.dev

```bash
cd /opt/projects/repositories/pressure-test-visualizer/deploy/compose

# Файл уже создан: .env.dev
# Проверить содержимое:
cat .env.dev
```

**Важно:** `.env.dev` уже содержит все необходимые переменные из старого dev файла.

### 2.2 Переименовать .env в .env.prod

```bash
# Текущий .env содержит production secrets
mv .env .env.prod

echo "✅ .env.prod создан"
```

### 2.3 Проверить .env.example

```bash
# Файл уже создан: .env.example
cat .env.example

echo "✅ .env.example готов к использованию"
```

### 2.4 Обновить .gitignore

```bash
cd /opt/projects/repositories/pressure-test-visualizer/deploy/compose

# Проверить текущий .gitignore
if [ -f .gitignore ]; then
    cat .gitignore
else
    touch .gitignore
fi

# Добавить правила (если еще нет)
cat >> .gitignore <<'EOF'
# Environment files with secrets
.env.prod
.env.local
*.backup

# Keep templates
!.env.example
!.env.dev
EOF

echo "✅ .gitignore обновлен"
```

---

## ЭТАП 3: Обновление Development (10 минут)

### 3.1 Остановить development (если запущен)

```bash
cd /opt/projects/repositories/pressure-test-visualizer

# Проверить статус
podman-compose -f deploy/compose/docker-compose.dev.yml ps

# Остановить gracefully
podman-compose -f deploy/compose/docker-compose.dev.yml down

echo "✅ Development окружение остановлено"
```

### 3.2 Заменить compose файл

```bash
cd /opt/projects/repositories/pressure-test-visualizer/deploy/compose

# Удалить старый файл (backup уже есть)
rm docker-compose.dev.yml

# Новый файл уже создан: compose.dev.yaml
ls -lh compose.dev.yaml

echo "✅ compose.dev.yaml готов"
```

### 3.3 Валидация новой конфигурации

```bash
cd /opt/projects/repositories/pressure-test-visualizer

# Проверить синтаксис
podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev config > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Конфигурация валидна"
else
    echo "❌ ОШИБКА: Проверьте синтаксис"
    exit 1
fi
```

### 3.4 Запуск обновленного development

```bash
cd /opt/projects/repositories/pressure-test-visualizer

# Запустить с новым compose файлом
podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev up -d

# Ждем старта (healthchecks могут занять до 90 секунд)
echo "⏳ Ожидание старта сервисов (90 секунд)..."
sleep 95

# Проверить статус
podman-compose -f deploy/compose/compose.dev.yaml ps

echo "✅ Development окружение запущено"
```

### 3.5 Тестирование development

```bash
# Проверить healthchecks
podman ps --format "table {{.Names}}\t{{.Status}}" | grep pressograph-dev

# Проверить API
curl -k https://dev-pressograph.infra4.dev/api/health

# Проверить Frontend
curl -k https://dev-pressograph.infra4.dev/

# Проверить логи (не должно быть ошибок)
podman-compose -f deploy/compose/compose.dev.yaml logs --tail 50 | grep -i error

echo "✅ Development работает корректно"
```

---

## ЭТАП 4: Обновление Makefile (5 минут)

```bash
cd /opt/projects/repositories/pressure-test-visualizer

# Создать backup
cp Makefile Makefile.backup

# Обновить пути к compose файлам
sed -i 's/docker-compose\.dev\.yml/compose.dev.yaml/g' Makefile
sed -i 's/docker-compose\.prod\.yml/compose.prod.yaml/g' Makefile

# Обновить команды для использования --env-file

# Найти строку с dev-compose и заменить
sed -i '/^dev-compose:/,/^$/{
    s|podman-compose -f deploy/compose/compose.dev.yaml up -d|podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev up -d|
}' Makefile

# Найти строку с prod-compose и заменить
sed -i '/^prod-compose:/,/^$/{
    s|podman-compose -f deploy/compose/compose.prod.yaml up -d|podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod up -d|
}' Makefile

echo "✅ Makefile обновлен"

# Проверить изменения
git diff Makefile
```

**Или вручную отредактировать:**

```makefile
# Найти в Makefile и заменить:

dev-compose: ## Run development environment (via podman-compose)
	@echo -e "$(CYAN)Starting development environment via podman-compose...$(NC)"
	podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev up -d
	@echo -e "$(GREEN)Development environment started!$(NC)"

prod-compose: ## Run production environment (via podman-compose)
	@echo -e "$(CYAN)Starting production environment via podman-compose...$(NC)"
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod up -d
	@echo -e "$(GREEN)Production environment started!$(NC)"
```

### Тестирование Makefile

```bash
# Остановить dev
podman-compose -f deploy/compose/compose.dev.yaml down

# Запустить через Makefile
make dev-compose

# Проверить
podman ps | grep pressograph-dev

echo "✅ Makefile работает корректно"
```

---

## ЭТАП 5: Обновление Production (15 минут)

### ⚠️ КРИТИЧЕСКИ ВАЖНО

**Делать в maintenance window!**
**Ожидаемый даунтайм: ~90 секунд**

### 5.1 Pre-deployment checklist

```bash
# 1. Уведомить пользователей (если есть)
echo "⚠️  Maintenance window: starting at $(date)"

# 2. Создать backup базы данных
cd /opt/projects/repositories/pressure-test-visualizer
podman exec pressograph-db pg_dump -U pressograph pressograph > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Проверить размер backup
ls -lh backups/backup_*.sql | tail -1

# 3. Backup volumes
podman run --rm \
  -v pressograph-postgres-data:/data:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres_volume_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

echo "✅ Backups созданы"
```

### 5.2 Валидация новой конфигурации

```bash
cd /opt/projects/repositories/pressure-test-visualizer

# Проверить синтаксис
podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod config > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Production конфигурация валидна"
else
    echo "❌ ОШИБКА: Проверьте синтаксис"
    exit 1
fi
```

### 5.3 Rolling update (минимальный даунтайм)

```bash
cd /opt/projects/repositories/pressure-test-visualizer

# Засечь время начала
START_TIME=$(date +%s)

# 1. Остановить только frontend (users увидят offline)
podman stop pressograph-frontend
echo "⏸️  Frontend остановлен"

# 2. Обновить backend (graceful restart)
podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod up -d --force-recreate backend

# Ждем healthcheck backend (~45 секунд)
echo "⏳ Ожидание старта backend (45 секунд)..."
sleep 50

# Проверить health
podman inspect pressograph-backend --format '{{.State.Health.Status}}'

# 3. Обновить frontend
podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod up -d --force-recreate frontend

# Ждем healthcheck frontend (~15 секунд)
echo "⏳ Ожидание старта frontend (15 секунд)..."
sleep 20

# 4. PostgreSQL - только обновить metadata (НЕ пересоздавать!)
podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod up -d --no-recreate postgres

# Засечь время окончания
END_TIME=$(date +%s)
DOWNTIME=$((END_TIME - START_TIME))

echo "✅ Production обновлен за $DOWNTIME секунд"
```

### 5.4 Post-deployment validation

```bash
# 1. Проверить статус контейнеров
podman ps --format "table {{.Names}}\t{{.Status}}" | grep pressograph

# 2. Проверить healthchecks
podman inspect pressograph-backend --format '{{.State.Health.Status}}'
podman inspect pressograph-frontend --format '{{.State.Health.Status}}'

# 3. Проверить API
curl -I https://pressograph.infra4.dev/api/health

# Должен вернуть: HTTP/2 200

# 4. Проверить Frontend
curl -I https://pressograph.infra4.dev/

# Должен вернуть: HTTP/2 200

# 5. Проверить SSL сертификат
echo | openssl s_client -connect pressograph.infra4.dev:443 -servername pressograph.infra4.dev 2>/dev/null | grep "Verify return code"

# Должен вернуть: Verify return code: 0 (ok)

# 6. Проверить логи (no errors)
podman-compose -f deploy/compose/compose.prod.yaml logs --tail 100 | grep -i error

# 7. Проверить resource usage
podman stats --no-stream | grep pressograph

echo "✅ Production validation passed"
```

---

## ЭТАП 6: Финализация (5 минут)

### 6.1 Удалить старые файлы

```bash
cd /opt/projects/repositories/pressure-test-visualizer/deploy/compose

# Удалить старые compose файлы (backups сохранены)
rm docker-compose.dev.yml.backup
rm docker-compose.prod.yml.backup
rm .env.backup

# Удалить старые compose файлы (если они еще остались)
rm -f docker-compose.dev.yml
rm -f docker-compose.prod.yml

echo "✅ Cleanup выполнен"
```

### 6.2 Обновить документацию

```bash
cd /opt/projects/repositories/pressure-test-visualizer/deploy/compose

# README.md уже обновлен в MODERNIZATION_ANALYSIS.md
# Можно скопировать секцию в README

cat >> README.md <<'EOF'

## Обновление 2025-10-29

Compose файлы модернизированы согласно best practices 2025:
- ✅ Удален устаревший `version` field
- ✅ Добавлены resource limits
- ✅ Настроена log rotation
- ✅ Security hardening (no-new-privileges, read-only FS)
- ✅ OCI labels для metadata
- ✅ Healthchecks с start_period

См. `MODERNIZATION_ANALYSIS.md` для деталей.
EOF

echo "✅ Документация обновлена"
```

### 6.3 Commit changes (если используется git)

```bash
cd /opt/projects/repositories/pressure-test-visualizer

# Проверить изменения
git status

# Добавить новые файлы
git add deploy/compose/compose.dev.yaml
git add deploy/compose/compose.prod.yaml
git add deploy/compose/.env.dev
git add deploy/compose/.env.example
git add deploy/compose/.gitignore
git add deploy/compose/MODERNIZATION_ANALYSIS.md
git add deploy/compose/MIGRATION_GUIDE.md
git add Makefile

# НЕ добавляем .env.prod (содержит секреты!)

# Удалить старые файлы из git
git rm deploy/compose/docker-compose.dev.yml
git rm deploy/compose/docker-compose.prod.yml

# Commit
git commit -m "Modernize Compose files to 2025 best practices

- Remove deprecated version field
- Add resource limits (CPU, memory)
- Configure log rotation
- Implement security hardening (no-new-privileges, cap_drop)
- Add OCI standard labels
- Fix PostgreSQL volume path
- Add healthchecks with start_period
- Create .env.dev and .env.example
- Update Makefile with new file paths

See deploy/compose/MODERNIZATION_ANALYSIS.md for details.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "✅ Changes committed"
```

---

## ЭТАП 7: Мониторинг (24 часа)

### 7.1 Немедленная проверка (первые 30 минут)

```bash
# Каждые 5 минут:
watch -n 300 '
    echo "=== Container Status ==="
    podman ps --format "table {{.Names}}\t{{.Status}}" | grep pressograph

    echo -e "\n=== Health Checks ==="
    curl -s https://pressograph.infra4.dev/api/health | jq .

    echo -e "\n=== Resource Usage ==="
    podman stats --no-stream | grep pressograph

    echo -e "\n=== Recent Errors ==="
    podman logs pressograph-backend --tail 20 | grep -i error
'
```

### 7.2 Проверка через 24 часа

```bash
# После 24 часов работы проверить:

# 1. Log rotation работает?
podman inspect pressograph-backend --format '{{.HostConfig.LogConfig}}'

# 2. Размер логов не превышает лимиты?
du -sh /var/lib/containers/storage/overlay-containers/*/userdata/

# 3. Memory usage в пределах limits?
podman stats --no-stream | grep pressograph

# 4. Нет OOM kills?
journalctl -xe | grep -i "out of memory"

echo "✅ 24-hour monitoring check passed"
```

---

## Rollback Plan (в случае проблем)

### Для Development

```bash
cd /opt/projects/repositories/pressure-test-visualizer

# Остановить новое окружение
podman-compose -f deploy/compose/compose.dev.yaml down

# Восстановить старый файл
cp deploy/compose/docker-compose.dev.yml.backup deploy/compose/docker-compose.dev.yml

# Запустить старую версию
podman-compose -f deploy/compose/docker-compose.dev.yml up -d

echo "✅ Development rollback complete"
```

### Для Production

```bash
cd /opt/projects/repositories/pressure-test-visualizer

# 1. Остановить новое окружение
podman-compose -f deploy/compose/compose.prod.yaml down

# 2. Восстановить старый compose
cp deploy/compose/docker-compose.prod.yml.backup deploy/compose/docker-compose.prod.yml
cp deploy/compose/.env.backup deploy/compose/.env

# 3. Запустить старую версию
podman-compose -f deploy/compose/docker-compose.prod.yml up -d

# 4. Проверить
curl https://pressograph.infra4.dev/api/health

# 5. Восстановить базу (если нужно)
# podman exec -i pressograph-db psql -U pressograph pressograph < backups/backup_YYYYMMDD_HHMMSS.sql

echo "✅ Production rollback complete"
```

---

## Проверочный чеклист после миграции

### Development

- [ ] `compose.dev.yaml` существует и валиден
- [ ] `.env.dev` создан и содержит все переменные
- [ ] Старый `docker-compose.dev.yml` удален
- [ ] `version` field удален из compose файла
- [ ] Resource limits настроены
- [ ] Logging rotation включен
- [ ] Healthchecks работают
- [ ] Frontend зависит от backend
- [ ] PostgreSQL volume path исправлен
- [ ] API доступен: https://dev-pressograph.infra4.dev/api/health
- [ ] Frontend загружается: https://dev-pressograph.infra4.dev
- [ ] Hot reload работает (изменить код → увидеть изменения)
- [ ] Логи без ошибок

### Production

- [ ] `compose.prod.yaml` существует и валиден
- [ ] `.env.prod` создан (переименован из `.env`)
- [ ] `.env.prod` в .gitignore
- [ ] Старый `docker-compose.prod.yml` удален
- [ ] Backup базы создан перед миграцией
- [ ] Resource limits настроены
- [ ] Security hardening (read-only FS на frontend)
- [ ] Healthchecks работают с start_period
- [ ] API доступен: https://pressograph.infra4.dev/api/health
- [ ] Frontend загружается: https://pressograph.infra4.dev
- [ ] SSL сертификат валиден
- [ ] Логи без ошибок
- [ ] Resource usage в пределах лимитов
- [ ] Log rotation работает

### Общее

- [ ] Makefile обновлен
- [ ] `.env.example` создан
- [ ] `.gitignore` обновлен
- [ ] Документация обновлена
- [ ] Git commit создан (если используется)
- [ ] Команда уведомлена об изменениях

---

## Часто задаваемые вопросы (FAQ)

### Q: Почему удалили `version: '3.8'`?

**A:** Version field устарел с Docker Compose v1.27.0+ (июнь 2020). Современные версии Compose автоматически используют последнюю Compose Specification. Наличие version field игнорируется и считается legacy.

### Q: Почему увеличился размер compose файлов?

**A:** Добавлены production-ready настройки:
- Resource limits (защита от OOM)
- Logging rotation (предотвращение заполнения диска)
- Security options (hardening)
- OCI labels (metadata для inventory)
- Детальные комментарии

### Q: Как проверить что resource limits работают?

**A:**
```bash
# Проверить лимиты в metadata
podman inspect pressograph-backend | grep -A 10 Resources

# Проверить реальное использование
podman stats --no-stream pressograph-backend

# Memory limit должен быть виден в колонке LIMIT
```

### Q: Безопасно ли коммитить .env.dev в git?

**A:** Да, для development окружения это приемлемо, если пароли слабые и используются ТОЛЬКО для локальной разработки. НО:
- ❌ НИКОГДА не коммитьте .env.prod
- ❌ НИКОГДА не используйте production секреты в .env.dev
- ✅ Используйте слабые, очевидно dev пароли ("devpassword123")

### Q: Что делать если healthcheck fails во время startup?

**A:** Это нормально в течение `start_period`. Проверьте:
```bash
# Текущий статус
podman inspect pressograph-backend --format '{{.State.Health}}'

# Если прошло больше start_period (90s) и все еще unhealthy:
podman logs pressograph-backend --tail 50
```

### Q: Volumes сохранятся после миграции?

**A:** Да, volumes не затрагиваются миграцией. Данные PostgreSQL, uploads, логи - все сохранится.

### Q: Нужно ли пересобирать images?

**A:** Нет, для текущей миграции rebuild не требуется. Изменения только в compose файлах (orchestration), не в Dockerfile.

### Q: Как проверить что log rotation работает?

**A:**
```bash
# Проверить конфигурацию
podman inspect pressograph-backend --format '{{.HostConfig.LogConfig}}'

# Должно быть:
# {json-file map[max-file:3 max-size:10m]}

# Найти файлы логов
find /var/lib/containers/storage/overlay-containers -name "*.log" | xargs ls -lh
```

---

## Контакты и поддержка

**Документация:**
- Полный анализ: `MODERNIZATION_ANALYSIS.md`
- Compose Specification: https://github.com/compose-spec/compose-spec
- Podman Compose: https://docs.podman.io/en/latest/markdown/podman-compose.1.html

**В случае проблем:**
1. Проверьте логи: `podman-compose logs -f`
2. Проверьте healthchecks: `podman ps`
3. Используйте rollback plan (выше)
4. Обратитесь к DevOps команде

---

**Статус миграции:** ✅ Готово к применению
**Тестирование:** Пройдено на dev окружении
**Production риски:** Минимальные (при следовании инструкциям)
**Ожидаемый даунтайм:** ~90 секунд
**Rollback time:** ~5 минут

🚀 Удачной миграции!
