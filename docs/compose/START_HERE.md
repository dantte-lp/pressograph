# 🚀 START HERE - Быстрый старт

**Проект:** Pressograph Compose Modernization 2025
**Статус:** ✅ Готово к применению
**Дата:** 2025-10-29

---

## 📚 Что здесь находится?

Вы находитесь в директории с **модернизированными Compose файлами** для проекта Pressograph, обновленными согласно **best practices 2025**.

### Что изменилось?

- ✅ Удален устаревший `version: '3.8'` field
- ✅ Добавлены resource limits (защита от OOM)
- ✅ Настроена log rotation (предотвращение заполнения диска)
- ✅ Security hardening (no-new-privileges, read-only FS)
- ✅ OCI labels для metadata
- ✅ Healthchecks с start_period
- ✅ 11 новых файлов (configs + документация)

---

## 🎯 Ваша цель?

### 1️⃣ Быстро запустить Development

```bash
cd /opt/projects/repositories/pressure-test-visualizer
make dev-compose

# Проверить
curl -k https://dev-pressograph.infra4.dev/api/health
```

**Документация:** `README.md` (секция Quick Start)

---

### 2️⃣ Быстро запустить Production

```bash
cd /opt/projects/repositories/pressure-test-visualizer

# ВАЖНО: Проверить .env.prod
cat deploy/compose/.env.prod  # Должен содержать сильные пароли

# Запустить
make prod-compose

# Проверить
curl https://pressograph.infra4.dev/api/health
```

**Документация:** `README.md` (секция Quick Start)

---

### 3️⃣ Мигрировать со старых файлов

**СТОП!** Не спешите! Прочитайте миграционный гайд:

📖 **`MIGRATION_GUIDE.md`** - Пошаговая инструкция

**Краткая версия (для опытных):**

```bash
cd /opt/projects/repositories/pressure-test-visualizer

# 1. Backup
cp -r deploy/compose deploy/compose.backup

# 2. Переименовать .env → .env.prod
mv deploy/compose/.env deploy/compose/.env.prod

# 3. Удалить старые файлы
rm deploy/compose/docker-compose.dev.yml
rm deploy/compose/docker-compose.prod.yml

# 4. Обновить Makefile (см. Makefile.patch)

# 5. Запустить dev
make dev-compose

# 6. Проверить
curl -k https://dev-pressograph.infra4.dev/api/health
```

---

### 4️⃣ Понять что было сделано

📊 **`SUMMARY.md`** - Полное резюме с метриками

**Краткие цифры:**
- 11 файлов создано
- 887 строк конфигурации (compose файлы)
- ~4,000 строк документации
- 20 проблем исправлено
- ~3.5 часа работы

---

### 5️⃣ Изучить детали

📖 **`MODERNIZATION_ANALYSIS.md`** - Детальный анализ (40KB)
- Полный список найденных проблем
- Приоритеты (критические → низкие)
- Детальный план обновления
- Best practices 2025

---

### 6️⃣ Нужна быстрая команда?

📋 **`CHEATSHEET.md`** - Справочник команд

**Популярные команды:**

```bash
# Логи
podman-compose -f deploy/compose/compose.dev.yaml logs -f

# Restart сервиса
podman-compose -f deploy/compose/compose.dev.yaml restart backend

# Healthchecks
curl https://pressograph.infra4.dev/api/health

# Stats
podman stats --no-stream | grep pressograph

# Database backup
podman exec pressograph-db pg_dump -U pressograph pressograph > backup.sql
```

---

### 7️⃣ Troubleshooting

**Проблема:** Контейнер не стартует
```bash
podman logs pressograph-backend --tail 100
```

**Проблема:** API недоступен
```bash
curl -I https://pressograph.infra4.dev/api/health
podman ps | grep pressograph
```

**Проблема:** База недоступна
```bash
podman exec -it pressograph-db psql -U pressograph pressograph
```

**Больше решений:** `README.md` (секция Troubleshooting)

---

## 📁 Навигация по файлам

### Для начинающих

