#!/bin/bash

##############################################################################
# Bundle Size Analysis Script
#
# Purpose: Analyze Next.js production build bundle sizes and identify
#          large chunks that may need optimization.
#
# Usage:
#   ./scripts/analyze-bundle.sh
#
# Prerequisites:
#   - Must run `pnpm build` first to generate .next directory
#   - Requires GNU coreutils (du, sort, awk)
#
# Output:
#   - Total bundle size
#   - Top 20 largest chunks with sizes
#   - Bundle size breakdown by category
#   - Recommendations for optimization
#
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .next directory exists
if [ ! -d ".next" ]; then
    echo -e "${RED}Error: .next directory not found${NC}"
    echo "Please run 'pnpm build' first"
    exit 1
fi

# Print header
echo "================================================================================"
echo "                        PRESSOGRAPH BUNDLE ANALYSIS"
echo "================================================================================"
echo ""

# 1. Total build size
echo -e "${BLUE}1. Total Build Size${NC}"
echo "--------------------------------------------------------------------------------"
TOTAL_SIZE=$(du -sh .next | awk '{print $1}')
echo -e "Total .next directory: ${GREEN}$TOTAL_SIZE${NC}"
echo ""

# 2. Static assets size
if [ -d ".next/static" ]; then
    STATIC_SIZE=$(du -sh .next/static | awk '{print $1}')
    echo -e "Static assets (.next/static): ${GREEN}$STATIC_SIZE${NC}"
fi
echo ""

# 3. JavaScript chunks analysis
echo -e "${BLUE}2. Top 20 Largest JavaScript Chunks${NC}"
echo "--------------------------------------------------------------------------------"
if [ -d ".next/static/chunks" ]; then
    find .next/static/chunks -name "*.js" -type f -exec du -h {} + | \
        sort -rh | \
        head -20 | \
        awk '{printf "%-10s %s\n", $1, $2}'

    echo ""

    # Count total chunks
    TOTAL_CHUNKS=$(find .next/static/chunks -name "*.js" -type f | wc -l)
    echo -e "Total JavaScript chunks: ${YELLOW}$TOTAL_CHUNKS${NC}"

    # Get largest chunk
    LARGEST_CHUNK=$(find .next/static/chunks -name "*.js" -type f -exec du -h {} + | sort -rh | head -1)
    echo -e "Largest chunk: ${RED}$LARGEST_CHUNK${NC}"
fi
echo ""

# 4. Page bundles
echo -e "${BLUE}3. Page-Specific Bundles${NC}"
echo "--------------------------------------------------------------------------------"
if [ -d ".next/server/app" ]; then
    find .next/server/app -name "*.js" -type f -exec du -h {} + | \
        sort -rh | \
        head -15 | \
        awk '{printf "%-10s %s\n", $1, $2}'
fi
echo ""

# 5. Recommendations
echo -e "${BLUE}4. Optimization Recommendations${NC}"
echo "--------------------------------------------------------------------------------"
echo "✓ ECharts tree-shaking is enabled (next.config.ts)"
echo "✓ Production build includes compression"
echo ""
echo -e "${YELLOW}Potential Optimizations:${NC}"
echo "  • If largest chunk > 300KB: Consider further code splitting"
echo "  • Monitor chunks > 100KB for lazy loading opportunities"
echo "  • Use dynamic imports for heavy components (ECharts, forms)"
echo "  • Enable bundle analyzer: pnpm add @next/bundle-analyzer"
echo ""

# 6. Historical comparison (if previous analysis exists)
ANALYSIS_FILE=".next/bundle-analysis.txt"
if [ -f "$ANALYSIS_FILE" ]; then
    echo -e "${BLUE}5. Historical Comparison${NC}"
    echo "--------------------------------------------------------------------------------"
    PREVIOUS_SIZE=$(cat "$ANALYSIS_FILE")
    echo -e "Previous build: $PREVIOUS_SIZE"
    echo -e "Current build:  $TOTAL_SIZE"
    echo ""
fi

# Save current analysis
echo "$TOTAL_SIZE" > "$ANALYSIS_FILE"

echo "================================================================================"
echo -e "${GREEN}Analysis complete!${NC}"
echo "================================================================================"
echo ""
echo "For detailed analysis, install and configure @next/bundle-analyzer:"
echo "  pnpm add -D @next/bundle-analyzer"
echo "  # Add to next.config.ts"
echo ""
