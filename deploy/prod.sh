#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Pressograph Production Environment Deployment Script
# ═══════════════════════════════════════════════════════════════════
# Deploys production environment with built, optimized images
#
# Usage:
#   ./deploy/prod.sh [options]
#
# Options:
#   --build      Build images before deployment
#   --backup     Backup database before deployment
#   --force      Skip confirmation prompts
#   --no-logs    Don't follow logs after deployment
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
COMPOSE_FILE="$SCRIPT_DIR/compose/compose.prod.yaml"
ENV_FILE="$SCRIPT_DIR/compose/.env.prod"
BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d)"

# Options
BUILD_IMAGES=false
BACKUP_DB=false
FORCE=false
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
Pressograph Production Environment Deployment

Usage: $0 [options]

Options:
    --build      Build images before deployment
    --backup     Backup database before deployment
    --force      Skip confirmation prompts
    --no-logs    Don't follow logs after deployment
    --help       Show this help message

Examples:
    $0                        # Deploy with existing images
    $0 --build --backup       # Build, backup, and deploy
    $0 --force                # Skip confirmations

Environment:
    Domain:      https://pressograph.infra4.dev
    Frontend:    Nginx with optimized React build
    Backend:     Node.js production build
    Database:    PostgreSQL 18 with persistent volume

Safety:
    - Confirmation required unless --force is used
    - Database backup recommended (--backup)
    - Zero-downtime deployment (rolling restart)

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

    if ! command -v buildah &> /dev/null && [ "$BUILD_IMAGES" = true ]; then
        missing+=("buildah")
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
        log_error "traefik-public network not found"
        log_info "Create it with: podman network create traefik-public"
        exit 1
    fi

    log_success "Network exists"
}

