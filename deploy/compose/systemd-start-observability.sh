#!/bin/bash
# Wrapper script for systemd to start Observability Stack with podman-compose
set -e

cd "$(dirname "$0")"

# Start Observability with full profile
exec /usr/bin/podman-compose --file compose.observability.yaml --env-file .env.observability --profile full up -d --remove-orphans
