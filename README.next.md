# Pressograph 2.0 - Next.js Migration

Modern fullstack pressure test graph generation system built with Next.js 16, React 19, and TypeScript 5.9.

---

## Quick Start

### Prerequisites

- **Node.js**: v24 LTS (required)
- **PostgreSQL**: v18
- **Podman**: Latest (for containerized deployment)
- **Task**: v3 (task automation - https://taskfile.dev)

### Installation

```bash
# Clone repository
git clone https://github.com/dantte-lp/pressograph.git
cd pressograph

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Technology Stack

| Category          | Technology  | Version    |
| ----------------- | ----------- | ---------- |
| **Framework**     | Next.js     | 16.0.0     |
| **Runtime**       | React       | 19.0.0     |
| **Language**      | TypeScript  | 5.9.3      |
| **Build Tool**    | Turbopack   | 2.6.x      |
| **UI Components** | shadcn/ui   | 3.5.x      |
| **CSS**           | TailwindCSS | 4.1.x      |
| **ORM**           | Drizzle     | 0.38.x     |
| **Database**      | PostgreSQL  | 18         |
| **Auth**          | NextAuth.js | 5.0.0-beta |
| **i18n**          | next-intl   | 3.26.x     |
| **State**         | Zustand     | 5.0.x      |
| **Container**     | Podman      | Latest     |

### Key Features

- **Fullstack Architecture**: Unified Next.js app with integrated backend
- **App Router**: Modern Next.js 16 routing with React Server Components
- **Type Safety**: Full TypeScript strict mode coverage
- **Internationalization**: Russian and English support
- **Dark Mode**: System-aware theme with smooth transitions
- **Accessibility**: WCAG 2.1 AA compliant
- **Canvas Rendering**: High-resolution pressure graph generation
- **Export**: PNG & PDF export capabilities
- **Authentication**: Secure user authentication with NextAuth.js v5
- **Database**: PostgreSQL with Drizzle ORM
- **Containerized**: Production-ready Podman deployment

---

## Project Structure

```
pressograph/
├── app/                      # Next.js App Router
│   ├── [locale]/            # Internationalization routes
│   │   ├── (auth)/         # Authentication pages
│   │   ├── (dashboard)/    # Protected dashboard routes
│   │   └── layout.tsx
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # shadcn components
│   ├── graph/              # Graph-related components
│   ├── forms/              # Form components
│   └── layout/             # Layout components
├── lib/
│   ├── db/                 # Database & Drizzle ORM
│   ├── auth/               # Authentication config
│   └── utils.ts            # Utility functions
├── messages/               # i18n translation files
│   ├── en.json
│   └── ru.json
├── public/                 # Static assets
├── docs/                   # Documentation
├── Containerfile.next      # Production container image
├── compose.next.yaml       # Podman Compose configuration
├── Taskfile.yml            # Task automation
└── package.json
```

---

## Development

### Available Commands

Using **npm**:

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code
npm run type-check   # TypeScript type checking
npm test             # Run tests
```

Using **Task** (recommended):

```bash
task                 # Show all available tasks
task dev             # Start dev server
task build           # Build production
task lint            # Lint code
task test            # Run tests
task db:migrate      # Run migrations
task db:studio       # Open Drizzle Studio
task compose:up      # Start with Podman Compose
```

See `Taskfile.yml` for full list of commands.

---

## Database

### Migrations

```bash
# Generate new migration
task db:generate

# Apply migrations
task db:migrate

# Open Drizzle Studio (visual database editor)
task db:studio
```

### Schema

Database schema is defined in `lib/db/schema.ts` using Drizzle ORM.

---

## Deployment

### Using Podman Compose (Recommended)

```bash
# Build and start all services
task compose:up

# View logs
task compose:logs

# Stop services
task compose:down
```

### Manual Container Build

```bash
# Build image
task container:build

# Run container
task container:run

# View logs
task container:logs
```

### Environment Variables

Required environment variables (`.env.local`):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pressograph

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Testing

```bash
# Run all tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage
```

---

## Migration from v1.x

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration instructions from the Vite+React version.

**Backup Location**: `/opt/backup/pressograph-20251103-051742`
**Legacy Version**: `v1.2.0-legacy` git tag

---

## Contributing

1. Check open issues in [GitHub Project](https://github.com/dantte-lp/pressograph/issues)
2. Follow Scrum methodology (see `.scrum-config`)
3. Follow coding standards (ESLint + Prettier configured)
4. Write tests for new features
5. Update documentation

### Sprint Planning

Current sprint: **Sprint 1 - Foundation Setup**

- Milestone: https://github.com/dantte-lp/pressograph/milestone/9
- Issues: #29-#34
- Story Points: 21
- Duration: 2 weeks

---

## Documentation

- **Migration Plan**: `docs/development/architecture/NEXT_JS_MIGRATION_PLAN.md`
- **Technical Manifesto**: `docs/development/architecture/Technical Upgrade Manifesto.md`
- **API Documentation**: `docs/api/`
- **Scrum Framework**: `docs/scrum/`

---

## License

MIT License - See [LICENSE](./LICENSE)

---

## Support

- **GitHub Issues**: https://github.com/dantte-lp/pressograph/issues
- **Documentation**: `docs/`
- **Wiki**: https://github.com/dantte-lp/pressograph/wiki

---

**Version**: 2.0.0-alpha
**Status**: In Development (Sprint 1)
**Last Updated**: 2025-11-03
