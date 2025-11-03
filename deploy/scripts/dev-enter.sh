#!/bin/bash
set -euo pipefail

# Enter development container as developer user
podman exec -it -u developer -w /workspace pressograph-dev-workspace zsh
