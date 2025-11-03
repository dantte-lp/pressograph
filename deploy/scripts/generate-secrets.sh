#!/bin/bash
# ==============================================
# Pressograph Secrets Generation Script
# ==============================================
# This script generates cryptographically secure secrets for Pressograph
# and creates a .env.local file based on .env.example
#
# Usage:
#   ./deploy/scripts/generate-secrets.sh [options]
#
# Options:
#   --env ENV        Environment (dev, prod, staging) - default: dev
#   --force          Overwrite existing .env.local without prompting
#   --output FILE    Output to specific file instead of .env.local
#   --help           Show this help message

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
FORCE=false
OUTPUT_FILE=".env.local"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# ==============================================
# Helper Functions
# ==============================================

print_header() {
    echo -e "${BLUE}=============================================${NC}"
    echo -e "${BLUE}  Pressograph Secrets Generator${NC}"
    echo -e "${BLUE}=============================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

show_help() {
    cat << EOF
Pressograph Secrets Generation Script

This script generates cryptographically secure secrets and creates
a .env.local file for your Pressograph application.

USAGE:
    ./deploy/scripts/generate-secrets.sh [options]

OPTIONS:
    --env ENV        Environment (dev, prod, staging) - default: dev
    --force          Overwrite existing .env.local without prompting
    --output FILE    Output to specific file instead of .env.local
    --help           Show this help message

EXAMPLES:
    # Generate development secrets
    ./deploy/scripts/generate-secrets.sh

    # Generate production secrets
    ./deploy/scripts/generate-secrets.sh --env prod

    # Force overwrite existing file
    ./deploy/scripts/generate-secrets.sh --force

    # Output to custom file
    ./deploy/scripts/generate-secrets.sh --output .env.production

SECURITY NOTES:
    - All secrets are generated using OpenSSL's cryptographic random generator
    - Secrets are 256-bit (32 bytes) by default
    - Never commit .env.local or .env.*.local to version control
    - Rotate secrets regularly in production (every 90 days recommended)

EOF
}

# ==============================================
# Secret Generation Functions
# ==============================================

# Generate random hex string (n bytes)
generate_hex() {
    local bytes=${1:-32}
    openssl rand -hex "$bytes"
}

# Generate random base64 string (n bytes)
generate_base64() {
    local bytes=${1:-32}
    openssl rand -base64 "$bytes" | tr -d "=\n"
}

# Generate secure password (alphanumeric + special chars)
generate_password() {
    local length=${1:-32}
    openssl rand -base64 48 | tr -d "=+/" | tr -d '\n' | cut -c1-"$length"
}

# Generate UUID v4
generate_uuid() {
    if command -v uuidgen &> /dev/null; then
        uuidgen | tr '[:upper:]' '[:lower:]'
    else
        # Fallback: generate UUID-like string
        local N B T
        for ((N=0; N < 16; ++N)); do
            B=$((RANDOM%256))
            case $N in
                6) printf '4%x' $((B%16)) ;;
                8) printf '%x%x' $((B/64+8)) $((B%16)) ;;
                3 | 5 | 7 | 9) printf '%02x-' $B ;;
                *) printf '%02x' $B ;;
            esac
        done
        echo
    fi
}

# ==============================================
# Parse Arguments
# ==============================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# ==============================================
# Main Script
# ==============================================

print_header

cd "$PROJECT_ROOT" || exit 1

print_info "Project root: $PROJECT_ROOT"
print_info "Environment: $ENVIRONMENT"
print_info "Output file: $OUTPUT_FILE"
echo ""

# Check if output file exists
if [[ -f "$OUTPUT_FILE" ]] && [[ "$FORCE" != true ]]; then
    print_warning "File $OUTPUT_FILE already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Aborted. No changes made."
        exit 0
    fi
fi

# Check if template exists
TEMPLATE_FILE=".env.example"
if [[ "$ENVIRONMENT" != "dev" ]]; then
    if [[ -f ".env.${ENVIRONMENT}.example" ]]; then
        TEMPLATE_FILE=".env.${ENVIRONMENT}.example"
    fi
fi

if [[ ! -f "$TEMPLATE_FILE" ]]; then
    print_error "Template file $TEMPLATE_FILE not found!"
    print_info "Please create it first or run from the project root."
    exit 1
fi

print_info "Using template: $TEMPLATE_FILE"
echo ""

# ==============================================
# Generate Secrets
# ==============================================

print_info "Generating cryptographically secure secrets..."
echo ""

# Generate all secrets at once
NEXTAUTH_SECRET=$(generate_hex 32)
APP_SECRET=$(generate_hex 32)
JWT_SECRET=$(generate_hex 32)
API_SECRET_KEY=$(generate_hex 32)
ENCRYPTION_KEY=$(generate_hex 32)
POSTGRES_PASSWORD=$(generate_password 32)
VALKEY_PASSWORD=$(generate_password 24)

print_success "Generated NEXTAUTH_SECRET (64 chars)"
print_success "Generated APP_SECRET (64 chars)"
print_success "Generated JWT_SECRET (64 chars)"
print_success "Generated API_SECRET_KEY (64 chars)"
print_success "Generated ENCRYPTION_KEY (64 chars)"
print_success "Generated POSTGRES_PASSWORD (32 chars)"
print_success "Generated VALKEY_PASSWORD (24 chars)"
echo ""

# ==============================================
# Environment-Specific Settings
# ==============================================

