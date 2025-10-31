.PHONY: help build install uninstall start stop restart status logs clean rebuild
.PHONY: build-buildah build-images build-frontend build-backend validate-tools
.PHONY: create-network create-volume inspect push pull info enable disable
.PHONY: pod-start pod-stop pod-restart pod-logs pod-status
.PHONY: dev dev-compose prod prod-compose
.PHONY: install-quadlet uninstall-quadlet status-quadlet logs-quadlet
.PHONY: observability-up observability-down observability-logs observability-status
.PHONY: observability-monitoring observability-logging observability-tracing observability-full
.PHONY: observability-restart observability-clean
.PHONY: gen-secrets init-env-dev init-env-prod
.PHONY: rebuild-frontend-prod deploy-frontend-prod frontend-prod restart-frontend-prod
.PHONY: rebuild-frontend-dev deploy-frontend-dev frontend-dev restart-frontend-dev
.PHONY: npm-build npm-install logs-frontend-prod logs-frontend-dev

# Default target
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Directories
SYSTEMD_DIR := /etc/containers/systemd
PODS_DIR := $(CURDIR)/pods
PROJECT_ROOT := $(CURDIR)

# Image registry (for push/pull operations)
REGISTRY ?= localhost
IMAGE_PREFIX ?= pressograph
VERSION := $(shell cat VERSION 2>/dev/null || echo "1.2.0")
COMMIT_HASH := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE := $(shell date -u +'%Y-%m-%d')

# Image names
FRONTEND_IMAGE := $(REGISTRY)/$(IMAGE_PREFIX)-frontend:$(VERSION)
FRONTEND_IMAGE_LATEST := $(REGISTRY)/$(IMAGE_PREFIX)-frontend:latest
BACKEND_IMAGE := $(REGISTRY)/$(IMAGE_PREFIX)-backend:$(VERSION)
BACKEND_IMAGE_LATEST := $(REGISTRY)/$(IMAGE_PREFIX)-backend:latest

# Pod and network names
POD_NAME := pressograph
NETWORK_NAME := pressograph-net
VOLUME_NAME := pressograph-db-data

help: ## Show this help message
	@echo -e "$(CYAN)Pressograph - Pressure Test Visualization Platform$(NC)"
	@echo ""
	@echo -e "$(GREEN)Available targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo -e "$(YELLOW)Prerequisites (Required):$(NC)"
	@echo "  - RHEL 9+ / Oracle Linux 9+ / Fedora 38+ / Debian 12+"
	@echo "  - Podman 4.4+ with quadlet support"
	@echo "  - Buildah 1.29+ for image building"
	@echo "  - Systemd 247+"
	@echo ""
	@echo -e "$(YELLOW)Optional Tools:$(NC)"
	@echo "  - Skopeo  - Registry operations (inspect, push, pull)"
	@echo "  - crun    - High-performance OCI runtime"
	@echo ""
	@echo -e "$(CYAN)Quick Start:$(NC)"
	@echo "  make validate-tools      # Check available tools"
	@echo "  make build-buildah       # Build images with Buildah"
	@echo "  make create-network      # Create pod network"
	@echo "  make create-volume       # Create database volume"
	@echo "  sudo make install        # Install systemd units"
	@echo "  sudo make start          # Start the pod"
	@echo ""

check-prereqs: ## Check system prerequisites
	@echo -e "$(CYAN)Checking prerequisites...$(NC)"
	@printf "Podman version: "
	@podman --version || (echo -e "$(RED)ERROR: Podman not found$(NC)" && exit 1)
	@printf "Buildah version: "
	@buildah --version || (echo -e "$(RED)ERROR: Buildah not found$(NC)" && exit 1)
	@printf "Systemd version: "
	@systemctl --version | head -n1 || (echo -e "$(RED)ERROR: Systemd not found$(NC)" && exit 1)
	@printf "Quadlet support: "
	@PODMAN_VERSION=$$(podman --version | awk '{print $$3}' | cut -d. -f1-2); \
	if awk "BEGIN {exit !($$PODMAN_VERSION >= 4.4)}"; then \
		echo -e "$(GREEN)OK (built into Podman $$PODMAN_VERSION)$(NC)"; \
	else \
		echo -e "$(RED)ERROR: Podman 4.4+ required$(NC)"; \
		exit 1; \
	fi
	@echo -e "$(GREEN)All prerequisites met!$(NC)"

# ═══════════════════════════════════════════════════════════════════
# Environment & Secrets Management
# ═══════════════════════════════════════════════════════════════════

