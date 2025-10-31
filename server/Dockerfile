# ═══════════════════════════════════════════════════════════════════
# Backend Dockerfile - Multi-stage build
# ═══════════════════════════════════════════════════════════════════

# Stage 1: Build
FROM node:lts-trixie AS builder

WORKDIR /app

# Install canvas build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libcairo2-dev \
        libpango1.0-dev \
        libjpeg-dev \
        libgif-dev \
        librsvg2-dev \
        pkg-config \
        python3 && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies (including canvas native modules)
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:lts-trixie

WORKDIR /app

# Install runtime dependencies for canvas, fonts, and dumb-init
# Canvas runtime libs:
# - libcairo2, libpango*: Cairo graphics and Pango text rendering
# - libjpeg62-turbo, libgif7, librsvg2-2: Image format support
# Font packages (FIX for PNG text encoding issue):
# - fontconfig: Font configuration library (fixes "Cannot load default config file" error)
# - fonts-dejavu-core: DejaVu Sans/Serif/Mono (excellent Cyrillic support)
# - fonts-liberation: Liberation Sans/Serif/Mono (Arial/Times/Courier alternatives)
# - fonts-noto-core: Noto Sans/Serif (comprehensive Unicode coverage)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        dumb-init \
        libcairo2 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libjpeg62-turbo \
        libgif7 \
        librsvg2-2 \
        fontconfig \
        fonts-dejavu-core \
        fonts-liberation \
        fonts-noto-core && \
    fc-cache -fv && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
