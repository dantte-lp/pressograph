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

# Image names
FRONTEND_IMAGE := $(REGISTRY)/$(IMAGE_PREFIX)-frontend:latest
BACKEND_IMAGE := $(REGISTRY)/$(IMAGE_PREFIX)-backend:latest

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