gen-secrets: ## Generate random secrets and display them (use with init-env-dev or init-env-prod)
	@echo -e "$(CYAN)Generating random secrets...$(NC)"
	@echo ""
	@echo -e "$(YELLOW)Copy these values to your .env file:$(NC)"
	@echo ""
	@echo -e "$(GREEN)# PostgreSQL Password$(NC)"
	@echo "POSTGRES_PASSWORD=$$(openssl rand -base64 32)"
	@echo ""
	@echo -e "$(GREEN)# JWT Secrets$(NC)"
	@echo "JWT_SECRET=$$(openssl rand -hex 32)"
	@echo "JWT_REFRESH_SECRET=$$(openssl rand -hex 32)"
	@echo ""
	@echo -e "$(YELLOW)SECURITY NOTES:$(NC)"
	@echo "  - Store these securely (e.g., password manager)"
	@echo "  - Never commit to git"
	@echo "  - Use different secrets for each environment"
	@echo "  - Rotate every 90 days for production"

init-env-dev: ## Initialize .env.dev with generated secrets
	@echo -e "$(CYAN)Initializing development environment file...$(NC)"
	@if [ -f deploy/compose/.env.dev ]; then \
		echo -e "$(YELLOW)WARNING: deploy/compose/.env.dev already exists!$(NC)"; \
		echo -e "$(YELLOW)Backup created: deploy/compose/.env.dev.backup$$(date +%Y%m%d_%H%M%S)$(NC)"; \
		cp deploy/compose/.env.dev deploy/compose/.env.dev.backup$$(date +%Y%m%d_%H%M%S); \
	fi
	@echo -e "$(GREEN)Copying template and generating secrets...$(NC)"
	@cp deploy/compose/.env.example deploy/compose/.env.dev
	@POSTGRES_PASS=$$(openssl rand -base64 32); \
	JWT_SECRET=$$(openssl rand -hex 32); \
	JWT_REFRESH=$$(openssl rand -hex 32); \
	sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$$POSTGRES_PASS|" deploy/compose/.env.dev; \
	sed -i "s|JWT_SECRET=.*|JWT_SECRET=$$JWT_SECRET|" deploy/compose/.env.dev; \
	sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$$JWT_REFRESH|" deploy/compose/.env.dev; \
	sed -i "s|NODE_ENV=production|NODE_ENV=development|" deploy/compose/.env.dev; \
	sed -i "s|LOG_LEVEL=info|LOG_LEVEL=debug|" deploy/compose/.env.dev; \
	sed -i "s|DEBUG=|DEBUG=pressograph:*|" deploy/compose/.env.dev; \
	sed -i "s|JWT_EXPIRES_IN=5m|JWT_EXPIRES_IN=15m|" deploy/compose/.env.dev; \
	sed -i "s|JWT_REFRESH_EXPIRES_IN=24h|JWT_REFRESH_EXPIRES_IN=7d|" deploy/compose/.env.dev; \
	sed -i "s|ALLOWED_ORIGINS=https://pressograph.infra4.dev|ALLOWED_ORIGINS=https://dev-pressograph.infra4.dev,http://localhost:5173|" deploy/compose/.env.dev; \
	sed -i "s|BASE_URL=https://pressograph.infra4.dev|BASE_URL=https://dev-pressograph.infra4.dev|" deploy/compose/.env.dev; \
	sed -i "s|POSTGRES_DB=pressograph|POSTGRES_DB=pressograph_dev|" deploy/compose/.env.dev; \
	sed -i "s|POSTGRES_USER=pressograph|POSTGRES_USER=pressograph_dev|" deploy/compose/.env.dev
	@echo -e "$(GREEN)✓ Created deploy/compose/.env.dev with random secrets$(NC)"
	@echo -e "$(CYAN)Review the file and adjust settings as needed$(NC)"

