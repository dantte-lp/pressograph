#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Pressograph Health Check Script
# ═══════════════════════════════════════════════════════════════════
# Comprehensive health checking for all services
#
# Usage:
#   ./deploy/health-check.sh [environment]
#
# Arguments:
#   environment  dev or prod (default: prod)
#
# Exit Codes:
#   0  All checks passed
#   1  Some checks failed
#   2  Critical failures
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-prod}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Environment-specific configuration
if [ "$ENVIRONMENT" = "dev" ]; then
    DOMAIN="dev-pressograph.infra4.dev"
    CONTAINER_PREFIX="pressograph-dev"
    COMPOSE_FILE="$SCRIPT_DIR/compose/compose.dev.yaml"
    ENV_FILE="$SCRIPT_DIR/compose/.env.dev"
else
    DOMAIN="pressograph.infra4.dev"
    CONTAINER_PREFIX="pressograph"
    COMPOSE_FILE="$SCRIPT_DIR/compose/compose.prod.yaml"
    ENV_FILE="$SCRIPT_DIR/compose/.env.prod"
fi

# Counters
CHECKS_TOTAL=0
CHECKS_PASSED=0
CHECKS_WARNING=0
CHECKS_FAILED=0

# ═══════════════════════════════════════════════════════════════════
# Functions
# ═══════════════════════════════════════════════════════════════════

