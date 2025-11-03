# Development Guide

## Quick Start

### 1. Setup (First Time)

```bash
cd /opt/projects/repositories/pressograph
./deploy/scripts/dev-setup.sh
```

Это создаст и запустит:
- Development container (Node.js + tools)
- PostgreSQL 18
- Valkey (Redis)

### 2. Enter Container

```bash
./deploy/scripts/dev-enter.sh
```

### 3. Install Dependencies

```bash
# Внутри контейнера
pnpm install
```

### 4. Setup Database

```bash
# Внутри контейнера
pnpm db:push
```

### 5. Start Development Server

```bash
# Внутри контейнера
pnpm dev
```

Приложение доступно на http://localhost:3000

## Daily Workflow

### Start Working

```bash
# На хосте
cd /opt/projects/repositories/pressograph

# Запустить контейнеры (если остановлены)
podman-compose -f deploy/compose/compose.dev.yaml start

# Войти в контейнер
./deploy/scripts/dev-enter.sh

# Внутри контейнера
pnpm dev
```

### Stop Working

```bash
# На хосте
podman-compose -f deploy/compose/compose.dev.yaml stop
```

## Common Commands

### Inside Container

```bash
pnpm dev              # Start Next.js dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run linter
pnpm type-check       # TypeScript check
pnpm test             # Run tests

pnpm db:push          # Push schema changes
pnpm db:studio        # Open Drizzle Studio (port 5555)
pnpm db:generate      # Generate migrations
```

### On Host

```bash
# View logs
./deploy/scripts/dev-logs.sh

# Restart containers
podman-compose -f deploy/compose/compose.dev.yaml restart

# Destroy everything (clean slate)
./deploy/scripts/dev-destroy.sh
```

## Available Services

- **Next.js**: http://localhost:3000
- **Drizzle Studio**: http://localhost:5555
- **PostgreSQL**: localhost:5432
  - User: `postgres`
  - Password: `postgres`
  - Database: `pressograph`
- **Valkey**: localhost:6379

## Database Access

### From Container

```bash
# Using connection string (recommended)
pnpm db:studio

# Direct psql
PGPASSWORD=postgres psql -h db -U postgres -d pressograph
```

### From Host

```bash
podman exec -it pressograph-dev-db psql -U postgres -d pressograph
```

## Troubleshooting

### Container not starting

```bash
# Check logs
podman logs pressograph-dev-workspace

# Rebuild
./deploy/scripts/dev-destroy.sh
./deploy/scripts/dev-setup.sh
```

### Database connection failed

```bash
# Check database health
podman exec pressograph-dev-db pg_isready -U postgres

# Restart database
podman restart pressograph-dev-db
```

### Port already in use

```bash
# Find what's using the port
sudo lsof -i :3000
sudo lsof -i :5432
sudo lsof -i :6379

# Kill or change ports in deploy/compose/compose.dev.yaml
```

## Environment Variables

Set in `deploy/compose/compose.dev.yaml`:

```yaml
DATABASE_URL: postgresql://postgres:postgres@db:5432/pressograph
REDIS_URL: redis://cache:6379
NEXTAUTH_URL: http://localhost:3000
NEXTAUTH_SECRET: dev-secret-change-in-production
```

## File Structure

All changes to files on the host are immediately reflected in the container (hot reload).

```
/opt/projects/repositories/pressograph  (host)
                                        ↕
/workspace                              (container)
```

## Tips

1. **Always work inside the container** for consistency
2. **Edit files on host** with your favorite editor
3. **Use zsh aliases**: `dev`, `build`, `lint`, `tc`, `test`, `db`
4. **Database migrations**: Always use `pnpm db:push` in development
5. **Clean start**: Run `./deploy/scripts/dev-destroy.sh` then `./deploy/scripts/dev-setup.sh`

## More Information

See [deploy/README.md](/opt/projects/repositories/pressograph/deploy/README.md) for detailed documentation.