init-env-prod: ## Initialize .env.prod with generated secrets (PRODUCTION - review carefully!)
	@echo -e "$(RED)═══════════════════════════════════════════════════════════════════$(NC)"
	@echo -e "$(RED)                    PRODUCTION ENVIRONMENT SETUP                    $(NC)"
	@echo -e "$(RED)═══════════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo -e "$(YELLOW)This will create .env.prod with STRONG random secrets.$(NC)"
	@echo -e "$(YELLOW)Review ALL settings before deploying to production!$(NC)"
	@echo ""
	@read -p "Press ENTER to continue or CTRL+C to cancel..."
	@if [ -f deploy/compose/.env.prod ]; then \
		echo -e "$(YELLOW)WARNING: deploy/compose/.env.prod already exists!$(NC)"; \
		echo -e "$(YELLOW)Backup created: deploy/compose/.env.prod.backup$$(date +%Y%m%d_%H%M%S)$(NC)"; \
		cp deploy/compose/.env.prod deploy/compose/.env.prod.backup$$(date +%Y%m%d_%H%M%S); \
	fi
	@echo -e "$(GREEN)Copying template and generating STRONG secrets...$(NC)"
	@cp deploy/compose/.env.example deploy/compose/.env.prod
	@POSTGRES_PASS=$$(openssl rand -base64 48); \
	JWT_SECRET=$$(openssl rand -hex 64); \
	JWT_REFRESH=$$(openssl rand -hex 64); \
	sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$$POSTGRES_PASS|" deploy/compose/.env.prod; \
	sed -i "s|JWT_SECRET=.*|JWT_SECRET=$$JWT_SECRET|" deploy/compose/.env.prod; \
	sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$$JWT_REFRESH|" deploy/compose/.env.prod
	@echo -e "$(GREEN)✓ Created deploy/compose/.env.prod with STRONG random secrets$(NC)"
	@echo ""
	@echo -e "$(RED)CRITICAL SECURITY CHECKLIST:$(NC)"
	@echo -e "  $(RED)☐$(NC) Review ALL settings in deploy/compose/.env.prod"
	@echo -e "  $(RED)☐$(NC) Update ALLOWED_ORIGINS to your production domain"
	@echo -e "  $(RED)☐$(NC) Update BASE_URL to your production domain"
	@echo -e "  $(RED)☐$(NC) Set JWT_EXPIRES_IN to 5m (NOT 15m)"
	@echo -e "  $(RED)☐$(NC) Set JWT_REFRESH_EXPIRES_IN to 24h (NOT 7d)"
	@echo -e "  $(RED)☐$(NC) Verify LOG_LEVEL=info (NOT debug)"
	@echo -e "  $(RED)☐$(NC) Verify DEBUG= (empty, NOT pressograph:*)"
	@echo -e "  $(RED)☐$(NC) Store secrets in password manager"
	@echo -e "  $(RED)☐$(NC) Schedule secret rotation (every 90 days)"
	@echo ""

validate-tools: ## Validate containers ecosystem tools
	@echo -e "$(CYAN)Validating containers ecosystem tools...$(NC)"
	@printf "Podman: "
	@if command -v podman >/dev/null 2>&1; then \
		podman --version; \
	else \
		echo -e "$(RED)NOT FOUND (required)$(NC)"; \
	fi
	@printf "Buildah: "
	@if command -v buildah >/dev/null 2>&1; then \
		buildah --version; \
	else \
		echo -e "$(RED)NOT FOUND (required for builds)$(NC)"; \
	fi
	@printf "Skopeo: "
	@if command -v skopeo >/dev/null 2>&1; then \
		skopeo --version; \
	else \
		echo -e "$(YELLOW)NOT FOUND (optional - for registry operations)$(NC)"; \
	fi
	@printf "crun: "
	@if command -v crun >/dev/null 2>&1; then \
		crun --version | head -n1; \
	else \
		echo -e "$(YELLOW)NOT FOUND (optional - alternative OCI runtime)$(NC)"; \
	fi
	@echo ""
	@echo -e "$(CYAN)Installation commands (Debian/Ubuntu):$(NC)"
	@echo "  sudo apt-get update"
	@echo "  sudo apt-get install -y podman buildah skopeo crun"
	@echo ""
	@echo -e "$(CYAN)Installation commands (RHEL/Oracle/Fedora):$(NC)"
	@echo "  sudo dnf install -y podman buildah skopeo crun"

build-frontend: ## Build frontend image with Buildah
	@if ! command -v buildah >/dev/null 2>&1; then \
		echo "$(RED)ERROR: Buildah not found$(NC)"; \
		echo "Install: sudo apt-get install -y buildah (Debian) or sudo dnf install -y buildah (RHEL)"; \
		exit 1; \
	fi
	@echo -e "$(CYAN)Building frontend image with Buildah...$(NC)"
	buildah bud --format docker --layers \
		-t $(FRONTEND_IMAGE) \
		-f $(PODS_DIR)/pressograph-frontend/Containerfile \
		--build-arg VITE_API_URL=/api \
		$(PROJECT_ROOT)
	@echo -e "$(GREEN)Frontend build complete!$(NC)"

