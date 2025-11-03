# Pressograph Development - Quick Start

## Initial Setup (Once)

```bash
cd /opt/projects/repositories/pressograph
./deploy/scripts/dev-setup.sh
```

Wait ~3 minutes for build and startup.

## Enter Container

```bash
./deploy/scripts/dev-enter.sh
```

You'll see:
```
╔════════════════════════════════════════════════════╗
║  🚀 Pressograph Development Container              ║
╚════════════════════════════════════════════════════╝

📍 Working directory: /workspace
🐘 PostgreSQL:        db:5432
🔴 Valkey:            cache:6379

Quick commands:
  pnpm dev           - Start Next.js dev server
  pnpm build         - Build for production
  pnpm db:push       - Push database schema
  pnpm db:studio     - Open Drizzle Studio
  pnpm lint          - Run ESLint
  pnpm type-check    - Run TypeScript checker
```

## First Time Inside Container

```bash
# 1. Install dependencies
pnpm install

# 2. Push database schema
pnpm db:push

# 3. Start dev server
pnpm dev
```

Open http://localhost:3000

## Daily Workflow

```bash
# Start containers (if stopped)
podman-compose -f deploy/compose/compose.dev.yaml start

# Enter container
./deploy/scripts/dev-enter.sh

# Inside container - start dev server
pnpm dev

# Work on your code (edit files on host)

# Exit container
exit

# Stop containers
podman-compose -f deploy/compose/compose.dev.yaml stop
```

## Common Commands (Inside Container)

```bash
pnpm dev              # Dev server on port 3000
pnpm build            # Production build
pnpm db:studio        # Database UI on port 5555
pnpm lint             # Lint code
pnpm type-check       # TypeScript check
```

## Shortcuts (Inside Container)

The following aliases are available:

- `dev` → `pnpm dev`
- `build` → `pnpm build`
- `lint` → `pnpm lint`
- `tc` → `pnpm type-check`
- `db` → `pnpm db:studio`

## Viewing Logs (On Host)

```bash
# All services
./deploy/scripts/dev-logs.sh

# Specific service
./deploy/scripts/dev-logs.sh workspace
./deploy/scripts/dev-logs.sh db
./deploy/scripts/dev-logs.sh cache
```

## Clean Restart

```bash
# Destroy everything
./deploy/scripts/dev-destroy.sh

# Setup from scratch
./deploy/scripts/dev-setup.sh
```

## Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Next.js | http://localhost:3000 | - |
| Drizzle Studio | http://localhost:5555 | - |
| PostgreSQL | localhost:5432 | postgres/postgres |
| Valkey | localhost:6379 | - |

## Troubleshooting

### Port already in use

```bash
# Check what's using ports
sudo lsof -i :3000
sudo lsof -i :5432

# Kill process or change ports in deploy/compose/compose.dev.yaml
```

### Container won't start

```bash
podman logs pressograph-dev-workspace
./deploy/scripts/dev-destroy.sh
./deploy/scripts/dev-setup.sh
```

### Database connection error

```bash
podman restart pressograph-dev-db
sleep 10  # Wait for DB to be ready
```

## More Info

- Full docs: [deploy/README.md](README.md)
- Development guide: [DEVELOPMENT.md](../DEVELOPMENT.md)
