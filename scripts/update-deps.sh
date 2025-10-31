#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Dependency Update Script for Pressograph
# ═══════════════════════════════════════════════════════════════════
# Updates all dependencies to latest compatible versions
# Usage: ./scripts/update-deps.sh

set -e

echo "════════════════════════════════════════════════════════════════"
echo "Pressograph Dependency Update Script"
echo "════════════════════════════════════════════════════════════════"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Frontend
echo -e "${YELLOW}Updating frontend dependencies...${NC}"
cd /opt/projects/repositories/pressograph

echo "Current versions:"
npm list --depth=0 | grep -E "react|typescript|vite|heroui|tailwind|zustand"

echo ""
echo "Updating to latest..."
npm update

echo ""
echo -e "${GREEN}Frontend dependencies updated!${NC}"
echo ""

# Backend
echo -e "${YELLOW}Updating backend dependencies...${NC}"
cd /opt/projects/repositories/pressograph/server

echo "Current versions:"
npm list --depth=0 | grep -E "express|pg|typescript"

echo ""
echo "Updating to latest..."
npm update

# Update TypeScript to latest
npm install -D typescript@latest @types/node@latest

echo ""
echo -e "${GREEN}Backend dependencies updated!${NC}"
echo ""

# Return to root
cd /opt/projects/repositories/pressograph

echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}All dependencies updated successfully!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff package.json server/package.json"
echo "2. Test frontend: npm run build"
echo "3. Test backend: cd server && npm run build"
echo "4. Commit changes if all tests pass"
echo ""
