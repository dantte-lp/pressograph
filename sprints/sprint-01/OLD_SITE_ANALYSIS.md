# Old Site Analysis (v1.2.0)

**Source:** `/opt/backup/pressograph-20251103-051742`
**Date:** 2025-11-03

## Technology Stack (v1.x)

### Frontend
- **Framework:** Vite 7.1.12 + React 19.2.0
- **Language:** TypeScript 5.9.3
- **UI Library:** HeroUI 2.8.5 (Component library)
- **Styling:** TailwindCSS 4.1.16
- **Routing:** React Router DOM 7.9.4
- **State Management:** Zustand 5.0.8
- **Animations:** Framer Motion 12.23.24
- **PDF Export:** jsPDF 2.5.2
- **Notifications:** React Hot Toast 2.6.0
- **Date Handling:** date-fns 4.1.0

### Key Differences from v2.0
| Feature | v1.x | v2.0 |
|---------|------|------|
| **Framework** | Vite + React SPA | Next.js 16 (SSR/SSG) |
| **UI Library** | HeroUI 2.8.5 | Radix UI + shadcn/ui |
| **Routing** | React Router | Next.js App Router |
| **Auth** | None (client-side only) | NextAuth + PostgreSQL |
| **Database** | None | PostgreSQL 18 + Drizzle ORM |
| **Cache** | None | Valkey 9 (Redis) |
| **i18n** | Custom hook | next-intl |
| **Backend** | Separate Express server | Next.js API routes |

## Pages Structure

### 1. Home Page (`/src/pages/Home.tsx`)
**Purpose:** Main graph generation interface

**Features:**
- Test parameters form
- Pressure tests list management
- Template management (save/load)
- Preset buttons for quick setup
- Graph canvas with real-time rendering
- Export buttons (PDF, PNG, SVG)
- Unsaved changes warning

**Layout:**
- 3-column grid (lg screens)
- Left: Templates + Presets
- Middle: Parameters + Tests list
- Bottom: Graph canvas + Export

**Components Used:**
- `TestParametersForm`
- `PressureTestsList`
- `PresetButtons`
- `TemplateButtons`
- `GraphCanvas`
- `ExportButtons`

### 2. Setup Page (`/src/pages/Setup.tsx`)
**Purpose:** Test configuration and management

**Size:** 26KB (large, complex form)

**Likely Features:**
- Detailed test parameters
- Multiple test configuration
- Data input forms
- Validation logic

### 3. History Page (`/src/pages/History.tsx`)
**Purpose:** View and manage past pressure tests

**Size:** 48KB (most complex page)

**Likely Features:**
- Test history listing
- Search and filtering
- Pagination
- View/edit/delete operations
- Graph preview
- Export historical data

### 4. Profile Page (`/src/pages/Profile.tsx`)
**Purpose:** User profile management

**Size:** 3.1KB (simple)

**Features:**
- User information display
- Settings management
- Preferences

### 5. Login Page (`/src/pages/Login.tsx`)
**Purpose:** User authentication

**Size:** 4.8KB

**Features:**
- Login form
- Possibly registration
- Password reset?

### 6. Admin Page (`/src/pages/Admin.tsx`)
**Purpose:** Administrative functions

**Size:** 3.1KB

**Features:**
- User management?
- System settings?
- Data management?

### 7. Help Page (`/src/pages/Help.tsx`)
**Purpose:** User documentation and guides

**Size:** 23KB (comprehensive help)

**Features:**
- User guides
- FAQ
- Tutorial content
- Documentation

## Component Structure

### Components Directory
```
/src/components/
├── forms/
│   ├── TestParametersForm.tsx
│   ├── PressureTestsList.tsx
│   ├── PresetButtons.tsx
│   └── TemplateButtons.tsx
├── graph/
│   ├── GraphCanvas.tsx
│   └── ExportButtons.tsx
└── [other components]
```

### Core Features

#### 1. Graph Generation System
- **Canvas-based rendering** (HTML5 Canvas API)
- Multiple pressure tests on single graph
- Customizable axes, labels, grid
- Theme-aware (dark/light mode)
- High-resolution export

#### 2. Test Management
- Create/edit pressure tests
- Multiple test types
- Template system (save/load configurations)
- Preset configurations
- Test parameters validation

#### 3. Export Capabilities
- PDF export (jsPDF)
- PNG export (Canvas toDataURL)
- SVG export?
- Print functionality

#### 4. State Management (Zustand)
**Store:** `useTestStore`
- Test parameters
- Pressure tests list
- Graph settings
- isDirty flag (unsaved changes)
- Theme settings?

**Pattern Used:**
```typescript
const isDirty = useTestStore(useShallow((state) => state.isDirty));
```
✅ Already using `useShallow` optimization!

#### 5. Internationalization
**Custom i18n system:**
- Hook: `useLanguage()`
- Languages: Russian (primary), English
- Translation keys accessed via `t.keyName`

**Location:** `/src/i18n/`

#### 6. Services Layer
**Directory:** `/src/services/`
- API calls?
- Data persistence?
- Export services?

#### 7. Utilities
**Directory:** `/src/utils/`
- Helper functions
- Graph calculations
- Data transformations
- Validation utilities

## Migration Priority

### Phase 1: Foundation (Sprint 1)
1. ✅ Environment setup
2. ⏳ Theme system (HeroUI → shadcn/ui + next-themes)
3. ⏳ Authentication (Add NextAuth)
4. ⏳ Base UI components
5. ⏳ Layout and navigation

