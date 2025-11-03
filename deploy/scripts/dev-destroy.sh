#!/bin/bash
set -euo pipefail

echo "🧹 Cleaning up development environment..."

cd "$(dirname "$0")/../.."

# Stop and remove containers
echo "🛑 Stopping containers..."
podman-compose -f deploy/compose/compose.dev.yaml down -v

# Remove dev image
echo "🗑️ Removing development image..."
podman rmi -f pressograph-dev:latest 2>/dev/null || true

# Remove volumes
echo "📦 Removing volumes..."
podman volume rm -f \
    pressograph-dev-postgres-data \
    pressograph-dev-cache-data \
    pressograph-dev-node-modules \
    pressograph-dev-next-cache \
    pressograph-dev-pnpm-store \
    2>/dev/null || true

# Remove network
echo "🌐 Removing network..."
podman network rm -f pressograph-dev-network 2>/dev/null || true

echo "✅ Cleanup complete!"
