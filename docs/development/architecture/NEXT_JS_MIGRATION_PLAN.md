# Pressograph Next.js 16 Migration Plan

**Version**: 2.0.0
**Date**: 2025-11-03
**Status**: Planning Phase

---

## Executive Summary

Complete rewrite of Pressograph from Vite+React+Express to **Next.js 16 fullstack architecture** with integrated backend, modern UI/UX, and production-grade containerization.

### Migration Objectives

1. **Fullstack Architecture**: Migrate to Next.js 16 with App Router (no separate backend)
2. **Modern Stack**: React 19.2, TypeScript 5.9.3, TailwindCSS 4.1, shadcn v3.5
3. **Build System**: Replace Vite with Turbopack 2.6
4. **UI/UX Overhaul**: Implement design improvements from Technical Upgrade Manifesto
5. **Containerization**: Podman-based deployment with Node.js 24 + PostgreSQL 18
6. **Automation**: Taskfile instead of Makefile
7. **Project Management**: Full Scrum framework with GitHub integration

---

## Technology Stack Comparison

| Component                | Current (v1.2.0)             | Target (v2.0.0)                     |
| ------------------------ | ---------------------------- | ----------------------------------- |
| **Frontend Framework**   | React 19.2 + Vite 7.1.12     | Next.js 16 + React 19.2             |
| **Build Tool**           | Vite                         | Turbopack 2.6                       |
| **Backend**              | Express.js (separate server) | Next.js API Routes + Server Actions |
| **UI Library**           | HeroUI 2.8.5                 | shadcn v3.5                         |
| **CSS Framework**        | TailwindCSS 4.1.16           | TailwindCSS 4.1.16                  |
| **ORM**                  | None (direct PostgreSQL)     | Drizzle ORM                         |
| **State Management**     | Zustand 5.x                  | Zustand 5.x (client-side)           |
| **Internationalization** | Custom i18n                  | next-intl                           |
| **Authentication**       | JWT (Express middleware)     | NextAuth.js v5                      |
| **Container Runtime**    | Podman (Node.js 22)          | Podman (Node.js 24)                 |
| **Database**             | PostgreSQL 18                | PostgreSQL 18                       |
| **Task Runner**          | Makefile                     | Taskfile                            |

---

## Architecture Changes

### From: Separate Frontend + Backend

```
┌─────────────────┐      HTTP/REST     ┌─────────────────┐
│   Vite + React  │ ←─────────────────→ │ Express Backend │
│   (Port 5173)   │                     │   (Port 3001)   │
└─────────────────┘                     └─────────────────┘
                                               ↓
                                        ┌─────────────┐
                                        │ PostgreSQL  │
                                        │  (Port 5432)│
                                        └─────────────┘
```

### To: Unified Next.js Fullstack

```
┌─────────────────────────────────────────────────────┐
│              Next.js 16 Fullstack App               │
│  ┌──────────────────┐      ┌──────────────────────┐│
│  │ Server Components│      │   API Routes +       ││
│  │  + Client Pages  │      │  Server Actions      ││
│  └──────────────────┘      └──────────────────────┘│
│         (UI Layer)              (Backend Logic)     │
└───────────────────────────────────┬─────────────────┘
                                    ↓
                             ┌─────────────┐
                             │ PostgreSQL  │
                             │  (Port 5432)│
                             └─────────────┘
```

---

## Migration Sprints

### Sprint 1: Foundation Setup (2 weeks, 21 SP)

**Goal**: Initialize Next.js project with core dependencies

**User Stories**:

1. **US-1.1**: Initialize Next.js 16 project with App Router (3 SP)
2. **US-1.2**: Configure TypeScript 5.9.3 strict mode (2 SP)
3. **US-1.3**: Setup TailwindCSS 4.1 + shadcn v3.5 (5 SP)
4. **US-1.4**: Configure ESLint + Prettier (2 SP)
5. **US-1.5**: Setup i18n with next-intl (Russian/English) (5 SP)
6. **US-1.6**: Create base layout with theme provider (4 SP)

