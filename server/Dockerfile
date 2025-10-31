# ═══════════════════════════════════════════════════════════════════
# Pressograph Backend Dockerfile - Multi-stage Build
# ═══════════════════════════════════════════════════════════════════
# Build optimized Node.js Express API with Canvas support
# Follows OCI image spec and Buildah best practices 2025
#
# Build command:
#   buildah bud -f server/Dockerfile \
#     --tag localhost/pressograph-backend:latest \
#     --build-arg VERSION=1.2.0 \
#     --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
#     server/
# ═══════════════════════════════════════════════════════════════════

# Build arguments (can be overridden at build time)
ARG NODE_VERSION=lts-trixie
ARG VERSION=1.2.0
ARG BUILD_DATE
ARG VCS_REF
ARG NODE_ENV=production

# ═══════════════════════════════════════════════════════════════════
# Stage 1: Builder - Compile TypeScript and install dependencies
# ═══════════════════════════════════════════════════════════════════
FROM node:${NODE_VERSION} AS builder

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

# Build TypeScript (creates dist/ directory)
RUN npm run build

# ═══════════════════════════════════════════════════════════════════
# Stage 2: Production - Minimal runtime image
# ═══════════════════════════════════════════════════════════════════
FROM node:${NODE_VERSION}

# Re-declare ARGs for this stage
ARG VERSION=1.2.0
ARG BUILD_DATE
ARG VCS_REF
ARG NODE_ENV=production

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

# Environment variables
ENV NODE_ENV=${NODE_ENV} \
    PORT=3001 \
    HOST=0.0.0.0

# OCI Image Labels
# https://github.com/opencontainers/image-spec/blob/main/annotations.md
LABEL org.opencontainers.image.title="Pressograph Backend API" \
      org.opencontainers.image.description="Node.js Express REST API for pressure test visualization with PostgreSQL and Canvas support" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Pressograph" \
      org.opencontainers.image.authors="Pressograph Team" \
      org.opencontainers.image.url="https://pressograph.infra4.dev" \
      org.opencontainers.image.source="https://github.com/your-org/pressograph" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.base.name="docker.io/library/node:lts-trixie" \
      com.pressograph.component="backend" \
      com.pressograph.service="api" \
      com.pressograph.environment="production"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
