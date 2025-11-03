# Package Manager Evaluation for Pressograph

**Date:** 2025-10-31
**Status:** RECOMMENDATION
**Decision:** Use **pnpm** for future development

---

## Executive Summary

After evaluating npm, pnpm, yarn, and bun, **pnpm is recommended** as the package manager for Pressograph due to:

1. **2-3x faster** installation than npm
2. **Disk space efficiency** (symlinked node_modules)
3. **Stricter dependency resolution** (better security)
4. **Easy migration** from npm (supports package-lock.json conversion)
5. **Production-ready** (used by Vue, Nuxt, Prisma, Microsoft)

---

## Comparison Matrix

| Feature                     | npm       | pnpm           | yarn      | bun       |
| --------------------------- | --------- | -------------- | --------- | --------- |
| **Speed**                   | Baseline  | 2-3x faster    | 2x faster | 5x faster |
| **Disk Usage**              | High      | Low (symlinks) | Medium    | Low       |
| **Maturity**                | Very High | High           | High      | Medium    |
| **Security**                | Good      | Better         | Good      | Good      |
| **Monorepo Support**        | Basic     | Excellent      | Good      | Good      |
| **Docker/Container**        | Excellent | Excellent      | Good      | Good      |
| **CI/CD Support**           | Universal | Excellent      | Good      | Growing   |
| **Migration Effort**        | N/A       | Easy           | Medium    | Easy      |
| **Ecosystem Compatibility** | 100%      | 100%           | 99%       | 95%       |

---

## Detailed Analysis

### 1. npm (Current)

**Pros:**

- Universal compatibility
- Default with Node.js
- Well-documented
- Works everywhere

**Cons:**

- Slowest installation
- Wasteful disk usage (duplicate packages)
- Flat node_modules can cause phantom dependencies

**Verdict:** Baseline. Works, but not optimal for modern development.

---

### 2. pnpm (RECOMMENDED)

**Pros:**

- **Speed:** 2-3x faster than npm due to content-addressable storage
- **Disk Space:** Saves gigabytes by using hard links/symlinks
- **Security:** Stricter resolution prevents phantom dependencies
- **Easy Migration:**
  ```bash
  pnpm import  # Converts package-lock.json to pnpm-lock.yaml
  pnpm install
  ```
- **Container Friendly:** Works perfectly in Podman/Docker
- **Production Ready:** Used by major projects (Vue 3, Nuxt 3, Prisma, Microsoft Edge DevTools)

**Cons:**

- Slightly different node_modules structure (symlinked)
- Requires pnpm installation (not default with Node.js)
- Some legacy tools may not understand symlinks (rare)

**Verdict:** BEST CHOICE for Pressograph.

---

### 3. Yarn (v4 Berry)

**Pros:**

- Fast (Plug'n'Play mode)
- Good monorepo support
- Zero-installs feature (commit .yarn folder)

**Cons:**

- Plug'n'Play requires .pnp.cjs (breaks some tools)
- Larger .yarn folder to commit
- Migration from npm requires more work
- v1 vs v4 confusion in ecosystem

**Verdict:** Good, but not better than pnpm for our use case.

---

### 4. bun

**Pros:**

- **Extremely fast** (5x faster than npm)
- All-in-one runtime (replaces Node.js, npm, bundler)
- Native TypeScript support

**Cons:**

- **Too new** (unstable APIs, breaking changes)
- Not all npm packages work
- Container images not as mature
- Ecosystem compatibility issues
- Production risk (not battle-tested like Node.js)

**Verdict:** Exciting technology, but **TOO RISKY** for production. Revisit in 2026.

---

## Migration Plan: npm → pnpm

### Phase 1: Evaluation (Current)

- [x] Install pnpm locally
- [ ] Test build with pnpm
- [ ] Test dev environment with pnpm
- [ ] Benchmark installation speed

### Phase 2: Migration

1. **Install pnpm globally:**

   ```bash
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   ```

2. **Convert package-lock.json to pnpm-lock.yaml:**

   ```bash
   pnpm import
   ```

3. **Install dependencies:**

   ```bash
   pnpm install
   ```

4. **Test builds:**

   ```bash
   pnpm run build
   cd server && pnpm run build
   ```

5. **Update Containerfiles:**

   **Frontend (deploy/Containerfile):**

   ```dockerfile
   FROM node:22-trixie-slim AS builder

   # Install pnpm
   RUN npm install -g pnpm@latest

   WORKDIR /app
   COPY package*.json pnpm-lock.yaml ./
   RUN pnpm install --frozen-lockfile --prefer-offline
   COPY . .
   RUN pnpm run build
   ```

   **Backend (server/Dockerfile):**

   ```dockerfile
   FROM node:22-trixie-slim AS builder

   # Install pnpm
   RUN npm install -g pnpm@latest

   WORKDIR /app
   COPY package*.json pnpm-lock.yaml ./
   RUN pnpm install --frozen-lockfile --prod
   ```

6. **Update compose.dev.yaml:**

   ```yaml
   frontend:
     command:
       - /bin/sh
       - -c
       - |
         npm install -g pnpm
         if [ ! -d node_modules ]; then
           pnpm install
         fi
         pnpm run dev -- --host 0.0.0.0
   ```

7. **Update package.json scripts (if needed):**

   ```json
   {
     "scripts": {
       "preinstall": "npx only-allow pnpm"
     }
   }
   ```

8. **Update CI/CD (if applicable):**

   ```yaml
   - name: Setup pnpm
     uses: pnpm/action-setup@v2
     with:
       version: 9
   ```

9. **Update .gitignore:**

   ```gitignore
   # pnpm
   .pnpm-store/
   .pnpm-debug.log
   ```

10. **Commit changes:**
    ```bash
    git add pnpm-lock.yaml .gitignore
    git rm package-lock.json
    git commit -m "Migrate from npm to pnpm for faster builds"
    ```

### Phase 3: Cleanup

- Remove `package-lock.json`
- Remove `.npm-cache` directories
- Update documentation

---

## Benchmarks (Expected)

| Operation                 | npm   | pnpm  | Improvement      |
| ------------------------- | ----- | ----- | ---------------- |
| `npm install` (cold)      | 60s   | 20s   | **3x faster**    |
| `npm install` (cached)    | 30s   | 8s    | **3.75x faster** |
| `npm ci`                  | 45s   | 15s   | **3x faster**    |
| Disk space (node_modules) | 500MB | 150MB | **70% savings**  |

---

## Recommendation

### IMMEDIATE ACTION: Stick with npm for now

**Reasons:**

1. Current deployment is broken - focus on getting it working first
2. Migration can be done AFTER successful deployment
3. npm works fine for current scale

### FUTURE ACTION: Migrate to pnpm (Q1 2026)

**Timeline:**

1. **Week 1:** Test pnpm in local development
2. **Week 2:** Update Containerfiles and test builds
3. **Week 3:** Deploy dev environment with pnpm
4. **Week 4:** Deploy production with pnpm (after validation)

---

## Decision

**Current (2025-10-31):** Use **npm** (already working, proven)
**Future (Q1 2026):** Migrate to **pnpm** (faster, more efficient)
**Avoid:** Yarn (no significant benefit), Bun (too risky)

---

## References

- [pnpm Documentation](https://pnpm.io/)
- [pnpm Benchmarks](https://pnpm.io/benchmarks)
- [Why pnpm? by Vue.js](https://github.com/vuejs/core/blob/main/.npmrc)
- [npm vs pnpm vs yarn](https://blog.logrocket.com/javascript-package-managers-compared/)
