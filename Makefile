.PHONY: help dev prod build clean stop logs install test lint
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Directories
COMPOSE_DIR := deploy/compose
PROJECT_NAME := pressure-test-visualizer

help: ## Show this help message
	@echo -e "$(CYAN)Pressure Test Visualizer$(NC)"
	@echo ""
	@echo -e "$(GREEN)Available targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo -e "$(YELLOW)Prerequisites:$(NC)"
	@echo "  - Podman or Docker"
	@echo "  - Podman Compose or Docker Compose"
	@echo ""
	@echo -e "$(CYAN)Quick Start:$(NC)"
	@echo "  make dev      # Start development server (hot reload)"
	@echo "  make build    # Build production image"
	@echo "  make prod     # Run production container"
	@echo ""

check-compose: ## Check if podman-compose is available
	@if command -v podman-compose >/dev/null 2>&1; then \
		echo -e "$(GREEN)✓ Using podman-compose$(NC)"; \
	elif command -v docker-compose >/dev/null 2>&1; then \
		echo -e "$(YELLOW)⚠ Using docker-compose (podman-compose not found)$(NC)"; \
	else \
		echo -e "$(RED)✗ Neither podman-compose nor docker-compose found$(NC)"; \
		echo "Install podman-compose: pip install podman-compose"; \
		exit 1; \
	fi

# Helper to use correct compose command
COMPOSE_CMD := $(shell command -v podman-compose 2>/dev/null || command -v docker-compose 2>/dev/null)

dev: check-compose ## Start development server with hot reload
	@echo -e "$(CYAN)Starting development server...$(NC)"
	$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.dev.yml up

dev-build: check-compose ## Rebuild and start development server
	@echo -e "$(CYAN)Rebuilding development environment...$(NC)"
	$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.dev.yml up --build

dev-down: check-compose ## Stop development server
	@echo -e "$(CYAN)Stopping development server...$(NC)"
	$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.dev.yml down

build: check-compose ## Build production Docker image
	@echo -e "$(CYAN)Building production image...$(NC)"
	$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.prod.yml build
	@echo -e "$(GREEN)✓ Build complete!$(NC)"

prod: check-compose ## Run production container
	@echo -e "$(CYAN)Starting production server...$(NC)"
	$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.prod.yml up -d
	@echo -e "$(GREEN)✓ Production server started at http://localhost:8080$(NC)"

prod-down: check-compose ## Stop production container
	@echo -e "$(CYAN)Stopping production server...$(NC)"
	$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.prod.yml down

logs: ## Show logs (use ENV=dev or ENV=prod, default: dev)
	@if [ "$(ENV)" = "prod" ]; then \
		echo -e "$(CYAN)Production logs (Ctrl+C to exit)...$(NC)"; \
		$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.prod.yml logs -f; \
	else \
		echo -e "$(CYAN)Development logs (Ctrl+C to exit)...$(NC)"; \
		$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.dev.yml logs -f; \
	fi

clean: ## Clean up containers, volumes, and images
	@echo -e "$(CYAN)Cleaning up...$(NC)"
	-$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.dev.yml down -v 2>/dev/null
	-$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.prod.yml down -v 2>/dev/null
	-podman rmi $(PROJECT_NAME):latest 2>/dev/null || docker rmi $(PROJECT_NAME):latest 2>/dev/null || true
	@echo -e "$(GREEN)✓ Cleanup complete!$(NC)"

stop: ## Stop all containers
	@echo -e "$(CYAN)Stopping all containers...$(NC)"
	-$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.dev.yml down 2>/dev/null
	-$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.prod.yml down 2>/dev/null
	@echo -e "$(GREEN)✓ All containers stopped$(NC)"

install: ## Install npm dependencies locally (for IDE support)
	@echo -e "$(CYAN)Installing dependencies...$(NC)"
	npm install
	@echo -e "$(GREEN)✓ Dependencies installed$(NC)"

lint: ## Run ESLint
	@echo -e "$(CYAN)Running linter...$(NC)"
	npm run lint

test: check-compose ## Run tests in container
	@echo -e "$(CYAN)Running tests...$(NC)"
	$(COMPOSE_CMD) -f $(COMPOSE_DIR)/docker-compose.dev.yml run --rm frontend-dev npm test

status: ## Show container status
	@echo -e "$(CYAN)Container Status:$(NC)"
	@echo ""
	@if command -v podman >/dev/null 2>&1; then \
		podman ps -a --filter "name=$(PROJECT_NAME)" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"; \
	else \
		docker ps -a --filter "name=$(PROJECT_NAME)" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"; \
	fi

info: ## Show system information
	@echo -e "$(CYAN)System Information:$(NC)"
	@echo ""
	@echo -e "$(YELLOW)OS:$(NC)"
	@cat /etc/os-release | grep -E '^(NAME|VERSION)=' || true
	@echo ""
	@echo -e "$(YELLOW)Container Runtime:$(NC)"
	@if command -v podman >/dev/null 2>&1; then \
		podman --version; \
	elif command -v docker >/dev/null 2>&1; then \
		docker --version; \
	else \
		echo "No container runtime found"; \
	fi
	@echo ""
	@echo -e "$(YELLOW)Compose:$(NC)"
	@if command -v podman-compose >/dev/null 2>&1; then \
		podman-compose --version; \
	elif command -v docker-compose >/dev/null 2>&1; then \
		docker-compose --version; \
	else \
		echo "No compose tool found"; \
	fi
	@echo ""
	@echo -e "$(YELLOW)Node.js (local):$(NC)"
	@if command -v node >/dev/null 2>&1; then \
		node --version; \
	else \
		echo "Not installed (using container)"; \
	fi

rebuild: clean build ## Clean and rebuild everything

restart-dev: dev-down dev ## Restart development server

restart-prod: prod-down prod ## Restart production server
