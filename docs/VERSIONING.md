# Version Numbering Strategy - Pressograph

## Вопрос / Question

**RU:** Номер версии стоит указывать по номеру билда, или последнего коммита, как это делается в мире с точки зрения лучших практик?

**EN:** Should version numbers be based on build numbers or the last commit? What are the industry best practices?

## Рекомендованная стратегия / Recommended Strategy

Pressograph использует **гибридный подход** на основе Semantic Versioning с метаданными сборки.

Pressograph uses a **hybrid approach** based on Semantic Versioning with build metadata.

### Формат версии / Version Format

```
Production:  v1.2.0
Development: v1.2.0-dev+aa16350
Beta/RC:     v1.2.0-beta.1+build.123
```

## Semantic Versioning (SemVer) - ОСНОВНАЯ СИСТЕМА

**Формат:** `MAJOR.MINOR.PATCH`

### Правила инкремента версий:

- **MAJOR (1.x.x)**: Breaking changes (несовместимые изменения API)
  - Пример: изменение структуры API endpoints, удаление функциональности
  - При обновлении: пользователи должны изменить свой код

- **MINOR (x.2.x)**: New features (обратно совместимые новые возможности)
  - Пример: новые параметры в API, новые форматы экспорта, улучшения UI
  - При обновлении: работает без изменений кода

- **PATCH (x.x.0)**: Bug fixes (исправления ошибок)
  - Пример: исправление кодировки, багфиксы, security patches
  - При обновлении: прозрачно для пользователей

### Примеры из истории Pressograph:

```
v1.0.0 → v1.1.0  (добавлена история графиков)
v1.1.0 → v1.1.1  (исправлена кодировка PNG)
v1.1.1 → v1.2.0  (добавлены темы, комментарии, поиск)
v1.2.0 → v2.0.0  (изменение API с /generate на /api/generate - breaking!)
```

## Метаданные сборки / Build Metadata

### Development Builds

```
v1.2.0-dev+aa16350
  │      │    │
  │      │    └─ Git commit hash (короткий, 7 символов)
  │      └────── Pre-release identifier
  └─────────────── Base version
```

### CI/CD Builds

```
v1.2.0-beta.1+build.456
  │           │      │
  │           │      └─ Build number из CI/CD
  │           └──────── Pre-release version
  └──────────────────── Base version
```

## Альтернативные подходы (не используются)

### 1. CalVer (Calendar Versioning)

```
2025.10.31  или  25.10.3
```

**Используется:** Ubuntu, pip, Black
**Минусы для Pressograph:** Не показывает характер изменений

### 2. Build Number Only

```
1.2.0.456  (где 456 = CI build number)
```

**Используется:** Jenkins, старые корпоративные системы
**Минусы:** Build number не несет смысловой нагрузки

### 3. Git Commit Hash Only

```
v1.2.0-g3a2f1b9
```

**Используется:** Kubernetes development builds
**Минусы:** Неудобно для релизов, не понятно из версии что изменилось

## Реализация / Implementation

### 1. Основной файл версии

**Файл:** `/opt/projects/repositories/pressograph/VERSION`

```
1.2.0
```

Этот файл является единственным источником истины (single source of truth) для версии.

### 2. Frontend Version Display

**Файл:** `src/components/common/Version.tsx`

```tsx
export const Version = () => {
  const version = import.meta.env.VITE_APP_VERSION || '1.2.0';
  const commit = import.meta.env.VITE_COMMIT_HASH || '';
  const buildDate = import.meta.env.VITE_BUILD_DATE || '';
  const env = import.meta.env.MODE;

  const displayVersion =
    env === 'development' && commit ? `${version}-dev+${commit.substring(0, 7)}` : version;

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
      <span>Pressograph v{displayVersion}</span>
      {buildDate && <span className="ml-2">({buildDate})</span>}
    </div>
  );
};
```

### 3. Containerfile (Build Arguments)

**Файл:** `/opt/projects/repositories/pressograph/Containerfile`

```dockerfile
ARG VERSION=1.2.0
ARG COMMIT_HASH
ARG BUILD_DATE

# Stage 1: Build
FROM node:22-trixie-slim AS builder

ARG VERSION
ARG COMMIT_HASH
ARG BUILD_DATE

ENV VITE_APP_VERSION=$VERSION
ENV VITE_COMMIT_HASH=$COMMIT_HASH
ENV VITE_BUILD_DATE=$BUILD_DATE

# ... build steps ...
```

### 4. Makefile Integration

**Файл:** `/opt/projects/repositories/pressograph/Makefile`

```makefile
VERSION := $(shell cat VERSION)
COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE := $(shell date -u +'%Y-%m-%d %H:%M:%S UTC')

rebuild-frontend-prod:
	@echo "Building Pressograph v$(VERSION) (commit: $(COMMIT))"
	npm run build
	buildah bud \
		--build-arg VERSION=$(VERSION) \
		--build-arg COMMIT_HASH=$(COMMIT) \
		--build-arg BUILD_DATE="$(BUILD_DATE)" \
		-t localhost/pressograph-frontend:$(VERSION) \
		-t localhost/pressograph-frontend:latest \
		-f Containerfile .
```

### 5. Backend API Version Endpoint

**Файл:** `server/src/routes/version.ts`

```typescript
import express from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

const router = express.Router();

router.get('/version', (req, res) => {
  const version = readFileSync(join(__dirname, '../../VERSION'), 'utf-8').trim();
  const commit = process.env.COMMIT_HASH || 'unknown';
  const buildDate = process.env.BUILD_DATE || 'unknown';

  res.json({
    version,
    commit,
    buildDate,
    environment: process.env.NODE_ENV || 'production',
  });
});

export default router;
```