build-backend: ## Build backend image with Buildah
	@if ! command -v buildah >/dev/null 2>&1; then \
		echo "$(RED)ERROR: Buildah not found$(NC)"; \
		echo "Install: sudo apt-get install -y buildah (Debian) or sudo dnf install -y buildah (RHEL)"; \
		exit 1; \
	fi
	@echo -e "$(CYAN)Building backend image with Buildah...$(NC)"
	buildah bud --format docker --layers \
		-t $(BACKEND_IMAGE) \
		-f $(PODS_DIR)/pressograph-backend/Containerfile \
		$(PROJECT_ROOT)/server
	@echo -e "$(GREEN)Backend build complete!$(NC)"

build-buildah: build-images ## Build all images using Buildah (alias for build-images)

build-images: build-frontend build-backend ## Build all container images
	@echo -e "$(GREEN)All images built successfully!$(NC)"
	@echo ""
	@echo -e "$(CYAN)Built images:$(NC)"
	@podman images | grep -E "(REPOSITORY|$(IMAGE_PREFIX))"

build: build-images ## Alias for build-images

create-network: ## Create Podman network for the pod
	@echo -e "$(CYAN)Creating Podman network: $(NETWORK_NAME)$(NC)"
	@if podman network exists $(NETWORK_NAME) 2>/dev/null; then \
		echo -e "$(YELLOW)Network $(NETWORK_NAME) already exists$(NC)"; \
	else \
		podman network create $(NETWORK_NAME); \
		echo -e "$(GREEN)Network created!$(NC)"; \
	fi

create-volume: ## Create Podman volume for PostgreSQL data
	@echo -e "$(CYAN)Creating Podman volume: $(VOLUME_NAME)$(NC)"
	@if podman volume exists $(VOLUME_NAME) 2>/dev/null; then \
		echo -e "$(YELLOW)Volume $(VOLUME_NAME) already exists$(NC)"; \
	else \
		podman volume create $(VOLUME_NAME); \
		echo -e "$(GREEN)Volume created!$(NC)"; \
	fi

info: ## Show system and project information
	@echo -e "$(CYAN)System Information:$(NC)"
	@echo ""
	@echo -e "$(YELLOW)OS:$(NC)"
	@cat /etc/os-release | grep -E '^(NAME|VERSION)=' || true
	@echo ""
	@echo -e "$(YELLOW)Podman:$(NC)"
	@podman --version
	@echo ""
	@echo -e "$(YELLOW)Buildah:$(NC)"
	@buildah --version || echo "Not installed"
	@echo ""
	@echo -e "$(YELLOW)Container Images:$(NC)"
	@podman images | grep -E '(REPOSITORY|$(IMAGE_PREFIX)|postgres)' || echo "No pressograph images found"

clean: ## Clean container images and build cache
	@echo -e "$(CYAN)Cleaning container images...$(NC)"
	-podman rmi $(FRONTEND_IMAGE) 2>/dev/null || true
	-podman rmi $(BACKEND_IMAGE) 2>/dev/null || true
	@echo -e "$(CYAN)Pruning unused images...$(NC)"
	podman image prune -f
	@echo -e "$(GREEN)Cleanup complete!$(NC)"

rebuild: clean build-images ## Rebuild all images from scratch

dev: ## Run development environment (via systemd Quadlet)
	@echo -e "$(CYAN)Starting development environment via systemd...$(NC)"
	@if [ ! -f ~/.config/containers/systemd/pressograph-dev.kube ]; then \
		echo -e "$(YELLOW)Quadlet not installed. Run 'make install-quadlet' first$(NC)"; \
		exit 1; \
	fi
	systemctl --user start pressograph-dev.service
	@echo -e "$(GREEN)Development environment started!$(NC)"
	@echo -e "$(CYAN)Status: make status-quadlet$(NC)"
	@echo -e "$(CYAN)Logs: make logs-quadlet$(NC)"

dev-compose: ## Run development environment (via podman-compose)
	@echo -e "$(CYAN)Starting development environment via podman-compose...$(NC)"
	podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev up -d
	@echo -e "$(GREEN)Development environment started!$(NC)"

prod: ## Run production environment (via systemd Quadlet)
	@echo -e "$(CYAN)Starting production environment via systemd...$(NC)"
	@if ! systemctl --user is-enabled pressograph.service >/dev/null 2>&1; then \
		echo -e "$(YELLOW)Service not installed. Run 'make install-quadlet' first$(NC)"; \
		exit 1; \
	fi
	systemctl --user start pressograph.service
	@echo -e "$(GREEN)Production environment started!$(NC)"

