#!/bin/bash
# Wrapper script for systemd to stop Pressograph Dev with podman-compose
set -e

cd "$(dirname "$0")"

# Stop Pressograph Dev
exec /usr/bin/podman-compose --file compose.dev.yaml --env-file .env.dev down
