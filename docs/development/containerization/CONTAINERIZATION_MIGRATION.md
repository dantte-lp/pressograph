# Containerization Migration Guide

> **Pressograph → Project Genesis Technology Stack Standards**

This guide documents the migration of Pressograph to comply with [Project Genesis](../../project-genesis) technology stack standards, specifically the containerization requirements.

**Date**: 2025-11-01
**Version**: 1.2.0
**Status**: ✅ Completed

---

## Table of Contents

1. [Overview](#overview)
2. [What Changed](#what-changed)
3. [Why We Migrated](#why-we-migrated)
4. [Migration Details](#migration-details)
5. [Before and After Comparison](#before-and-after-comparison)
6. [Local Development Migration](#local-development-migration)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Plan](#rollback-plan)
9. [Validation](#validation)

---

## Overview

Pressograph has been updated to comply with **Project Genesis technology stack standards**, focusing on containerization best practices. The project now uses **Podman** ecosystem and **Debian-based images** (NO Alpine).

### Key Changes

- ✅ Container engine: **Docker → Podman**
- ✅ Base images: **Debian Trixie-based** (NO Alpine)
- ✅ Compose Spec: **2025 compliant**
- ✅ Security: **Enhanced** (non-root, capability dropping, read-only FS)
- ✅ Documentation: **Comprehensive** containerization guide

### Timeline

- **2025-10-29**: Pressograph v1.1.0 already used Debian Trixie images and Compose Spec 2025
- **2025-11-01**: Updated to Project Genesis standards (documentation, .containerignore, validation)

---

## What Changed

### 1. Configuration Files

#### Added

- `.containerignore` - Build context optimization (NEW)
- `docs/CONTAINERIZATION_MIGRATION.md` - This document (NEW)

#### Updated

- `.scrum-config` - Added comprehensive technology stack section
- `README.md` - Added detailed containerization section with Podman usage
- `.github/workflows/ci.yml` - Added Docker vs Podman documentation

#### Unchanged (Already Compliant)

- `deploy/Containerfile` - Already using Debian Trixie (node:lts-trixie, nginx:1.29-trixie-perl)
- `server/Dockerfile` - Already using Debian Trixie (node:lts-trixie)
- `deploy/compose/compose.dev.yaml` - Already Compose Spec 2025 compliant
- `deploy/compose/compose.prod.yaml` - Already Compose Spec 2025 compliant

### 2. Technology Stack

**Container Technologies:**

```yaml
container_engine: podman # Was: docker (implicit)
container_compose: podman-compose
image_builder: buildah
image_operations: skopeo
oci_runtime: crun
compose_spec_version: '2025'
```

**Base Images (NO CHANGES - Already Compliant):**

```yaml
node_base: 'node:lts-trixie' # Debian Trixie ✅
nginx_base: 'nginx:1.29-trixie-perl' # Debian Trixie ✅
postgres_base: 'postgres:18-trixie' # Debian Trixie ✅
```

**Policy:**

- ❌ **FORBIDDEN**: Alpine Linux (glibc vs musl compatibility issues)
- ✅ **REQUIRED**: Debian Trixie-based images

### 3. Best Practices (Already Implemented)

Pressograph already followed these best practices:

✅ Multi-stage builds
✅ Non-root users (nodejs:1001, nginx:101, postgres:999)
✅ Pinned versions
✅ Health checks with start_period
✅ Resource limits (CPU, memory)
✅ Security hardening (no-new-privileges, cap_drop)
✅ OCI labels
✅ Log rotation
✅ SELinux support (:z suffix)
✅ Compose Spec 2025 (no version field)

---

## Why We Migrated

### Project Genesis Standards

[Project Genesis](../../project-genesis) is our universal technology stack framework. All projects must comply with its standards to ensure:

1. **Consistency**: Same tools across all projects
2. **Security**: Best practices enforced
3. **Maintainability**: Clear documentation and standards
4. **Validation**: Automated compliance checking

### Why Podman?

1. **Rootless by Default**: No daemon running as root (better security)
2. **Daemonless**: No background service required (simpler architecture)
3. **OCI Compatible**: Works with Docker images and Dockerfiles
4. **Kubernetes-Ready**: Pod support built-in
5. **SELinux Integration**: Better security on RHEL-based systems
6. **Drop-in Replacement**: `alias docker=podman` works seamlessly

### Why NO Alpine?

Alpine Linux uses **musl libc** instead of **glibc**, causing compatibility issues:

- Node.js native modules (like Canvas) have compilation issues
- Different DNS resolution behavior
- Font rendering problems (critical for Pressograph's Canvas usage)
- Debugging tools are limited

**Debian Trixie** provides:

- Better compatibility with Node.js ecosystem
- More packages available
- Stable base for production
- Excellent font support (critical for Canvas text rendering)

---

## Migration Details

### Phase 1: Analysis (Already Done)

Pressograph was analyzed and found to be **already compliant** with most standards:

- ✅ Using Debian Trixie images (NOT Alpine)
- ✅ Using Compose Spec 2025
- ✅ Multi-stage builds
- ✅ Non-root users
- ✅ Health checks
- ✅ Security hardening

### Phase 2: Documentation (Completed)

Updated documentation to explicitly document Podman usage and compliance:

1. **README.md**: Added comprehensive containerization section
2. **.scrum-config**: Added technology stack section
3. **.containerignore**: Created build optimization file
4. **ci.yml**: Documented Docker (CI) vs Podman (local/prod) strategy
5. **This guide**: Complete migration documentation

### Phase 3: No Code Changes Required

Because Pressograph already used Debian-based images and followed best practices, **NO changes to Containerfiles or compose files were required**.

---

## Before and After Comparison

### Containerfiles

**Before (v1.1.0):**

```dockerfile
# Already using Debian Trixie
FROM node:lts-trixie AS builder
FROM nginx:1.29-trixie-perl
```

**After (v1.2.0):**

```dockerfile
# NO CHANGES - Already compliant
FROM node:lts-trixie AS builder
FROM nginx:1.29-trixie-perl
```

### Compose Files

**Before (v1.1.0):**

```yaml
# Already Compose Spec 2025 compliant
# (no version field, YAML anchors, health checks, etc.)
services:
  postgres:
    image: docker.io/library/postgres:18-trixie
```

**After (v1.2.0):**

```yaml
# NO CHANGES - Already compliant
services:
  postgres:
    image: docker.io/library/postgres:18-trixie
```

### Commands

**Before:**

```bash
docker-compose up -d
docker ps
docker build -t myimage .
```

**After:**

```bash
podman-compose up -d
podman ps
podman build -t myimage .

# Or with alias for compatibility:
alias docker=podman
alias docker-compose=podman-compose
```

---

## Local Development Migration

### Step 1: Install Podman

**Fedora/RHEL/CentOS:**

```bash
sudo dnf install podman podman-compose
```

**Debian/Ubuntu:**

```bash
sudo apt install podman podman-compose
```

**Verify Installation:**

```bash
podman --version
podman-compose --version
```

### Step 2: Stop Existing Docker Containers (If Any)

```bash
# Stop and remove old containers
docker-compose -f deploy/compose/compose.dev.yaml down

# Verify nothing is running
docker ps -a
```

### Step 3: Set Up Podman Aliases (Optional but Recommended)

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Podman aliases for Docker compatibility
alias docker=podman
alias docker-compose=podman-compose
```

Reload shell:

```bash
source ~/.bashrc  # or source ~/.zshrc
```

### Step 4: Start with Podman

```bash
cd /opt/projects/repositories/pressograph

# Initialize environment (if not done)
make init-env-dev

# Start with Podman Compose
make dev-compose

# Or manually:
podman-compose -f deploy/compose/compose.dev.yaml \
  --env-file deploy/compose/.env.dev up -d
```

### Step 5: Verify Everything Works

```bash
# Check container status
podman-compose -f deploy/compose/compose.dev.yaml ps

# Check logs
podman-compose -f deploy/compose/compose.dev.yaml logs -f

# Test application
curl https://dev-pressograph.infra4.dev/health
```

### Step 6: (Optional) Clean Up Docker

If you want to completely remove Docker:

```bash
# Stop Docker service
sudo systemctl stop docker
sudo systemctl disable docker

# Remove Docker packages (BE CAREFUL!)
# Fedora/RHEL/CentOS:
sudo dnf remove docker-ce docker-ce-cli containerd.io

# Debian/Ubuntu:
sudo apt remove docker-ce docker-ce-cli containerd.io

# Remove Docker data (CAUTION: This deletes all Docker images/volumes!)
sudo rm -rf /var/lib/docker
```

---

## Troubleshooting

### Issue 1: Permission Denied on Volumes

**Error:**

```
Error: error creating container storage: the container name "pressograph-dev-backend" is already in use
```

**Solution:**

```bash
# Remove old containers
podman rm -f pressograph-dev-backend

# Or prune all stopped containers
podman container prune
```

### Issue 2: SELinux Permission Issues

**Error:**

```
Error: OCI runtime error: permission denied
```

**Solution:**
Volume mounts already have `:z` suffix for SELinux relabeling:

```yaml
volumes:
  - ../../server:/app:z # ← :z suffix enables SELinux relabeling
```

If issues persist:

```bash
# Temporarily set SELinux to permissive (NOT for production!)
sudo setenforce 0

# Check SELinux status
sestatus

# Re-enable SELinux
sudo setenforce 1
```

### Issue 3: Port Already in Use

**Error:**

```
Error: rootlessport cannot expose privileged port 80
```

**Solution:**
Pressograph uses Traefik for routing, so services don't need to expose privileged ports directly. Ensure Traefik is running:

```bash
# Check if Traefik is running
podman ps | grep traefik

# If not, start Traefik (in your Traefik project)
cd /path/to/traefik
podman-compose up -d
```

### Issue 4: Container Can't Connect to Host

**Error:**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
Use `host.containers.internal` instead of `localhost`:

```bash
# In .env file:
DATABASE_URL=postgresql://host.containers.internal:5432/pressograph
```

### Issue 5: Images Not Found

**Error:**

```
Error: image not found in manifest list
```

**Solution:**

```bash
# Pull images explicitly
podman pull docker.io/library/node:lts-trixie
podman pull docker.io/library/nginx:1.29-trixie-perl
podman pull docker.io/library/postgres:18-trixie

# Or let compose pull them
podman-compose -f deploy/compose/compose.dev.yaml pull
```

### Issue 6: Compose Version Conflicts

**Error:**

```
Error: unsupported Compose version
```

**Solution:**
Pressograph uses Compose Spec 2025 (no version field). Update podman-compose:

```bash
# Install latest podman-compose
pip3 install --upgrade podman-compose

# Or on Fedora:
sudo dnf update podman-compose
```

---

## Rollback Plan

If you encounter issues and need to rollback to Docker:

### Step 1: Stop Podman Containers

```bash
podman-compose -f deploy/compose/compose.dev.yaml down
```

### Step 2: Remove Podman Aliases

Remove from `~/.bashrc` or `~/.zshrc`:

```bash
# Remove these lines:
alias docker=podman
alias docker-compose=podman-compose
```

Reload shell:

```bash
source ~/.bashrc
```

### Step 3: Start with Docker

```bash
# Use Docker Compose
docker-compose -f deploy/compose/compose.dev.yaml \
  --env-file deploy/compose/.env.dev up -d
```

### Note on Compatibility

The Containerfiles and compose files are **100% compatible** with both Docker and Podman. You can switch back and forth without code changes.

---

## Validation

### Manual Validation

**Check base images:**

```bash
# Frontend Containerfile
grep "FROM" deploy/Containerfile
# Expected: node:lts-trixie, nginx:1.29-trixie-perl

# Backend Dockerfile
grep "FROM" server/Dockerfile
# Expected: node:lts-trixie

# Compose files
grep "image:" deploy/compose/compose.dev.yaml
# Expected: postgres:18-trixie, node:lts-trixie
```

**Check for Alpine (should find NONE):**

```bash
grep -r "alpine" deploy/
# Expected: No results (except in comments explaining why we don't use it)
```

**Check Compose Spec compliance:**

```bash
# Check for deprecated version field (should NOT exist)
grep "^version:" deploy/compose/*.yaml
# Expected: No results
```

### Automated Validation

Run Project Genesis validation script:

```bash
cd /opt/projects/repositories/pressograph
../project-genesis/scripts/validate-tech-stack.sh
```

**Expected Output:**

```
✅ No Alpine images detected
✅ All base images use Debian Trixie
✅ Compose files are Spec 2025 compliant
✅ Non-root users configured
✅ Health checks present
✅ Resource limits defined
```

---

## Summary

### What Was Already Compliant

- ✅ Debian Trixie base images (NO Alpine)
- ✅ Compose Spec 2025
- ✅ Multi-stage builds
- ✅ Non-root users
- ✅ Health checks
- ✅ Security hardening
- ✅ Resource limits
- ✅ OCI labels

### What We Added

- ✅ `.containerignore` file
- ✅ Comprehensive documentation
- ✅ Technology stack section in `.scrum-config`
- ✅ Migration guide (this document)
- ✅ CI/CD documentation

### What We Didn't Change

- ✅ Containerfiles (already compliant)
- ✅ Compose files (already compliant)
- ✅ Application code (no changes needed)

### Breaking Changes

**NONE**. The migration is **100% backward compatible**. Developers can continue using Docker if needed (though Podman is recommended).

---

## Next Steps

1. **Developers**: Read this guide and migrate to Podman
2. **CI/CD**: No changes needed (GitHub Actions uses Docker)
3. **Production**: Already using Podman (no changes needed)
4. **Monitoring**: Validate compliance periodically

---

## References

- [Project Genesis](../../project-genesis)
- [Project Genesis Containerization Guide](../../project-genesis/docs/guides/CONTAINERIZATION_GUIDE.md)
- [Pressograph README](../README.md)
- [Podman Documentation](https://docs.podman.io/)
- [Compose Specification](https://compose-spec.io/)

---

**Questions?**

- Check [Project Genesis Containerization Guide](../../project-genesis/docs/guides/CONTAINERIZATION_GUIDE.md)
- See [README.md Troubleshooting Section](../README.md#troubleshooting)
- Review compose file comments for detailed explanations

---

**Last Updated**: 2025-11-01
**Version**: 1.2.0
**Status**: ✅ Migration Complete
