#!/bin/bash
# Wrapper script for systemd to stop Observability Stack with podman-compose
set -e

cd "$(dirname "$0")"

# Stop Observability
exec /usr/bin/podman-compose --file compose.observability.yaml --env-file .env.observability --profile full down