if [[ "$ENVIRONMENT" == "prod" ]]; then
    NODE_ENV="production"
    APP_URL="https://pressograph.com"
    DATABASE_HOST="db"
    DATABASE_SSL="?sslmode=require"
    REDIS_URL="redis://:${VALKEY_PASSWORD}@cache:6379"
    ENABLE_FEATURES="true"
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    NODE_ENV="production"
    APP_URL="https://staging.pressograph.com"
    DATABASE_HOST="db"
    DATABASE_SSL="?sslmode=require"
    REDIS_URL="redis://:${VALKEY_PASSWORD}@cache:6379"
    ENABLE_FEATURES="true"
else
    NODE_ENV="development"
    APP_URL="http://localhost:3000"
    DATABASE_HOST="db"
    DATABASE_SSL=""
    REDIS_URL="redis://cache:6379"
    ENABLE_FEATURES="false"
fi

# ==============================================
# Create .env File
# ==============================================

print_info "Creating $OUTPUT_FILE..."

cat > "$OUTPUT_FILE" << EOF
# ==============================================
# Pressograph Environment Variables
# ==============================================
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# Environment: ${ENVIRONMENT}
# 
# WARNING: This file contains sensitive secrets!
# - DO NOT commit this file to version control
# - Keep this file secure and encrypted
# - Rotate secrets regularly

# ----------------------------------------------
# Application
# ----------------------------------------------
NODE_ENV=${NODE_ENV}
NEXT_PUBLIC_APP_URL=${APP_URL}
NEXT_TELEMETRY_DISABLED=1

# ----------------------------------------------
# Database (PostgreSQL 18)
# ----------------------------------------------
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@${DATABASE_HOST}:5432/pressograph${DATABASE_SSL}
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=pressograph
POSTGRES_HOST=${DATABASE_HOST}
POSTGRES_PORT=5432

# ----------------------------------------------
# Cache (Valkey 9)
# ----------------------------------------------
REDIS_URL=${REDIS_URL}
REDIS_DB=0
EOF

# Add Valkey password for prod/staging
if [[ "$ENVIRONMENT" != "dev" ]]; then
    cat >> "$OUTPUT_FILE" << EOF
VALKEY_PASSWORD=${VALKEY_PASSWORD}
EOF
fi

cat >> "$OUTPUT_FILE" << EOF

# ----------------------------------------------
# Authentication (NextAuth.js)
# ----------------------------------------------
NEXTAUTH_URL=${APP_URL}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# ----------------------------------------------
# Application Secrets
# ----------------------------------------------
APP_SECRET=${APP_SECRET}
JWT_SECRET=${JWT_SECRET}
API_SECRET_KEY=${API_SECRET_KEY}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# ----------------------------------------------
# Email / SMTP (Configure manually)
# ----------------------------------------------
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASSWORD=
# SMTP_FROM=noreply@pressograph.com

# ----------------------------------------------
# Object Storage (Configure manually)
# ----------------------------------------------
# S3_BUCKET=
# S3_REGION=us-east-1
# S3_ACCESS_KEY=
# S3_SECRET_KEY=

# ----------------------------------------------
# External Services (Configure manually)
# ----------------------------------------------
# ANALYTICS_ID=
# SENTRY_DSN=

# ----------------------------------------------
# Feature Flags
# ----------------------------------------------
ENABLE_SIGNUP=true
ENABLE_EMAIL_VERIFICATION=${ENABLE_FEATURES}
ENABLE_TWO_FACTOR=${ENABLE_FEATURES}
EOF

# Add production-specific settings
if [[ "$ENVIRONMENT" == "prod" ]] || [[ "$ENVIRONMENT" == "staging" ]]; then
    cat >> "$OUTPUT_FILE" << EOF

# ----------------------------------------------
# Rate Limiting (Production)
# ----------------------------------------------
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# ----------------------------------------------
# Security (Production)
# ----------------------------------------------
ALLOWED_ORIGINS=${APP_URL}
FORCE_HTTPS=true
LOG_LEVEL=info
EOF
else
    cat >> "$OUTPUT_FILE" << EOF

# ----------------------------------------------
# Development Settings
# ----------------------------------------------
DEBUG=pressograph:*
RATE_LIMIT_ENABLED=false
LOG_LEVEL=debug
EOF
fi

# Set secure permissions
chmod 600 "$OUTPUT_FILE"

print_success "Created $OUTPUT_FILE"
print_success "Set file permissions to 600 (owner read/write only)"
echo ""

# ==============================================
# Summary and Next Steps
# ==============================================

print_header
print_success "Secrets generated successfully!"
echo ""

print_info "Generated secrets summary:"
echo "  - NEXTAUTH_SECRET: 64 hex characters"
echo "  - APP_SECRET: 64 hex characters"
echo "  - JWT_SECRET: 64 hex characters"
echo "  - API_SECRET_KEY: 64 hex characters"
echo "  - ENCRYPTION_KEY: 64 hex characters"
echo "  - POSTGRES_PASSWORD: 32 characters"
if [[ "$ENVIRONMENT" != "dev" ]]; then
    echo "  - VALKEY_PASSWORD: 24 characters"
fi
echo ""

print_warning "IMPORTANT: Next Steps"
echo ""
echo "1. Review $OUTPUT_FILE and configure optional services:"
echo "   - SMTP settings for email"
echo "   - S3 settings for file storage"
echo "   - Analytics and monitoring"
echo ""
echo "2. Keep this file secure:"
echo "   - Never commit to version control"
echo "   - Store securely (encrypted vault, secrets manager)"
echo "   - Rotate secrets every 90 days in production"
echo ""
echo "3. For production deployment:"
echo "   - Use secrets management (Kubernetes secrets, Vault, etc.)"
echo "   - Enable all security features"
echo "   - Configure monitoring and alerts"
echo ""

if [[ "$ENVIRONMENT" == "dev" ]]; then
    print_info "You can now start the development environment:"
    echo "  task dev:up"
    echo ""
fi

print_success "Done!"
