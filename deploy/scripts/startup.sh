#!/bin/bash
set -e

echo "=== Pressograph Development Environment Startup ==="
echo "Starting services with PM2..."

# Create PM2 log directory
mkdir -p /tmp/pm2

# Navigate to workspace
cd /workspace

# Start PM2 with ecosystem config
pm2 start ecosystem.config.js

# Display PM2 status
pm2 list

echo ""
echo "=== Services Started ==="
echo "Next.js Dev Server: http://localhost:3000"
echo "Drizzle Studio: http://localhost:5555"
echo ""
echo "View logs: pm2 logs"
echo "Stop services: pm2 stop all"
echo "Restart services: pm2 restart all"
echo ""

# Keep container running and follow PM2 logs
pm2 logs