prod-compose: ## Run production environment (via podman-compose)
	@echo -e "$(CYAN)Starting production environment via podman-compose...$(NC)"
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod up -d
	@echo -e "$(GREEN)Production environment started!$(NC)"

install-quadlet: ## Install Quadlet systemd units (rootless)
	@echo -e "$(CYAN)Installing Quadlet units for rootless mode...$(NC)"
	@mkdir -p ~/.config/containers/systemd
	@cp pods/kube-yaml/pressograph-dev.yaml ~/.config/containers/systemd/
	@echo -e "[Unit]" > ~/.config/containers/systemd/pressograph-dev.kube
	@echo "Description=Pressograph Development Environment" >> ~/.config/containers/systemd/pressograph-dev.kube
	@echo "After=network-online.target" >> ~/.config/containers/systemd/pressograph-dev.kube
	@echo "" >> ~/.config/containers/systemd/pressograph-dev.kube
	@echo "[Kube]" >> ~/.config/containers/systemd/pressograph-dev.kube
	@echo "Yaml=$(HOME)/.config/containers/systemd/pressograph-dev.yaml" >> ~/.config/containers/systemd/pressograph-dev.kube
	@echo "Network=traefik-public" >> ~/.config/containers/systemd/pressograph-dev.kube
	@echo "PublishPort=5174:5173" >> ~/.config/containers/systemd/pressograph-dev.kube
	@echo "" >> ~/.config/containers/systemd/pressograph-dev.kube
	@echo "[Service]" >> ~/.config/containers/systemd/pressograph-dev.kube
	@echo "Restart=always" >> ~/.config/containers/systemd/pressograph-dev.kube
	@echo "TimeoutStartSec=600" >> ~/.config/containers/systemd/pressograph-dev.kube
	@echo "" >> ~/.config/containers/systemd/pressograph-dev.kube
	@echo "[Install]" >> ~/.config/containers/systemd/pressograph-dev.kube
	@echo "WantedBy=default.target" >> ~/.config/containers/systemd/pressograph-dev.kube
	@systemctl --user daemon-reload
	@echo -e "$(GREEN)Quadlet units installed!$(NC)"
	@echo -e "$(CYAN)Start: make dev (or systemctl --user start pressograph-dev.service)$(NC)"
	@echo -e "$(CYAN)Status: make status-quadlet$(NC)"
	@echo -e "$(CYAN)Logs: make logs-quadlet$(NC)"

uninstall-quadlet: ## Uninstall Quadlet systemd units
	@echo -e "$(CYAN)Uninstalling Quadlet units...$(NC)"
	@systemctl --user stop pressograph-dev.service 2>/dev/null || true
	@systemctl --user disable pressograph-dev.service 2>/dev/null || true
	@rm -f ~/.config/containers/systemd/pressograph-dev.kube
	@rm -f ~/.config/containers/systemd/pressograph-dev.yaml
	@systemctl --user daemon-reload
	@echo -e "$(GREEN)Quadlet units uninstalled!$(NC)"

status-quadlet: ## Show status of Quadlet services
	@echo -e "$(CYAN)Checking Quadlet service status...$(NC)"
	@systemctl --user status pressograph-dev.service --no-pager || echo "Service not running"

logs-quadlet: ## Show logs from Quadlet services
	@echo -e "$(CYAN)Showing Quadlet service logs...$(NC)"
	@journalctl --user -u pressograph-dev.service -n 100 --no-pager

observability-up: observability-full ## Start observability stack (alias for observability-full)

observability-down: ## Stop observability stack
	@echo -e "$(CYAN)Stopping observability stack...$(NC)"
	podman-compose -f deploy/compose/compose.observability.yaml down
	@echo -e "$(GREEN)Observability stack stopped!$(NC)"

observability-logs: ## Show observability stack logs
	@echo -e "$(CYAN)Showing observability stack logs...$(NC)"
	podman-compose -f deploy/compose/compose.observability.yaml logs -f

observability-status: ## Show observability stack status
	@echo -e "$(CYAN)Checking observability stack status...$(NC)"
	@podman ps --filter label=com.pressograph.stack=observability --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo -e "$(CYAN)Volumes:$(NC)"
	@podman volume ls | grep observability || echo "No observability volumes found"

observability-monitoring: ## Start observability stack (monitoring profile only)
	@echo -e "$(CYAN)Starting observability stack with monitoring profile...$(NC)"
	@echo -e "$(YELLOW)Components: VictoriaMetrics + vmagent + exporters + Grafana$(NC)"
	podman-compose -f deploy/compose/compose.observability.yaml --env-file deploy/compose/.env.observability --profile monitoring up -d
	@echo -e "$(GREEN)Observability stack (monitoring) started!$(NC)"
	@echo -e "$(CYAN)Access URLs:$(NC)"
	@echo -e "  - Grafana: https://grafana-dev.infra4.dev"
	@echo -e "  - VictoriaMetrics: https://victoria-dev.infra4.dev"

