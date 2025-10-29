#!/bin/bash
# Wrapper script for systemd to start Pressograph Dev with podman-compose
set -e

cd "$(dirname "$0")"

# Start Pressograph Dev
exec /usr/bin/podman-compose --file compose.dev.yaml --env-file .env.dev up -d --remove-orphans