## Workflow для релизов / Release Workflow

### 1. Патч-релиз (Bug Fix)

```bash
# 1. Обновить VERSION файл
echo "1.2.1" > VERSION

# 2. Обновить package.json
npm version 1.2.1 --no-git-tag-version

# 3. Создать коммит
git add VERSION package.json
git commit -m "chore: bump version to v1.2.1

Fixes:
- Fixed PNG encoding for Russian text
- Fixed PDF landscape orientation"

# 4. Создать тег
git tag -a v1.2.1 -m "Release v1.2.1

Bug Fixes:
- Fixed PNG encoding for Russian text
- Fixed PDF landscape orientation"

# 5. Собрать и задеплоить
make rebuild-all
make deploy-prod
```

### 2. Минорный релиз (New Features)

```bash
# 1. Обновить VERSION
echo "1.3.0" > VERSION

# 2. Обновить package.json
npm version 1.3.0 --no-git-tag-version

# 3. Коммит и тег
git add VERSION package.json CHANGELOG.md
git commit -m "chore: bump version to v1.3.0

New Features:
- Added bilingual support (EN/RU)
- Added theme selection for exports
- Added comment search functionality"

git tag -a v1.3.0 -m "Release v1.3.0 - Bilingual Support

Features:
- Bilingual UI (Russian/English)
- Theme selection for exports
- Enhanced search capabilities"

# 4. Deploy
make rebuild-all
make deploy-prod
```

### 3. Мажорный релиз (Breaking Changes)

```bash
echo "2.0.0" > VERSION
npm version 2.0.0 --no-git-tag-version

git commit -am "chore: bump version to v2.0.0

BREAKING CHANGES:
- API endpoints restructured (/generate → /api/graph/generate)
- Authentication required for all requests
- Removed deprecated export formats"

git tag -a v2.0.0 -m "Release v2.0.0 - Major API Redesign

BREAKING CHANGES:
..."
```

## CI/CD Integration (Future)

### GitHub Actions Example

```yaml
name: Build and Deploy
on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Get version from tag
        id: version
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Build with version metadata
        run: |
          make rebuild-all VERSION=${{ steps.version.outputs.version }}

      - name: Create GitHub Release
        uses: actions/create-release@v1
        with:
          tag_name: v${{ steps.version.outputs.version }}
          release_name: Release v${{ steps.version.outputs.version }}
```

## Отображение версии в UI / Version Display in UI

### Footer Component

```tsx
import { useEffect, useState } from 'react';

export const Footer = () => {
  const [versionInfo, setVersionInfo] = useState(null);

  useEffect(() => {
    fetch('/api/version')
      .then((r) => r.json())
      .then(setVersionInfo);
  }, []);

  if (!versionInfo) return null;

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 py-4">
      <div className="container mx-auto text-center text-xs text-gray-500">
        <p>
          Pressograph v{versionInfo.version}
          {versionInfo.environment === 'development' && versionInfo.commit && (
            <span className="ml-2 text-orange-500">(dev+{versionInfo.commit.substring(0, 7)})</span>
          )}
        </p>
        {versionInfo.buildDate && <p className="mt-1">Built on {versionInfo.buildDate}</p>}
      </div>
    </footer>
  );
};
```

### Deployment Indicators

```tsx
// Production
Pressograph v1.2.0

// Development
Pressograph v1.2.0-dev+aa16350 (Built on 2025-10-31)

// Beta
Pressograph v1.3.0-beta.1 (Build #456)
```

## Changelog

Каждый релиз документируется в `/opt/projects/repositories/pressograph/CHANGELOG.md`:

```markdown
# Changelog

## [1.2.0] - 2025-10-31

### Added

- Theme selection for graph exports (light/dark/current)
- Comment field for graph history entries
- Full-text search in comments
- Regenerate functionality for saved graphs
- Language switcher (EN/RU)

### Fixed

- PNG encoding for Russian text (DejaVu fonts)
- PDF landscape orientation
- Long comment saving in database

### Changed

- History table layout improvements
- Actions consolidated into dropdown menu

## [1.1.0] - 2025-10-28

...
```

## Лучшие практики / Best Practices

1. **Единственный источник истины (Single Source of Truth)**
   - VERSION файл в корне проекта
   - package.json синхронизируется автоматически

2. **Git tags для всех релизов**
   - Формат: `v1.2.0` (с префиксом 'v')
   - Annotated tags с описанием релиза

3. **Метаданные для dev/beta сборок**
   - Всегда включать commit hash для отладки
   - Build date для отслеживания устаревших сборок

4. **Автоматизация**
   - Makefile для консистентных сборок
   - CI/CD для валидации версий

5. **Семантика коммитов**
   - `feat:` → MINOR версия
   - `fix:` → PATCH версия
   - `BREAKING CHANGE:` → MAJOR версия

## Ссылки / References

- [Semantic Versioning Specification](https://semver.org/)
- [Calendar Versioning](https://calver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## FAQ

**Q: Когда увеличивать MAJOR версию?**
A: Только при breaking changes в API или существенных изменениях UX, требующих от пользователей адаптации.

**Q: Можно ли использовать только git hash вместо версии?**
A: Нет, git hash не семантичен и неудобен для пользователей. Hash должен быть дополнением к SemVer.

**Q: Как версионировать API отдельно от frontend?**
A: Backend может иметь свой VERSION файл, но обычно frontend и backend версионируются вместе.

**Q: Нужно ли указывать версию в каждом package.json в монорепе?**
A: Да, но они могут ссылаться на общий VERSION файл через скрипты сборки.

---

**Текущая версия Pressograph:** v1.2.0
**Последнее обновление документа:** 2025-10-31
**Автор:** Pressograph Team