observability-logging: ## Start observability stack (logging profile only)
	@echo -e "$(CYAN)Starting observability stack with logging profile...$(NC)"
	@echo -e "$(YELLOW)Components: VictoriaLogs + Promtail + Grafana$(NC)"
	podman-compose -f deploy/compose/compose.observability.yaml --env-file deploy/compose/.env.observability --profile logging up -d
	@echo -e "$(GREEN)Observability stack (logging) started!$(NC)"
	@echo -e "$(CYAN)Access URLs:$(NC)"
	@echo -e "  - Grafana: https://grafana-dev.infra4.dev"
	@echo -e "  - VictoriaLogs: https://logs-dev.infra4.dev"

observability-tracing: ## Start observability stack (tracing profile only)
	@echo -e "$(CYAN)Starting observability stack with tracing profile...$(NC)"
	@echo -e "$(YELLOW)Components: Tempo + Grafana$(NC)"
	podman-compose -f deploy/compose/compose.observability.yaml --env-file deploy/compose/.env.observability --profile tracing up -d
	@echo -e "$(GREEN)Observability stack (tracing) started!$(NC)"
	@echo -e "$(CYAN)Access URLs:$(NC)"
	@echo -e "  - Grafana: https://grafana-dev.infra4.dev"

observability-full: ## Start full observability stack (all profiles)
	@echo -e "$(CYAN)Starting full observability stack...$(NC)"
	@echo -e "$(YELLOW)Components: VictoriaMetrics + VictoriaLogs + Tempo + Grafana + Exporters$(NC)"
	podman-compose -f deploy/compose/compose.observability.yaml --env-file deploy/compose/.env.observability --profile full up -d
	@echo -e "$(GREEN)Full observability stack started!$(NC)"
	@echo ""
	@echo -e "$(CYAN)Access URLs:$(NC)"
	@echo -e "  - Grafana:         https://grafana-dev.infra4.dev (admin/admin)"
	@echo -e "  - VictoriaMetrics: https://victoria-dev.infra4.dev"
	@echo -e "  - VictoriaLogs:    https://logs-dev.infra4.dev"
	@echo ""
	@echo -e "$(CYAN)Check status:$(NC) make observability-status"
	@echo -e "$(CYAN)View logs:$(NC)    make observability-logs"
	@echo -e "$(CYAN)Documentation:$(NC) deploy/grafana/README.md"

observability-restart: ## Restart observability stack
	@echo -e "$(CYAN)Restarting observability stack...$(NC)"
	podman-compose -f deploy/compose/compose.observability.yaml restart
	@echo -e "$(GREEN)Observability stack restarted!$(NC)"

observability-clean: ## Stop and remove observability stack (including volumes)
	@echo -e "$(YELLOW)WARNING: This will delete all observability data (metrics, logs, traces)!$(NC)"
	@echo -e "$(YELLOW)Press Ctrl+C to cancel or Enter to continue...$(NC)"
	@read -r
	@echo -e "$(CYAN)Stopping and removing observability stack...$(NC)"
	podman-compose -f deploy/compose/compose.observability.yaml down -v
	@echo -e "$(GREEN)Observability stack cleaned!$(NC)"

# ═══════════════════════════════════════════════════════════════════
# Frontend Rebuild & Deployment
# ═══════════════════════════════════════════════════════════════════

npm-install: ## Install npm dependencies
	@echo -e "$(CYAN)Installing npm dependencies...$(NC)"
	npm install --prefer-offline --no-audit
	@echo -e "$(GREEN)Dependencies installed!$(NC)"

npm-build: ## Build frontend with Vite
	@echo -e "$(CYAN)Building frontend with Vite...$(NC)"
	npm run build
	@echo -e "$(GREEN)Frontend build complete!$(NC)"
	@echo -e "$(CYAN)Output: $(PROJECT_ROOT)/dist$(NC)"

# ───────────────────────────────────────────────────────────────────
# Production Frontend
# ───────────────────────────────────────────────────────────────────