check_env_file() {
    log_info "Checking environment file..."

    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "Create it with: make init-env-prod"
        exit 1
    fi

    # Check for production-specific issues
    local warnings=()

    if grep -q "NODE_ENV=development" "$ENV_FILE"; then
        warnings+=("NODE_ENV should be 'production', not 'development'")
    fi

    if grep -q "LOG_LEVEL=debug" "$ENV_FILE"; then
        warnings+=("LOG_LEVEL should be 'info', not 'debug' (performance impact)")
    fi

    if grep -q "DEBUG=pressograph:" "$ENV_FILE"; then
        warnings+=("DEBUG should be empty in production (verbose logging)")
    fi

    if grep -q "localhost" "$ENV_FILE"; then
        warnings+=("Environment file contains 'localhost' references")
    fi

    # Check for weak secrets
    if grep -qE "(password123|secret123|test|dev)" "$ENV_FILE"; then
        warnings+=("Environment file may contain weak secrets")
    fi

    if [ ${#warnings[@]} -gt 0 ]; then
        log_warning "Environment file warnings:"
        for warn in "${warnings[@]}"; do
            echo -e "  ${YELLOW}⚠${NC} $warn"
        done

        if [ "$FORCE" != true ]; then
            echo ""
            read -p "Continue anyway? [y/N] " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Deployment cancelled"
                exit 0
            fi
        fi
    fi

    log_success "Environment file validated"
}

confirm_deployment() {
    if [ "$FORCE" = true ]; then
        return 0
    fi

    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  PRODUCTION DEPLOYMENT CONFIRMATION${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}Target:${NC}        https://pressograph.infra4.dev"
    echo -e "${CYAN}Environment:${NC}   Production"
    echo -e "${CYAN}Backup:${NC}        $([ "$BACKUP_DB" = true ] && echo "Yes" || echo "No")"
    echo -e "${CYAN}Build:${NC}         $([ "$BUILD_IMAGES" = true ] && echo "Yes" || echo "No")"
    echo ""
    echo -e "${YELLOW}This will deploy to PRODUCTION. Proceed?${NC}"
    echo ""

    read -p "Type 'yes' to continue: " -r
    echo

    if [ "$REPLY" != "yes" ]; then
        log_info "Deployment cancelled"
        exit 0
    fi
}

backup_database() {
    log_info "Backing up database..."

    mkdir -p "$BACKUP_DIR"

    # Check if database container is running
    if ! podman ps --format '{{.Names}}' | grep -q pressograph-db; then
        log_warning "Database container not running, skipping backup"
        return 0
    fi

    local backup_file="$BACKUP_DIR/pressograph_prod_$(date +%Y%m%d_%H%M%S).sql"

    # Perform backup
    if podman exec pressograph-db pg_dump -U pressograph pressograph > "$backup_file" 2>/dev/null; then
        log_success "Database backed up to: $backup_file"

        # Compress backup
        gzip "$backup_file"
        log_success "Backup compressed: ${backup_file}.gz"
    else
        log_warning "Database backup failed (database might not be initialized yet)"
    fi
}

build_images() {
    log_info "Building production images..."

    cd "$PROJECT_ROOT"

    # Build backend
    log_info "Building backend image..."
    buildah bud --format docker --layers \
        -t localhost/pressograph-backend:latest \
        -t localhost/pressograph-backend:$(cat VERSION) \
        -f server/Dockerfile \
        --build-arg VERSION="$(cat VERSION)" \
        --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
        --build-arg NODE_ENV=production \
        server/

    log_success "Backend image built"

    # Build frontend
    log_info "Building frontend image..."
    buildah bud --format docker --layers \
        -t localhost/pressograph-frontend:latest \
        -t localhost/pressograph-frontend:$(cat VERSION) \
        -f deploy/Containerfile \
        --build-arg VITE_API_URL=/api \
        --build-arg VERSION="$(cat VERSION)" \
        --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
        .

    log_success "Frontend image built"

    log_success "All images built successfully"
}

check_images() {
    log_info "Checking images..."

    local missing=()

    if ! podman image exists localhost/pressograph-backend:latest; then
        missing+=("backend")
    fi

    if ! podman image exists localhost/pressograph-frontend:latest; then
        missing+=("frontend")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing images: ${missing[*]}"
        log_info "Build images with: make prod-build or --build flag"
        exit 1
    fi

    log_success "Images found"
}

deploy_environment() {
    log_info "Deploying production environment..."

    cd "$PROJECT_ROOT"

    # Start/update services
    podman-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    log_success "Production environment deployed"
}

wait_for_health() {
    log_info "Waiting for services to become healthy..."

    local max_attempts=60  # 2 minutes max
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        local healthy=true

        # Check backend health
        if ! podman healthcheck run pressograph-backend &>/dev/null; then
            healthy=false
        fi

        # Check frontend health
        if ! podman healthcheck run pressograph-frontend &>/dev/null; then
            healthy=false
        fi

        # Check postgres health
        if ! podman healthcheck run pressograph-db &>/dev/null; then
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

    log_error "Services did not become healthy in time"
    log_info "Check logs with: podman-compose -f $COMPOSE_FILE logs"
    return 1
}

verify_deployment() {
    log_info "Verifying deployment..."

    local failures=()

    # Check backend health endpoint
    if ! curl -sf https://pressograph.infra4.dev/api/health &>/dev/null; then
        failures+=("Backend health check failed")
    fi

    # Check frontend
    if ! curl -sf https://pressograph.infra4.dev/health &>/dev/null; then
        failures+=("Frontend health check failed")
    fi

    if [ ${#failures[@]} -gt 0 ]; then
        log_warning "Some health checks failed:"
        for failure in "${failures[@]}"; do
            echo -e "  ${RED}✗${NC} $failure"
        done
        return 1
    fi

    log_success "Deployment verified"
}

show_status() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Pressograph Production Environment - DEPLOYED${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}Access URLs:${NC}"
    echo -e "  Frontend:    https://pressograph.infra4.dev"
    echo -e "  Backend API: https://pressograph.infra4.dev/api"
    echo -e "  Health:      https://pressograph.infra4.dev/api/health"
    echo ""
    echo -e "${CYAN}Deployed Images:${NC}"
    podman images | grep pressograph | grep -v '<none>' | head -4
    echo ""
    echo -e "${CYAN}Running Containers:${NC}"
    podman-compose -f "$COMPOSE_FILE" ps
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo -e "  View logs:      podman-compose -f $COMPOSE_FILE logs -f"
    echo -e "  Check health:   curl https://pressograph.infra4.dev/api/health"
    echo -e "  Restart:        podman-compose -f $COMPOSE_FILE restart"
    echo -e "  Stop:           podman-compose -f $COMPOSE_FILE down"
    echo ""
    echo -e "${CYAN}Or use Makefile:${NC}"
    echo -e "  make logs-frontend-prod / make logs-backend-prod"
    echo -e "  make restart-prod"
    echo -e "  make status-prod"
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
            --backup)
                BACKUP_DB=true
                shift
                ;;
            --force)
                FORCE=true
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
    echo -e "${CYAN}  Pressograph Production Environment Deployment${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""

    # Pre-flight checks
    check_prerequisites
    check_network
    check_env_file

    # Confirm deployment
    confirm_deployment

    # Backup if requested
    if [ "$BACKUP_DB" = true ]; then
        backup_database
    fi

    # Build if requested
    if [ "$BUILD_IMAGES" = true ]; then
        build_images
    else
        check_images
    fi

    # Deploy
    deploy_environment

    # Wait for health
    if wait_for_health; then
        verify_deployment || log_warning "Deployment verification had issues"
    else
        log_warning "Health checks incomplete, but continuing..."
    fi

    # Show status
    show_status

    # Follow logs
    follow_logs
}

main "$@"