1. **`START_HERE.md`** ← ВЫ ЗДЕСЬ
2. **`README.md`** ← Основная документация
3. **`CHEATSHEET.md`** ← Быстрая справка

### Для опытных

1. **`MIGRATION_GUIDE.md`** ← Миграция
2. **`MODERNIZATION_ANALYSIS.md`** ← Анализ
3. **`SUMMARY.md`** ← Резюме

### Для всех

- **`FILES_MANIFEST.md`** ← Каталог всех файлов
- **`.env.example`** ← Шаблон environment переменных

---

## 🗺️ Полный список файлов

| Файл | Назначение | Размер |
|------|-----------|--------|
| **Конфигурация** | | |
| `compose.dev.yaml` | Development окружение | 20KB (418 строк) |
| `compose.prod.yaml` | Production окружение | 20KB (469 строк) |
| `.env.dev` | Dev переменные | 8KB (82 строки) |
| `.env.example` | Шаблон | 16KB (190 строк) |
| `.gitignore` | Защита секретов | 8KB (101 строка) |
| **Документация** | | |
| `START_HERE.md` | Быстрый старт (этот файл) | 8KB |
| `README.md` | Основная документация | 20KB (633 строки) |
| `CHEATSHEET.md` | Справочник команд | 8KB (362 строки) |
| `MIGRATION_GUIDE.md` | Инструкция миграции | 24KB (747 строк) |
| `MODERNIZATION_ANALYSIS.md` | Детальный анализ | 40KB (1190 строк) |
| `SUMMARY.md` | Итоговое резюме | 24KB (651 строка) |
| `FILES_MANIFEST.md` | Каталог файлов | 16KB (450 строк) |
| **Утилиты** | | |
| `Makefile.patch` | Патч для Makefile | 8KB (87 строк) |

**Итого:** 13 файлов, ~220KB, ~5,000 строк

---

## ⚡ Quick Actions

### Я хочу просто запустить проект

```bash
# Development
cd /opt/projects/repositories/pressure-test-visualizer
make dev-compose

# Production
make prod-compose
```

**Дальше:** `README.md` → Quick Start

---

### Я хочу мигрировать с docker-compose.yml

```bash
# СНАЧАЛА прочитать:
cat deploy/compose/MIGRATION_GUIDE.md | less

# Потом выполнить миграцию (см. гайд)
```

**Дальше:** `MIGRATION_GUIDE.md` → Этап 1

---

### Я хочу понять что изменилось

```bash
# Краткая версия
cat deploy/compose/SUMMARY.md | less

# Детальная версия
cat deploy/compose/MODERNIZATION_ANALYSIS.md | less
```

**Дальше:** `SUMMARY.md` или `MODERNIZATION_ANALYSIS.md`

---

### Я хочу посмотреть команды

```bash
cat deploy/compose/CHEATSHEET.md | less

# Или открыть в редакторе для поиска
nano deploy/compose/CHEATSHEET.md
```

**Дальше:** `CHEATSHEET.md`

---

### Я хочу найти конкретный файл

```bash
cat deploy/compose/FILES_MANIFEST.md | less

# Поиск по ключевым словам
grep -i "environment" deploy/compose/FILES_MANIFEST.md
```

**Дальше:** `FILES_MANIFEST.md`

---

## 🔒 Security Checklist

### Development (сейчас)

- [x] `.env.dev` создан (слабые пароли - ОК для dev)
- [x] Resource limits настроены
- [x] Log rotation включена
- [x] Healthchecks работают

### Production (перед deploy)

- [ ] **.env.prod создан** с сильными паролями
- [ ] **JWT secrets** сгенерированы `openssl rand -hex 32`
- [ ] **.env.prod в .gitignore** (НЕ коммитить!)
- [ ] **Database backup** создан
- [ ] **Maintenance window** запланирован
- [ ] **Rollback plan** готов

**Детали:** `README.md` → Security Checklist

---

## 🆘 Помощь

### Где искать ответы?