rebuild-frontend-prod: npm-install npm-build ## Rebuild production frontend container with buildah
	@echo -e "$(CYAN)Building production frontend container image with buildah...$(NC)"
	buildah bud \
		--format docker \
		--layers \
		--tag localhost/pressograph-frontend:latest \
		--tag localhost/pressograph-frontend:$(VERSION) \
		--file deploy/Containerfile \
		--build-arg VITE_API_URL=/api \
		--build-arg NODE_ENV=production \
		--build-arg BUILD_DATE="$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")" \
		--build-arg VERSION=$(VERSION) \
		.
	@echo -e "$(GREEN)Production frontend container image built successfully!$(NC)"
	@echo -e "$(CYAN)Image: localhost/pressograph-frontend:latest, localhost/pressograph-frontend:$(VERSION)$(NC)"

deploy-frontend-prod: ## Deploy production frontend (restart with new image)
	@echo -e "$(CYAN)Deploying production frontend...$(NC)"
	@echo -e "$(YELLOW)Stopping current frontend container...$(NC)"
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod stop frontend || true
	@echo -e "$(YELLOW)Removing old frontend container...$(NC)"
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod rm -f frontend || true
	@echo -e "$(YELLOW)Starting new frontend container...$(NC)"
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod up -d frontend
	@echo -e "$(GREEN)Production frontend deployed successfully!$(NC)"
	@echo -e "$(CYAN)Access: https://pressograph.infra4.dev$(NC)"
	@echo -e "$(CYAN)Check status: make status-prod$(NC)"
	@echo -e "$(CYAN)View logs: make logs-frontend-prod$(NC)"

restart-frontend-prod: ## Restart production frontend without rebuild
	@echo -e "$(CYAN)Restarting production frontend...$(NC)"
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod restart frontend
	@echo -e "$(GREEN)Production frontend restarted!$(NC)"

frontend-prod: rebuild-frontend-prod deploy-frontend-prod ## Full production frontend rebuild and deployment
	@echo -e "$(GREEN)═══════════════════════════════════════════════════════════════════$(NC)"
	@echo -e "$(GREEN)   Production Frontend Rebuild & Deployment Complete!$(NC)"
	@echo -e "$(GREEN)═══════════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo -e "$(CYAN)Access your application:$(NC)"
	@echo -e "  🌐 Frontend: https://pressograph.infra4.dev"
	@echo -e "  🔌 API:      https://pressograph.infra4.dev/api"
	@echo ""
	@echo -e "$(CYAN)Useful commands:$(NC)"
	@echo -e "  📊 Status:  make status-prod"
	@echo -e "  📜 Logs:    make logs-frontend-prod"
	@echo -e "  🔄 Restart: make restart-frontend-prod"
	@echo ""

logs-frontend-prod: ## Show production frontend logs
	@echo -e "$(CYAN)Showing production frontend logs...$(NC)"
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod logs -f --tail 100 frontend

status-prod: ## Show production environment status
	@echo -e "$(CYAN)Production Environment Status:$(NC)"
	@echo ""
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod ps

# ───────────────────────────────────────────────────────────────────
# Development Frontend
# ───────────────────────────────────────────────────────────────────

rebuild-frontend-dev: npm-install npm-build ## Rebuild development frontend container with buildah
	@echo -e "$(CYAN)Building development frontend container image with buildah...$(NC)"
	buildah bud \
		--format docker \
		--layers \
		--tag localhost/pressograph-frontend:dev \
		--file deploy/Containerfile \
		--build-arg VITE_API_URL=/api \
		--build-arg NODE_ENV=development \
		--build-arg BUILD_DATE="$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")" \
		--build-arg VERSION=$(VERSION)-dev \
		.
	@echo -e "$(GREEN)Development frontend container image built successfully!$(NC)"
	@echo -e "$(CYAN)Image: localhost/pressograph-frontend:dev$(NC)"

deploy-frontend-dev: ## Deploy development frontend
	@echo -e "$(CYAN)Deploying development frontend...$(NC)"
	@if [ ! -f deploy/compose/compose.dev.yaml ]; then \
		echo -e "$(RED)ERROR: deploy/compose/compose.dev.yaml not found!$(NC)"; \
		echo -e "$(YELLOW)Run 'make create-dev-compose' first$(NC)"; \
		exit 1; \
	fi
	@echo -e "$(YELLOW)Stopping current frontend container...$(NC)"
	podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev stop frontend || true
	@echo -e "$(YELLOW)Removing old frontend container...$(NC)"
	podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev rm -f frontend || true
	@echo -e "$(YELLOW)Starting new frontend container...$(NC)"
	podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev up -d frontend
	@echo -e "$(GREEN)Development frontend deployed successfully!$(NC)"
	@echo -e "$(CYAN)Access: https://dev-pressograph.infra4.dev$(NC)"

