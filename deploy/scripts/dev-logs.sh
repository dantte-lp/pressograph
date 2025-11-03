#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/../.."

# Follow logs from all services
podman-compose -f deploy/compose/compose.dev.yaml logs -f "${@}"