log_info() {
    echo -e "${CYAN}[INFO]${NC} $*"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $*"
    ((CHECKS_PASSED++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $*"
    ((CHECKS_WARNING++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $*"
    ((CHECKS_FAILED++))
}

check_result() {
    ((CHECKS_TOTAL++))
    if [ $? -eq 0 ]; then
        log_pass "$1"
    else
        log_fail "$1"
    fi
}

# ═══════════════════════════════════════════════════════════════════
# Health Checks
# ═══════════════════════════════════════════════════════════════════

check_container_status() {
    local container=$1
    local service=$2

    ((CHECKS_TOTAL++))

    if podman ps --format '{{.Names}}' | grep -q "^${container}$"; then
        local status=$(podman ps --filter "name=^${container}$" --format '{{.Status}}')

        if echo "$status" | grep -q "Up"; then
            log_pass "$service container is running"
            return 0
        else
            log_fail "$service container exists but is not running: $status"
            return 1
        fi
    else
        log_fail "$service container not found: $container"
        return 1
    fi
}

check_container_health() {
    local container=$1
    local service=$2

    ((CHECKS_TOTAL++))

    if podman healthcheck run "$container" &>/dev/null; then
        log_pass "$service health check passed"
        return 0
    else
        log_fail "$service health check failed"
        return 1
    fi
}

check_http_endpoint() {
    local url=$1
    local description=$2
    local expected_code=${3:-200}

    ((CHECKS_TOTAL++))

    local response_code=$(curl -o /dev/null -s -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$response_code" = "$expected_code" ]; then
        log_pass "$description (HTTP $response_code)"
        return 0
    else
        log_fail "$description (expected HTTP $expected_code, got $response_code)"
        return 1
    fi
}

check_json_health() {
    local url=$1
    local description=$2

    ((CHECKS_TOTAL++))

    local response=$(curl -s "$url" 2>/dev/null || echo '{}')
    local status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

    if [ "$status" = "healthy" ] || [ "$status" = "ok" ]; then
        log_pass "$description (status: $status)"
        return 0
    else
        log_fail "$description (status: ${status:-unknown})"
        return 1
    fi
}

check_resource_usage() {
    local container=$1
    local service=$2

    ((CHECKS_TOTAL++))

    # Get memory usage in MB
    local mem_usage=$(podman stats --no-stream --format "{{.MemUsage}}" "$container" 2>/dev/null | cut -d'/' -f1 | sed 's/[^0-9.]//g')
    local mem_limit=$(podman stats --no-stream --format "{{.MemUsage}}" "$container" 2>/dev/null | cut -d'/' -f2 | sed 's/[^0-9.]//g' | head -c 4)

    if [ -n "$mem_usage" ]; then
        local mem_percent=$(awk "BEGIN {printf \"%.0f\", ($mem_usage / $mem_limit) * 100}")

        if [ "$mem_percent" -lt 80 ]; then
            log_pass "$service memory usage: ${mem_usage}MB / ${mem_limit}MB (${mem_percent}%)"
            return 0
        elif [ "$mem_percent" -lt 90 ]; then
            log_warning "$service memory usage high: ${mem_usage}MB / ${mem_limit}MB (${mem_percent}%)"
            return 0
        else
            log_fail "$service memory usage critical: ${mem_usage}MB / ${mem_limit}MB (${mem_percent}%)"
            return 1
        fi
    else
        log_warning "$service memory usage: unable to determine"
        return 0
    fi
}

check_disk_space() {
    ((CHECKS_TOTAL++))

    local usage=$(df -h "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$usage" -lt 80 ]; then
        log_pass "Disk space usage: ${usage}%"
        return 0
    elif [ "$usage" -lt 90 ]; then
        log_warning "Disk space usage high: ${usage}%"
        return 0
    else
        log_fail "Disk space usage critical: ${usage}%"
        return 1
    fi
}

check_traefik_network() {
    ((CHECKS_TOTAL++))

    if podman network exists traefik-public 2>/dev/null; then
        log_pass "Traefik network exists"
        return 0
    else
        log_fail "Traefik network not found"
        return 1
    fi
}

check_database_connectivity() {
    local container="${CONTAINER_PREFIX}-postgres"

    ((CHECKS_TOTAL++))

    if podman exec "$container" pg_isready -U pressograph &>/dev/null; then
        log_pass "Database accepts connections"
        return 0
    else
        log_fail "Database does not accept connections"
        return 1
    fi
}

check_ssl_certificate() {
    ((CHECKS_TOTAL++))

    local cert_info=$(echo | openssl s_client -connect "${DOMAIN}:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

    if [ -n "$cert_info" ]; then
        local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        log_pass "SSL certificate valid until: $expiry_date"
        return 0
    else
        log_warning "Unable to verify SSL certificate"
        return 0
    fi
}

# ═══════════════════════════════════════════════════════════════════
# Main Health Check Sequence
# ═══════════════════════════════════════════════════════════════════

main() {
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  Pressograph Health Check - ${ENVIRONMENT^^} Environment${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""

    # Infrastructure checks
    log_info "Checking infrastructure..."
    check_traefik_network
    check_disk_space
    echo ""

    # Container status checks
    log_info "Checking container status..."
    check_container_status "${CONTAINER_PREFIX}-postgres" "PostgreSQL"
    check_container_status "${CONTAINER_PREFIX}-backend" "Backend"
    check_container_status "${CONTAINER_PREFIX}-frontend" "Frontend"
    echo ""

    # Container health checks
    log_info "Checking container health..."
    check_container_health "${CONTAINER_PREFIX}-postgres" "PostgreSQL"
    check_container_health "${CONTAINER_PREFIX}-backend" "Backend"
    check_container_health "${CONTAINER_PREFIX}-frontend" "Frontend"
    echo ""

    # Database connectivity
    log_info "Checking database connectivity..."
    check_database_connectivity
    echo ""

    # HTTP endpoint checks
    log_info "Checking HTTP endpoints..."
    check_http_endpoint "https://${DOMAIN}" "Frontend homepage"
    check_http_endpoint "https://${DOMAIN}/health" "Frontend health"
    check_http_endpoint "https://${DOMAIN}/api/health" "Backend health"
    check_json_health "https://${DOMAIN}/api/health" "Backend health JSON"
    echo ""

    # SSL certificate check
    log_info "Checking SSL certificate..."
    check_ssl_certificate
    echo ""

    # Resource usage checks
    log_info "Checking resource usage..."
    check_resource_usage "${CONTAINER_PREFIX}-postgres" "PostgreSQL"
    check_resource_usage "${CONTAINER_PREFIX}-backend" "Backend"
    check_resource_usage "${CONTAINER_PREFIX}-frontend" "Frontend"
    echo ""

    # Summary
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  Health Check Summary${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Total checks:     $CHECKS_TOTAL"
    echo -e "${GREEN}Passed:           $CHECKS_PASSED${NC}"
    if [ $CHECKS_WARNING -gt 0 ]; then
        echo -e "${YELLOW}Warnings:         $CHECKS_WARNING${NC}"
    fi
    if [ $CHECKS_FAILED -gt 0 ]; then
        echo -e "${RED}Failed:           $CHECKS_FAILED${NC}"
    fi
    echo ""

    # Determine exit code
    if [ $CHECKS_FAILED -gt 0 ]; then
        if [ $CHECKS_FAILED -ge 3 ]; then
            echo -e "${RED}Status: CRITICAL - Multiple failures detected${NC}"
            exit 2
        else
            echo -e "${YELLOW}Status: DEGRADED - Some checks failed${NC}"
            exit 1
        fi
    elif [ $CHECKS_WARNING -gt 0 ]; then
        echo -e "${YELLOW}Status: HEALTHY (with warnings)${NC}"
        exit 0
    else
        echo -e "${GREEN}Status: HEALTHY - All checks passed${NC}"
        exit 0
    fi
}

main "$@"