restart-frontend-dev: ## Restart development frontend without rebuild
	@echo -e "$(CYAN)Restarting development frontend...$(NC)"
	podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev restart frontend
	@echo -e "$(GREEN)Development frontend restarted!$(NC)"

frontend-dev: rebuild-frontend-dev deploy-frontend-dev ## Full development frontend rebuild and deployment
	@echo -e "$(GREEN)Development frontend rebuild and deployment complete!$(NC)"

logs-frontend-dev: ## Show development frontend logs
	@echo -e "$(CYAN)Showing development frontend logs...$(NC)"
	podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev logs -f --tail 100 frontend

status-dev: ## Show development environment status
	@echo -e "$(CYAN)Development Environment Status:$(NC)"
	@echo ""
	podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev ps

# ═══════════════════════════════════════════════════════════════════
# Backend Rebuild & Deployment
# ═══════════════════════════════════════════════════════════════════

rebuild-backend-prod: ## Rebuild production backend container with buildah
	@echo -e "$(CYAN)Building production backend container image with buildah...$(NC)"
	buildah bud \
		--format docker \
		--layers \
		--tag localhost/pressograph-backend:latest \
		--tag localhost/pressograph-backend:$(VERSION) \
		--file server/Dockerfile \
		--build-arg NODE_ENV=production \
		--build-arg BUILD_DATE="$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")" \
		--build-arg VERSION=$(VERSION) \
		server/
	@echo -e "$(GREEN)Production backend container image built successfully!$(NC)"
	@echo -e "$(CYAN)Image: localhost/pressograph-backend:latest, localhost/pressograph-backend:$(VERSION)$(NC)"

deploy-backend-prod: ## Deploy production backend (restart with new image)
	@echo -e "$(CYAN)Deploying production backend...$(NC)"
	@echo -e "$(YELLOW)Stopping current backend container...$(NC)"
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod stop backend || true
	@echo -e "$(YELLOW)Removing old backend container...$(NC)"
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod rm -f backend || true
	@echo -e "$(YELLOW)Starting new backend container...$(NC)"
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod up -d backend
	@echo -e "$(GREEN)Production backend deployed successfully!$(NC)"
	@echo -e "$(CYAN)Check status: make status-prod$(NC)"
	@echo -e "$(CYAN)View logs: make logs-backend-prod$(NC)"

backend-prod: rebuild-backend-prod deploy-backend-prod ## Full production backend rebuild and deployment
	@echo -e "$(GREEN)Production backend rebuild and deployment complete!$(NC)"

logs-backend-prod: ## Show production backend logs
	@echo -e "$(CYAN)Showing production backend logs...$(NC)"
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod logs -f --tail 100 backend

# ═══════════════════════════════════════════════════════════════════
# Full Stack Rebuild & Deployment
# ═══════════════════════════════════════════════════════════════════

rebuild-all-prod: rebuild-frontend-prod rebuild-backend-prod ## Rebuild all production containers
	@echo -e "$(GREEN)All production containers rebuilt!$(NC)"

deploy-all-prod: ## Deploy all production services
	@echo -e "$(CYAN)Deploying all production services...$(NC)"
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod up -d
	@echo -e "$(GREEN)All production services deployed!$(NC)"
	@echo ""
	@echo -e "$(CYAN)Access your application:$(NC)"
	@echo -e "  🌐 Frontend: https://pressograph.infra4.dev"
	@echo -e "  🔌 API:      https://pressograph.infra4.dev/api"
	@echo ""
	@echo -e "$(CYAN)Useful commands:$(NC)"
	@echo -e "  📊 Status:  make status-prod"
	@echo -e "  📜 Logs:    make logs-frontend-prod / make logs-backend-prod"
	@echo ""

full-prod: rebuild-all-prod deploy-all-prod ## Full production rebuild and deployment (all services)
	@echo -e "$(GREEN)═══════════════════════════════════════════════════════════════════$(NC)"
	@echo -e "$(GREEN)   Full Production Stack Rebuild & Deployment Complete!$(NC)"
	@echo -e "$(GREEN)═══════════════════════════════════════════════════════════════════$(NC)"

restart-prod: ## Restart all production services without rebuild
	@echo -e "$(CYAN)Restarting all production services...$(NC)"
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod restart
	@echo -e "$(GREEN)All production services restarted!$(NC)"

down-prod: ## Stop all production services
	@echo -e "$(CYAN)Stopping all production services...$(NC)"
	podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod down
	@echo -e "$(GREEN)All production services stopped!$(NC)"
