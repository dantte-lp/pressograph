#!/bin/bash
set -e

echo "=== Pressograph Development Container Startup ==="
date

# Check if node_modules exists and has content
if [ ! -d "/workspace/node_modules" ] || [ -z "$(ls -A /workspace/node_modules 2>/dev/null)" ]; then
  echo "📦 Installing dependencies (node_modules is empty)..."
  cd /workspace
  # Try frozen-lockfile first, fall back to regular install if lockfile is outdated
  pnpm install --frozen-lockfile || {
    echo "⚠️ Lockfile outdated, running regular install..."
    pnpm install
  }
  echo "✅ Dependencies installed successfully"
else
  echo "✅ Dependencies already installed (skipping pnpm install)"
fi

# Run database health check
echo "🔍 Checking database connection..."
export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
timeout 60 bash -c 'until pg_isready -h ${DATABASE_HOST:-db} -p 5432 -U ${DATABASE_USER:-postgres}; do echo "⏳ Waiting for database..."; sleep 2; done' || {
  echo "⚠️ Database health check timeout - continuing anyway"
}
echo "✅ Database is ready"

# Run migrations if needed
echo "🔄 Running database migrations..."
cd /workspace
pnpm db:migrate || {
  echo "⚠️ Migrations failed or no migrations to run - continuing anyway"
}
echo "✅ Migrations completed"

# Create PM2 log directory
mkdir -p /tmp/pm2

# Start PM2 processes
echo "🚀 Starting application with PM2..."
cd /workspace

# Start PM2 with ecosystem config
pm2 start ecosystem.config.js

# Display PM2 status
pm2 list

echo ""
echo "=== Services Started Successfully ==="
echo "✅ Next.js Dev Server: http://localhost:3000"
echo "✅ Drizzle Studio: http://localhost:5555"
echo ""
echo "📊 View logs: pm2 logs"
echo "🛑 Stop services: pm2 stop all"
echo "🔄 Restart services: pm2 restart all"
echo ""
echo "=== Container is ready ==="

# Keep container running and follow PM2 logs
exec pm2 logs