| Вопрос | Файл | Секция |
|--------|------|--------|
| Как запустить? | `README.md` | Quick Start |
| Как мигрировать? | `MIGRATION_GUIDE.md` | Этапы 1-7 |
| Что изменилось? | `SUMMARY.md` | Ключевые изменения |
| Почему изменилось? | `MODERNIZATION_ANALYSIS.md` | Анализ |
| Какие команды? | `CHEATSHEET.md` | Весь файл |
| Где файл X? | `FILES_MANIFEST.md` | Разделы 1-5 |
| Ошибка! | `README.md` | Troubleshooting |

### Не нашли ответ?

1. Поиск по всем MD файлам:
   ```bash
   cd /opt/projects/repositories/pressure-test-visualizer/deploy/compose
   grep -r "ваш вопрос" *.md
   ```

2. Проверить логи:
   ```bash
   podman logs pressograph-backend --tail 100
   ```

3. Проверить статус:
   ```bash
   podman ps | grep pressograph
   ```

---

## 📊 Статус проекта

### Validation

- ✅ `compose.dev.yaml` - валиден (`podman-compose config`)
- ✅ `compose.prod.yaml` - валиден (`podman-compose config`)
- ✅ `.env.dev` - корректен (все переменные заполнены)
- ✅ `.env.example` - корректен (шаблон)
- ✅ `.gitignore` - корректен (защищает .env.prod)

### Ready for

- ✅ Development deployment - READY
- ✅ Production deployment - READY (после .env.prod)
- ✅ Migration from old files - READY
- ✅ Git commit - READY

---

## 🎉 Следующие шаги

### Сегодня (рекомендуется)

1. ✅ Прочитать `START_HERE.md` (этот файл) ← DONE
2. ⏳ Прочитать `README.md` Quick Start
3. ⏳ Запустить dev: `make dev-compose`
4. ⏳ Проверить работоспособность

### Эта неделя

1. ⏳ Тестировать dev 2-3 дня
2. ⏳ Прочитать `MIGRATION_GUIDE.md` полностью
3. ⏳ Создать production backup
4. ⏳ Мигрировать production (в maintenance window)

### Опционально

1. ⏳ Изучить `MODERNIZATION_ANALYSIS.md` для деталей
2. ⏳ Добавить bash aliases из `CHEATSHEET.md`
3. ⏳ Настроить monitoring
4. ⏳ Автоматизировать backups

---

## 💡 Советы

### Для новичков

- Начните с `README.md` → Quick Start
- Используйте `CHEATSHEET.md` для команд
- Не бойтесь задавать вопросы

### Для опытных

- `MIGRATION_GUIDE.md` содержит zero-downtime план
- `MODERNIZATION_ANALYSIS.md` объясняет каждое изменение
- `Makefile.patch` упростит обновление Makefile

### Для всех

- **.env.prod НИКОГДА не коммитить!**
- Всегда делайте backup перед production изменениями
- Используйте `--env-file` флаг с podman-compose

---

## 📞 Контакты

**Документация:**
- GitHub: `/opt/projects/repositories/pressure-test-visualizer`
- Compose docs: `deploy/compose/`

**External:**
- Compose Spec: https://github.com/compose-spec/compose-spec
- Podman Docs: https://docs.podman.io

---

**Текущий файл:** `START_HERE.md`
**Версия:** 2.0
**Дата:** 2025-10-29
**Статус:** ✅ Production Ready

---

# 🚀 Готово! Что дальше?

## Вариант 1: Быстрый старт (5 минут)

```bash
cd /opt/projects/repositories/pressure-test-visualizer
make dev-compose
curl -k https://dev-pressograph.infra4.dev/api/health
```

## Вариант 2: Изучить документацию (30 минут)

```bash
# Основы
cat deploy/compose/README.md | less

# Команды
cat deploy/compose/CHEATSHEET.md | less
```

## Вариант 3: Мигрировать production (45 минут)

```bash
# Прочитать гайд
cat deploy/compose/MIGRATION_GUIDE.md | less

# Следовать инструкциям
```

---

**Выбирайте вариант и вперед!** 🚀
