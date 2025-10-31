#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Migration Runner for Pressograph
# ═══════════════════════════════════════════════════════════════════
# Applies all SQL migrations in order
# Idempotent: Safe to run multiple times
#
# Usage:
#   # From container:
#   /bin/bash /migrations/apply-all.sh
#
#   # From host:
#   podman exec pressograph-prod-db /bin/bash /migrations/apply-all.sh
#   podman exec pressograph-dev-postgres /bin/bash /migrations/apply-all.sh
#
# Environment Variables:
#   DB_HOST     - Database host (default: localhost)
#   DB_USER     - Database user (default: pressograph)
#   DB_NAME     - Database name (default: pressograph)
#   PGPASSWORD  - Database password (must be set)
# ═══════════════════════════════════════════════════════════════════

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-pressograph}
DB_NAME=${DB_NAME:-pressograph}
MIGRATIONS_DIR=${MIGRATIONS_DIR:-/migrations}

echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Pressograph Database Migrations${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Database: ${DB_NAME}"
echo "User: ${DB_USER}"
echo "Host: ${DB_HOST}"
echo "Migrations directory: ${MIGRATIONS_DIR}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}ERROR: psql command not found!${NC}"
    exit 1
fi

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}ERROR: Migrations directory not found: $MIGRATIONS_DIR${NC}"
    exit 1
fi

# Apply migrations in order
migration_count=0
success_count=0
failed_count=0

for migration in $(ls -1 $MIGRATIONS_DIR/*.sql 2>/dev/null | sort); do
    migration_count=$((migration_count + 1))
    migration_name=$(basename "$migration")

    echo -e "${YELLOW}Applying migration: ${migration_name}${NC}"

    if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$migration" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ${migration_name} applied successfully${NC}"
        success_count=$((success_count + 1))
    else
        echo -e "${RED}✗ ${migration_name} failed!${NC}"
        failed_count=$((failed_count + 1))

        # Show error details
        echo -e "${YELLOW}Error details:${NC}"
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$migration" || true
    fi

    echo ""
done

# Summary
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Migration Summary${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Total migrations: ${migration_count}"
echo -e "${GREEN}Successful: ${success_count}${NC}"
if [ $failed_count -gt 0 ]; then
    echo -e "${RED}Failed: ${failed_count}${NC}"
fi
echo ""

if [ $failed_count -gt 0 ]; then
    echo -e "${RED}Some migrations failed! Please check the errors above.${NC}"
    exit 1
else
    echo -e "${GREEN}All migrations applied successfully!${NC}"
    exit 0
fi
