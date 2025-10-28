.PHONY: help build install uninstall start stop restart status logs clean rebuild
.PHONY: build-buildah build-images build-frontend build-backend validate-tools
.PHONY: create-network create-volume inspect push pull info enable disable
.PHONY: pod-start pod-stop pod-restart pod-logs pod-status

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

dev: ## Run development environment
	@echo -e "$(CYAN)Starting development environment...$(NC)"
	podman-compose -f deploy/compose/docker-compose.dev.yml up -d
	@echo -e "$(GREEN)Development environment started!$(NC)"

prod: ## Run production environment
	@echo -e "$(CYAN)Starting production environment...$(NC)"
	podman-compose -f deploy/compose/docker-compose.prod.yml up -d
	@echo -e "$(GREEN)Production environment started!$(NC)"