**Deliverables**:

- Working Next.js dev server
- Configured linting and formatting
- Basic dark/light theme switching
- Bilingual support infrastructure

---

### Sprint 2: Database & Authentication (2 weeks, 21 SP)

**Goal**: Establish data layer and user authentication

**User Stories**:

1. **US-2.1**: Setup Drizzle ORM with PostgreSQL 18 (5 SP)
2. **US-2.2**: Migrate database schema from current migrations (5 SP)
3. **US-2.3**: Implement NextAuth.js v5 with credentials provider (5 SP)
4. **US-2.4**: Create middleware for protected routes (3 SP)
5. **US-2.5**: Implement login/logout pages (3 SP)

**Deliverables**:

- Drizzle schema matching current database
- Working authentication flow
- Protected route middleware
- Login/logout UI with shadcn components

---

### Sprint 3: Core Graph Generation (2 weeks, 26 SP)

**Goal**: Migrate pressure test graph generation logic

**User Stories**:

1. **US-3.1**: Migrate Canvas API rendering utilities (8 SP)
2. **US-3.2**: Create graph configuration form (Server Component) (5 SP)
3. **US-3.3**: Implement graph generation Server Action (5 SP)
4. **US-3.4**: Add template presets (daily/extended tests) (3 SP)
5. **US-3.5**: Implement intermediate stages functionality (5 SP)

**Deliverables**:

- Working graph generation with Canvas API
- Template presets
- Intermediate test support
- Theme-aware graph rendering

---

### Sprint 4: Export & History (2 weeks, 21 SP)

**Goal**: Implement export functionality and test history

**User Stories**:

1. **US-4.1**: Implement PNG export with high resolution (5 SP)
2. **US-4.2**: Implement PDF export with jsPDF (5 SP)
3. **US-4.3**: Create history page with data table (5 SP)
4. **US-4.4**: Implement graph save functionality (3 SP)
5. **US-4.5**: Add pagination and filtering to history (3 SP)

**Deliverables**:

- Export to PNG/PDF
- History page with saved tests
- Pagination and search

---

### Sprint 5: Admin & Setup (2 weeks, 18 SP)

**Goal**: Admin dashboard and initial setup flow

**User Stories**:

1. **US-5.1**: Create admin dashboard layout (3 SP)
2. **US-5.2**: Implement user management CRUD (5 SP)
3. **US-5.3**: Create setup wizard for first-time users (5 SP)
4. **US-5.4**: Add system settings management (3 SP)
5. **US-5.5**: Implement audit logging (2 SP)

**Deliverables**:

- Admin dashboard
- User management
- Setup wizard
- System settings

---

### Sprint 6: UI/UX Refinement (2 weeks, 21 SP)

**Goal**: Implement design improvements from Technical Manifesto

**User Stories**:

1. **US-6.1**: Implement 4-step guided test configuration flow (8 SP)
2. **US-6.2**: Add contextual help tooltips (3 SP)
3. **US-6.3**: Optimize theme switching performance (3 SP)
4. **US-6.4**: Implement progressive disclosure for advanced options (3 SP)
5. **US-6.5**: Add keyboard navigation and accessibility (4 SP)

**Deliverables**:

- Guided workflow UI
- Contextual help system
- Optimized theme switching
- WCAG 2.1 AA compliance

---

### Sprint 7: Containerization & Deployment (2 weeks, 21 SP)

**Goal**: Production-ready Podman deployment

**User Stories**:

1. **US-7.1**: Create multi-stage Containerfile for Next.js (5 SP)
2. **US-7.2**: Write Podman Compose files (dev/prod) (5 SP)
3. **US-7.3**: Setup Turbopack build optimization (3 SP)
4. **US-7.4**: Implement health checks and graceful shutdown (3 SP)
5. **US-7.5**: Create Taskfile for automation (5 SP)

**Deliverables**:

- Production Containerfile
- Podman Compose configurations
- Taskfile for common operations
- Health monitoring

---

### Sprint 8: Testing & Documentation (2 weeks, 21 SP)