### Phase 2: Core Features (Sprint 2)
1. Graph rendering engine (Canvas API)
2. Test parameters form
3. Pressure tests management
4. State management (Zustand stores)
5. i18n integration (next-intl)

### Phase 3: Advanced Features (Sprint 3)
1. Template system
2. Preset configurations
3. Export functionality (PDF, PNG, SVG)
4. History management
5. Help/documentation

### Phase 4: Additional Pages (Sprint 4)
1. Setup page
2. Profile page
3. Admin dashboard
4. Help system

## Key Technical Decisions for v2.0

### 1. UI Component Migration
**Decision:** Migrate from HeroUI to Radix UI + shadcn/ui
**Reason:**
- Better Next.js integration
- More customizable
- Better TypeScript support
- Smaller bundle size
- Active maintenance

**Components to Rebuild:**
- Button
- Input, Textarea, Select
- Card
- Modal/Dialog
- Table
- Tabs
- Switch/Toggle
- Dropdown Menu
- Toast notifications (keep react-hot-toast)

### 2. State Management
**Decision:** Keep Zustand
**Reason:**
- Already working well
- v1.x uses `useShallow` optimization
- Simple, performant
- Good TypeScript support

**Stores Needed:**
- `useAuthStore` - User authentication state
- `useTestStore` - Test parameters and data
- `useGraphStore` - Graph settings and state
- `useUIStore` - UI preferences (theme, sidebar, etc.)

### 3. Routing Migration
**Decision:** Next.js App Router
**Reason:**
- Server-side rendering
- Built-in API routes
- Better SEO
- Improved performance
- File-based routing

**Route Mapping:**
```
v1.x Route          → v2.0 Route
/                   → /app/page.tsx (dashboard)
/home               → /app/generator/page.tsx
/setup              → /app/setup/page.tsx
/history            → /app/history/page.tsx
/profile            → /app/profile/page.tsx
/admin              → /app/admin/page.tsx
/help               → /app/help/page.tsx
/login              → /app/auth/signin/page.tsx
```

### 4. Authentication
**Decision:** Add NextAuth with PostgreSQL
**Reason:**
- Secure authentication
- Session management
- Multiple providers support
- Database-backed sessions
- API route protection

**Features to Add:**
- Email/password authentication
- Session persistence
- Protected routes
- User roles (admin, user)
- Password reset

### 5. Data Persistence
**Decision:** PostgreSQL + Drizzle ORM
**Reason:**
- Persistent test history
- User data storage
- Template management
- Audit trails

**Schema Needed:**
- Users
- Sessions (NextAuth)
- PressureTests
- Templates
- Presets
- ExportHistory

### 6. Internationalization
**Decision:** Migrate to next-intl
**Reason:**
- Better Next.js integration
- Server-side translation
- Better performance
- Type-safe translations

**Languages:**
- Russian (ru) - Primary
- English (en)

## Feature Parity Checklist

### Must Have (v2.0 MVP)
- [ ] Graph generation with Canvas API
- [ ] Test parameters form
- [ ] Multiple pressure tests
- [ ] Template save/load
- [ ] Preset configurations
- [ ] PDF export
- [ ] PNG export
- [ ] Dark/light theme
- [ ] Russian/English i18n
- [ ] User authentication
- [ ] Test history persistence

### Nice to Have (Future)
- [ ] SVG export
- [ ] Data import
- [ ] Advanced filtering
- [ ] Graph annotations
- [ ] Comparison view
- [ ] Report generation
- [ ] Email notifications
- [ ] API access

## Notes

### HeroUI Components in v1.x
v1.x used HeroUI 2.8.5 extensively. Key components:
- Card, CardHeader, CardBody, CardFooter
- Button, ButtonGroup
- Input, Textarea, Select
- Table, TableHeader, TableBody
- Modal, ModalContent
- Switch
- Divider
- Tabs

**Migration Strategy:**
- Replace with Radix UI primitives
- Use shadcn/ui components where possible
- Maintain similar API/props where feasible
- Keep visual consistency

### Zustand Store Pattern
v1.x already follows best practices:
```typescript
// ✅ Good: Using useShallow
const value = useTestStore(useShallow((state) => state.value));

// ❌ Avoid: Direct selector (causes re-renders)
const value = useTestStore((state) => state.value);
```

### Graph Canvas Performance
- v1.x uses native Canvas API
- High-res rendering with scale factor
- Theme-aware colors
- Must preserve this approach in v2.0

### Testing Infrastructure
v1.x has comprehensive testing:
- Vitest 4.0.5
- @testing-library/react 16.3.0
- @vitest/coverage-v8
- @vitest/ui

**v2.0 should match or exceed test coverage**

## Conclusion

The v1.x codebase is well-structured with modern React patterns. Key migration challenges:
1. HeroUI → Radix UI component migration
2. React Router → Next.js App Router
3. Client-side → SSR/SSG architecture
4. Adding authentication layer
5. Database integration for persistence

**Strong Points to Preserve:**
- Zustand state management with useShallow
- Canvas-based graph rendering
- Comprehensive testing
- i18n support
- Export functionality

**Estimated Migration Effort:**
- Sprint 1-2: Foundation + Core UI (2 weeks)
- Sprint 3-4: Graph engine + Features (2 weeks)
- Sprint 5-6: Advanced features + Polish (2 weeks)
- **Total:** 6 sprints (~12 weeks)
