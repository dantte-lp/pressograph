# Pressograph - Quick Start Guide
## Tasks 2-5: Commit, Push, Build, Deploy, Continue Development

**Status:** Tasks 0-1 completed in previous session. Ready to proceed with commit and deployment.

---

## Current State

- ✅ Project cleaned up (~597 KB freed)
- ✅ Directory renamed: `pressure-test-visualizer` → `pressograph`
- ✅ package.json name updated to "pressograph"
- ✅ All documentation created (DEVELOPMENT_PLAN.md, CHANGELOG.md, etc.)
- ⏸️ Changes ready to commit (see git status below)

---

## Quick Start (One Command)

Execute the deployment script:

```bash
cd /opt/projects/repositories/pressograph
chmod +x complete-deployment.sh
./complete-deployment.sh
```

This script will:
1. Commit all changes with comprehensive message
2. Push to remote and create tag v1.2.0-sprint1
3. Build production images
4. Deploy to production
5. Verify deployment

---

## Manual Steps (If Script Fails)

### Task 2: Git Commit (2 minutes)

```bash
cd /opt/projects/repositories/pressograph

# Check what's changed
git status

# Stage all changes
git add -A

# Commit
git commit
```

**Paste this commit message:**
```
feat(project): implement Scrum framework, performance optimizations, and project cleanup

🎯 Scrum Implementation:
- Add DEVELOPMENT_PLAN.md with 6-sprint roadmap (850+ lines)
- Add DOCUMENTATION_ANALYSIS.md with gap analysis (600+ lines)
- Add SCRUM_IMPLEMENTATION_REPORT.md (500+ lines)
- Add CHANGELOG.md following Keep a Changelog format (200+ lines)
- Add CLEANUP_ANALYSIS.md documenting repository cleanup

⚡ Performance Optimizations:
- Optimize theme switching with debouncing (<50ms, was 200-500ms)
- Add React.memo to GraphCanvas component (~60% fewer re-renders)
- Optimize ExportButtons with useCallback and useShallow

🐛 Bug Fixes:
- Fix History page error toast (wrong message on load)
- Fix auth token retrieval (localStorage key mismatch)
- Fix Help page section navigation (element ID selector)
- Add missing i18n translations (fetchError, save keys)

✨ Features:
- Add Save button with unsaved changes warning
- Implement beforeunload warning for dirty state
- Add dirty state tracking in Zustand store
- Link Swagger UI in README

🧹 Project Cleanup:
- Rename project directory to match git repository name (pressograph)
- Remove outdated docs/TODO.md (superseded by DEVELOPMENT_PLAN.md)
- Remove legacy docker-compose.yml files
- Remove build artifacts (dist/, server/dist/)
- Remove empty directories and cache dirs
- Update package.json name to "pressograph"
- Space freed: ~597 KB

📊 GitHub Organization:
- Create 3 milestones (v1.2.0, v1.3.0, v1.4.0)
- Create 10+ labels (priority, components, sprints)
- Create/update 10 issues (#3-#10)

📈 Sprint 1 Progress:
- Completed 17/37 story points (46%)
- Issues #6, #7, #8, #9, #10 completed

Closes #6, #7, #8, #9, #10

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

### Task 3: Push to Remote (1 minute)

```bash
# Push commits
git push origin master

# Create tag
git tag -a v1.2.0-sprint1 -m "v1.2.0 Sprint 1 Partial - Scrum Implementation & Performance Optimizations

Sprint 1 Progress: 17/37 story points completed (46%)

✅ Completed:
- Scrum framework implementation
- Documentation analysis and cleanup
- Theme switching optimization (300-900% faster)
- GraphCanvas React.memo optimization
- Save button with dirty state tracking
- Help page navigation fix
- History page error fix
- CHANGELOG.md creation
- GitHub organization (issues, milestones, labels)
- Project cleanup and rename

📋 Remaining Sprint 1:
- Issue #3: PNG export authentication (5 points)
- Issue #5: Real login API (8 points)
- Documentation updates (2 points)
- Bundle size analysis (3 points)

Performance: Theme 200-500ms → <50ms, GraphCanvas re-renders -60%"

# Push tag
git push origin v1.2.0-sprint1

# Verify
git log --oneline -3
git tag -l
```

---

### Task 4: Build and Deploy (15 minutes)

```bash
cd /opt/projects/repositories/pressograph

# TypeScript check
npx tsc --noEmit

# Build frontend
npm run build

# Build images
podman build -f deploy/Dockerfile.frontend -t pressograph-frontend:1.2.0 -t pressograph-frontend:latest .
podman build -f deploy/Dockerfile.backend -t pressograph-backend:1.2.0 -t pressograph-backend:latest .

# Deploy
cd deploy/compose
podman-compose -f compose.prod.yaml --env-file .env.prod down
podman-compose -f compose.prod.yaml --env-file .env.prod up -d --build

# Wait for containers
sleep 30

# Check status
podman ps --filter "name=pressograph-" | grep -v "dev\|observability"
```

---

### Verification (2 minutes)

```bash
# Test production URL
curl -I https://pressograph.infra4.dev/

# Test API health
curl https://pressograph.infra4.dev/api/health

# Test setup endpoint
curl https://pressograph.infra4.dev/api/v1/setup/status