**Goal**: Comprehensive testing and documentation

**User Stories**:

1. **US-8.1**: Write unit tests for graph generation (5 SP)
2. **US-8.2**: Write integration tests for API routes (5 SP)
3. **US-8.3**: E2E tests with Playwright (5 SP)
4. **US-8.4**: Create developer documentation (3 SP)
5. **US-8.5**: Write deployment guide (3 SP)

**Deliverables**:

- Test coverage ≥60%
- E2E test suite
- Developer documentation
- Deployment guide

---

## Migration Strategy

### Phase 1: Parallel Development (Sprints 1-3)

- Create new Next.js app in `/opt/projects/repositories/pressograph-next`
- Keep old app running for reference
- No changes to production

### Phase 2: Feature Parity (Sprints 4-6)

- Complete feature migration
- Internal testing
- User acceptance testing

### Phase 3: Cutover (Sprint 7)

- Replace old app with new app at `/opt/projects/repositories/pressograph`
- Deploy to production
- Monitor for issues

### Phase 4: Optimization (Sprint 8)

- Performance tuning
- Final documentation
- Knowledge transfer

---

## Success Criteria

- [ ] All features from v1.2.0 migrated
- [ ] UI/UX improvements implemented
- [ ] Test coverage ≥60%
- [ ] Performance: First Contentful Paint < 1.5s
- [ ] Performance: Time to Interactive < 3s
- [ ] Zero data loss during migration
- [ ] 100% bilingual support (Russian/English)
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Production deployment successful
- [ ] Team trained on new stack

---

## Risks & Mitigation

| Risk                                | Impact | Probability | Mitigation                                       |
| ----------------------------------- | ------ | ----------- | ------------------------------------------------ |
| Canvas API incompatibility with SSR | High   | Medium      | Use dynamic imports, client-only components      |
| Theme switching performance issues  | Medium | Medium      | Memoization, CSS variables, Zustand optimization |
| Database migration data loss        | High   | Low         | Comprehensive backup, dry run migrations         |
| Learning curve (Next.js 16)         | Medium | High        | Team training, pair programming, documentation   |
| Turbopack build issues              | Medium | Medium      | Fallback to webpack, community support           |
| shadcn component gaps vs HeroUI     | Medium | Medium      | Custom components where needed                   |

---

## Rollback Plan

If critical issues occur:

1. **Immediate**: Restore from `/opt/backup/pressograph-YYYYMMDD-HHMMSS`
2. **Git**: Revert to `v1.2.0-legacy` tag
3. **Database**: Restore PostgreSQL backup
4. **Container**: Roll back to previous images
5. **DNS**: Point traffic to old deployment

**Maximum downtime tolerance**: 4 hours

---

## Team & Resources

**Required Skills**:

- Next.js 16 + App Router
- React Server Components
- TypeScript advanced types
- Drizzle ORM
- Podman containerization
- Scrum methodology

**Estimated Effort**: 16 weeks (8 sprints × 2 weeks)

**Team Composition**:

- 1 × Fullstack Developer (Next.js + React + Node.js)
- 1 × DevOps Engineer (Podman, PostgreSQL)
- 1 × UI/UX Designer (shadcn, Tailwind)
- 1 × QA Engineer (Testing, accessibility)
- 1 × Scrum Master / Product Owner

---

## References

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [NextAuth.js v5](https://authjs.dev/)
- [Turbopack Documentation](https://turbo.build/pack)
- [Project Genesis Tech Stack](../../../project-genesis/docs/TECHNOLOGY_STACK.md)
- [Technical Upgrade Manifesto](./Technical%20Upgrade%20Manifesto_%20Pressure%20Test%20Graph%20Generation%20System.docx.md)
- [Pressograph Next.js Migration & UI/UX Plan](./Pressograph%20Next.js%20Migration%20%26%20UI_UX%20Overhaul%20Plan.docx.md)

---

**Approved By**: _Pending_
**Start Date**: 2025-11-03
**Expected Completion**: 2026-02-28
