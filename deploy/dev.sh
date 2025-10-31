#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Pressograph Development Environment Deployment Script
# ═══════════════════════════════════════════════════════════════════
# Deploys development environment with Vite HMR and hot reload
#
# Usage:
#   ./deploy/dev.sh [options]
#
# Options:
#   --build      Build images before starting
#   --clean      Clean volumes before starting
#   --no-logs    Don't follow logs after startup
#   --help       Show this help message
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/compose/compose.dev.yaml"
ENV_FILE="$SCRIPT_DIR/compose/.env.dev"

# Options
BUILD_IMAGES=false
CLEAN_VOLUMES=false
FOLLOW_LOGS=true

# ═══════════════════════════════════════════════════════════════════
# Functions
# ═══════════════════════════════════════════════════════════════════

log_info() {
    echo -e "${CYAN}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

show_help() {
    cat << EOF
Pressograph Development Environment Deployment

Usage: $0 [options]

Options:
    --build      Build images before starting
    --clean      Clean volumes before starting
    --no-logs    Don't follow logs after startup
    --help       Show this help message

Examples:
    $0                  # Start dev environment
    $0 --build          # Build images and start
    $0 --clean --build  # Clean, build, and start

Environment:
    Domain:      https://dev-pressograph.infra4.dev
    Frontend:    Vite dev server (HMR enabled)
    Backend:     Node.js with nodemon (hot reload)
    Database:    PostgreSQL 18

EOF
    exit 0
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing=()

    if ! command -v podman &> /dev/null; then
        missing+=("podman")
    fi

    if ! command -v podman-compose &> /dev/null; then
        missing+=("podman-compose")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing[*]}"
        log_info "Install with: sudo apt-get install -y ${missing[*]}"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

check_network() {
    log_info "Checking Traefik network..."

    if ! podman network exists traefik-public 2>/dev/null; then
        log_warning "traefik-public network not found, creating..."
        podman network create traefik-public
        log_success "Network created"
    else
        log_success "Network exists"
    fi
}

check_env_file() {
    log_info "Checking environment file..."

    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "Create it with: make init-env-dev"
        exit 1
    fi

    # Check for required variables
    local required_vars=("POSTGRES_PASSWORD" "JWT_SECRET" "JWT_REFRESH_SECRET")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE" || grep -q "^${var}=.*GENERATE" "$ENV_FILE"; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing or not configured variables in $ENV_FILE:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        log_info "Run: make init-env-dev"
        exit 1
    fi

    log_success "Environment file validated"
}

build_images() {
    log_info "Building images..."

    # Note: For dev, we don't actually build images - we use node:lts-trixie directly
    # and mount source code for hot reload
    log_success "Using base images (no build required for dev)"
}

clean_volumes() {
    log_warning "Cleaning volumes..."

    podman-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v

    log_success "Volumes cleaned"
}

start_environment() {
    log_info "Starting development environment..."

    cd "$PROJECT_ROOT"
    podman-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    log_success "Development environment started"
}

wait_for_health() {
    log_info "Waiting for services to become healthy..."

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        local healthy=true

        # Check backend health
        if ! podman healthcheck run pressograph-dev-backend &>/dev/null; then
            healthy=false
        fi

        # Check frontend health
        if ! podman healthcheck run pressograph-dev-frontend &>/dev/null; then
            healthy=false
        fi

        # Check postgres health
        if ! podman healthcheck run pressograph-dev-postgres &>/dev/null; then
            healthy=false
        fi

        if [ "$healthy" = true ]; then
            log_success "All services are healthy"
            return 0
        fi

        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    log_warning "Services did not become healthy in time"
    log_info "Check logs with: podman-compose -f $COMPOSE_FILE logs"
    return 1
}

show_status() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Pressograph Development Environment - RUNNING${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}Access URLs:${NC}"
    echo -e "  Frontend:    https://dev-pressograph.infra4.dev"
    echo -e "  Backend API: https://dev-pressograph.infra4.dev/api"
    echo -e "  Health:      https://dev-pressograph.infra4.dev/api/health"
    echo ""
    echo -e "${CYAN}Features:${NC}"
    echo -e "  ✓ Vite HMR (Hot Module Replacement) - instant frontend updates"
    echo -e "  ✓ Nodemon - automatic backend restart on changes"
    echo -e "  ✓ Source code mounted - edit locally, see changes instantly"
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo -e "  View logs:      podman-compose -f $COMPOSE_FILE logs -f"
    echo -e "  Restart:        podman-compose -f $COMPOSE_FILE restart"
    echo -e "  Stop:           podman-compose -f $COMPOSE_FILE down"
    echo -e "  Status:         podman-compose -f $COMPOSE_FILE ps"
    echo ""
    echo -e "${CYAN}Or use Makefile:${NC}"
    echo -e "  make dev-logs   # Follow logs"
    echo -e "  make dev-restart # Restart services"
    echo -e "  make dev-stop   # Stop services"
    echo -e "  make status-dev # Show status"
    echo ""
}

follow_logs() {
    if [ "$FOLLOW_LOGS" = true ]; then
        log_info "Following logs (Ctrl+C to exit)..."
        echo ""
        podman-compose -f "$COMPOSE_FILE" logs -f
    fi
}

# ═══════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build)
                BUILD_IMAGES=true
                shift
                ;;
            --clean)
                CLEAN_VOLUMES=true
                shift
                ;;
            --no-logs)
                FOLLOW_LOGS=false
                shift
                ;;
            --help)
                show_help
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                ;;
        esac
    done

    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  Pressograph Development Environment Deployment${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""

    # Pre-flight checks
    check_prerequisites
    check_network
    check_env_file

    # Build if requested
    if [ "$BUILD_IMAGES" = true ]; then
        build_images
    fi

    # Clean if requested
    if [ "$CLEAN_VOLUMES" = true ]; then
        clean_volumes
    fi

    # Start environment
    start_environment

    # Wait for health
    wait_for_health || true

    # Show status
    show_status

    # Follow logs
    follow_logs
}

main "$@"
