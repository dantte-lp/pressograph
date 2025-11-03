#!/bin/bash
set -euo pipefail

echo "🚀 Setting up Pressograph development environment..."

cd "$(dirname "$0")/../.."

# Проверка наличия Podman
if ! command -v podman &> /dev/null; then
    echo "❌ Podman not found. Please install Podman first."
    exit 1
fi

if ! command -v podman-compose &> /dev/null; then
    echo "❌ podman-compose not found. Please install podman-compose first."
    exit 1
fi

# Build dev image with buildah
echo "📦 Building development image with buildah..."
buildah build \
    --layers \
    --format docker \
    -t pressograph-dev:latest \
    -f deploy/containerfiles/Containerfile.dev \
    .

# Create and start services
echo "🐳 Starting development containers..."
podman-compose -f deploy/compose/compose.dev.yaml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check services status
echo "📊 Services status:"
podman-compose -f deploy/compose/compose.dev.yaml ps

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "📝 Next steps:"
echo "   1. Enter development container:"
echo "      task dev:enter"
echo "   2. Install dependencies (inside container):"
echo "      pnpm install"
echo "   3. Run database migrations:"
echo "      pnpm db:push"
echo "   4. Start Next.js dev server:"
echo "      pnpm dev"
echo ""
echo "🌐 Services:"
echo "   - Next.js:        http://localhost:3000"
echo "   - Drizzle Studio: http://localhost:5555"
echo "   - PostgreSQL:     localhost:5432"
echo "   - Valkey:         localhost:6379"
echo ""