# Check container health
podman inspect pressograph-frontend | jq '.[0].State.Health'
podman inspect pressograph-backend | jq '.[0].State.Health'
```

**Expected Results:**
- Frontend: HTTP 200, serving HTML
- API health: `{"status": "healthy", "timestamp": "..."}`
- Setup status: `{"success": true, "initialized": false, ...}`
- Container health: `"Status": "healthy"`

---

## Task 5: Continue Development

### Next Sprint 1 Items (20 points remaining)

#### Priority 1: Issue #3 - PNG Export Authentication (5 points, 1 hour)

**File:** `src/services/api.service.ts:59`

**Change:**
```typescript
// Line 59 - UNCOMMENT the Authorization header:
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`, // UNCOMMENT THIS LINE
},
```

**Test:**
1. Login with admin credentials
2. Generate a graph
3. Click "Export PNG"
4. Verify backend receives Authorization header
5. Verify PNG downloads successfully

---

#### Priority 2: Issue #5 - Real Login API (8 points, 4 hours)

**File:** `src/pages/Login.tsx:26`

**Replace the handleSubmit function:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Invalid credentials');
    }

    const data = await response.json();

    // Store token in localStorage (matches auth storage key)
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        token: data.token,
        user: data.user,
        isAuthenticated: true,
      },
      version: 0,
    }));

    // Update Zustand store
    login(data.user);

    // Redirect to home
    navigate('/');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Login failed');
    toast.error(err instanceof Error ? err.message : 'Login failed');
  } finally {
    setLoading(false);
  }
};
```

**Add to imports:**
```typescript
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
```

**Test:**
1. Test valid credentials (admin/admin)
2. Test invalid credentials
3. Verify token storage in localStorage
4. Verify Zustand store update
5. Verify redirect after login
6. Test logout flow

---

#### Priority 3: Documentation Updates (2 points, 1 hour)

Update README.md with Scrum references:

```markdown
## Development

This project follows the Scrum agile methodology. See our detailed development plan for sprint schedules and task tracking.

### Documentation
- [Development Plan](./DEVELOPMENT_PLAN.md) - Sprint roadmap, user stories, and task tracking
- [Changelog](./CHANGELOG.md) - Version history and release notes
- [API Documentation](./docs/API_DESIGN.md) - RESTful API specification
- [Scrum Report](./SCRUM_IMPLEMENTATION_REPORT.md) - Scrum framework implementation details

### Sprints
- **Sprint 1 (Current):** v1.2.0 - Performance & Bug Fixes (17/37 points completed)
- **Sprint 2-3:** v1.3.0 - Help Page & History Management
- **Sprint 4-5:** v1.4.0 - Admin Dashboard & User Profile

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for detailed sprint breakdown.

### Contributing
1. Check [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for open tasks
2. Create a new branch: `git checkout -b feature/issue-number-description`
3. Follow conventional commit format: `feat:`, `fix:`, `docs:`, `chore:`
4. Submit PR referencing issue number
5. Ensure all tests pass and lint checks succeed
```

---

#### Priority 4: Bundle Size Analysis (3 points, 2 hours)

Install analyzer:
```bash
npm install -D rollup-plugin-visualizer
```

Update `vite.config.ts`:
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
});
```

Run analysis:
```bash
npm run build
# Opens dist/stats.html automatically
```

---

## Files Summary

### New Files (7):
- CHANGELOG.md (200+ lines)
- DEVELOPMENT_PLAN.md (850+ lines)
- DOCUMENTATION_ANALYSIS.md (600+ lines)
- PERFORMANCE_ANALYSIS.md (369 lines)
- SCRUM_IMPLEMENTATION_REPORT.md (500+ lines)
- CLEANUP_ANALYSIS.md (analysis + cleanup)
- SESSION_REPORT.md (task details)
- complete-deployment.sh (deployment script)
- QUICK_START.md (this file)

### Modified Files (13):
- README.md (added Swagger UI link)
- package.json (name: "pressograph")
- src/App.tsx (theme debouncing)
- src/components/graph/ExportButtons.tsx (save button)
- src/components/graph/GraphCanvas.tsx (React.memo)
- src/i18n/locales/en.ts (translations)
- src/i18n/locales/ru.ts (translations)
- src/pages/Help.tsx (navigation fix)
- src/pages/History.tsx (error toast fix)
- src/pages/Home.tsx (beforeunload warning)
- src/services/api.service.ts (auth token fix)
- src/store/useTestStore.ts (dirty state)
- deploy/compose/compose.prod.yaml (healthchecks)

### Deleted Files (15+):
- docs/TODO.md
- deploy/compose/docker-compose.*.yml
- dist/ directory
- server/dist/ directory
- config/ directory
- 13 empty directories

---

## Support

- **Production:** https://pressograph.infra4.dev
- **Dev:** https://dev-pressograph.infra4.dev
- **API Docs:** https://pressograph.infra4.dev/api-docs
- **GitHub:** https://github.com/dantte-lp/pressograph
- **Issues:** https://github.com/dantte-lp/pressograph/issues

---

## Estimated Time

- **Task 2 (Commit):** 2 minutes
- **Task 3 (Push):** 1 minute
- **Task 4 (Build/Deploy):** 15 minutes
- **Verification:** 2 minutes
- **Total:** ~20 minutes

**Sprint 1 Completion:** 8 hours (Issues #3, #5, docs, bundle analysis)

---

**Ready to proceed!** Execute `./complete-deployment.sh` or follow manual steps above.
