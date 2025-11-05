# Known Issues - Sprint 2: Infrastructure Hardening

**Sprint Dates:** 2025-11-03 → 2025-11-10
**Last Updated:** 2025-11-03

## Overview

This document tracks known issues discovered during Sprint 2 infrastructure hardening work. Issues are categorized by severity and include recommended resolution paths.

---

## Critical Issues

### CI-001: Cloudflare SSL Handshake Failure (Error 525)

**Status:** Identified, Awaiting Resolution
**Severity:** High (blocks HTTPS access to observability UIs)
**Affected Services:**
- Grafana UI (https://dev-grafana.infra4.dev)
- VictoriaLogs UI (https://dev-vl.infra4.dev)
- VictoriaTraces UI (https://dev-vt.infra4.dev)
- VictoriaMetrics UI (https://dev-vm.infra4.dev)

**Description:**
Services return "error code: 525" (SSL Handshake Failed) when accessed via HTTPS through Cloudflare proxy. This is NOT an infrastructure or Traefik configuration issue - all services are properly configured and accessible internally.

**Root Cause:**
Cloudflare is configured in "Orange Cloud" (proxied) mode and requires SSL validation with the origin server. The current Cloudflare SSL mode (likely "Full" or "Full (strict)") cannot complete the SSL handshake with Traefik's Let's Encrypt certificates issued via Cloudflare DNS-01 challenge.

**Evidence:**
```bash
# Internal connectivity works perfectly:
$ podman exec traefik wget -qO- http://pressograph-grafana:3000/api/health
{"database":"ok","version":"12.2.1","commit":"563109b696e9c1cbaf345f2ab7a11f7f78422982"}

# Traefik routing configured correctly:
"grafana-dev": {
  "rule": "Host(`dev-grafana.infra4.dev`)",
  "service": "grafana-dev",
  "loadBalancer": {"servers": [{"url": "http://10.89.1.216:3000"}]}
}

# DNS resolves to Cloudflare proxy IPs:
$ dig +short dev-grafana.infra4.dev
104.21.68.10    # Cloudflare proxy IP
172.67.184.154  # Cloudflare proxy IP

# HTTPS access fails with 525:
$ curl -I https://dev-grafana.infra4.dev
HTTP/2 525
```

**Resolution Options:**

**Option A: Change Cloudflare SSL Mode to "Flexible"** (Recommended for Dev)
- **Action:** In Cloudflare dashboard → SSL/TLS → Overview → Set to "Flexible"
- **Impact:** Cloudflare→Origin connection uses HTTP (unencrypted)
- **Pros:** Quick fix, works immediately
- **Cons:** Traffic between Cloudflare and origin is unencrypted
- **Best for:** Development environment (current situation)
- **Time:** ~5 minutes

**Option B: Disable Cloudflare Proxy (Gray Cloud)**
- **Action:** In Cloudflare DNS settings → Click orange cloud to disable proxy
- **Impact:** DNS-only mode, no Cloudflare proxy/cache
- **Pros:** Direct connection to Traefik SSL
- **Cons:** Lose Cloudflare DDoS protection, caching, WAF
- **Best for:** Testing environments not requiring Cloudflare features
- **Time:** ~2 minutes per domain

**Option C: Configure Cloudflare Origin CA Certificates** (Production Solution)
- **Action:** Generate Cloudflare Origin CA certificate → Install in Traefik
- **Impact:** Cloudflare can validate origin SSL
- **Pros:** Secure end-to-end encryption, keeps Cloudflare features
- **Cons:** More complex setup, certificate management required
- **Best for:** Production environment
- **Time:** ~30 minutes initial setup
- **Reference:** https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/

**Recommended Action:**
For the development environment, use **Option A (Flexible SSL)** immediately to unblock access. Plan **Option C (Origin CA)** for production deployment.

**Workaround:**
Access services via port forwarding until SSL is resolved:
```bash
# Temporary port forward (run on server):
podman exec -it traefik sh -c 'while true; do nc -l -p 13000 -c "nc pressograph-grafana 3000"; done'

# Then access via http://SERVER_IP:13000
```

**Related Issues:**
- Same issue affects any new Traefik-routed service with Cloudflare proxy
- Does NOT affect services on gray-cloud DNS records

**Next Steps:**
1. Coordinate with infrastructure/DNS administrator for Cloudflare access
2. Implement Option A for immediate dev environment access
3. Document Option C for production deployment checklist

---

## Medium Issues

### MI-001: vmagent Configuration Format Incompatibility (RESOLVED)

**Status:** ✅ Resolved in this sprint
**Severity:** Medium (caused warnings but vmagent still functioned)

**Description:**
vmagent config file used Prometheus `global:` and `remote_write:` sections which are not supported in vmagent's `-promscrape.config` file format.

**Resolution:**
Rewrote configuration to use vmagent-native format:
- Moved global settings to command-line flags
- Moved remote_write to command-line flags
- Config file now contains ONLY `scrape_configs:` section

**Reference:** See COMPLETED_WORK.md section "vmagent Configuration Rewrite"

---

### MI-002: Uptrace Environment Variable Substitution Failures (RESOLVED)

**Status:** ✅ Resolved in this sprint
**Severity:** Medium (prevented Uptrace startup)

**Description:**
Uptrace configuration file used `${VARIABLE}` syntax for environment variable substitution, which caused parsing errors on startup.

**Resolution:**
Rewrote configuration based on official Uptrace Docker examples:
- Removed environment variable substitution from config file
- Used hardcoded values for site URL and infrastructure settings
- Implemented `seed_data:` structure for bootstrap configuration
- Secrets can still be overridden via docker-compose environment variables if needed

**Reference:** See COMPLETED_WORK.md section "Uptrace Configuration Enhancement"

---

## Low Issues

### LI-001: Drizzle Schema Relation Bug (Application-Level)

**Status:** Open, Low Priority
**Severity:** Low (development experience issue, not blocking)
**Affected Area:** Application code, not infrastructure

**Description:**
When defining bidirectional relations in Drizzle schema (e.g., User ↔ Post), the relation appears twice in TypeScript types, causing potential confusion and requiring explicit typing in queries.

**Example:**
```typescript
// Schema definition:
export const users = pgTable('users', { ... });
export const posts = pgTable('posts', { ... });

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts)
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] })
}));

// Result: 'posts' relation appears in User type twice
```

**Impact:**
- Minor developer experience issue
- Does not affect functionality
- Queries still work correctly
- Only affects TypeScript type inference

**Workaround:**
Explicitly type queries when accessing relations:
```typescript
const userWithPosts: { user: User; posts: Post[] } = await db.query.users.findFirst({
  with: { posts: true }
});
```

**Resolution Plan:**
- Monitor Drizzle ORM issue tracker for official fix
- Consider alternative schema patterns if issue persists
- Not blocking sprint work or production deployment

**Related:**
- Drizzle ORM GitHub issue (to be filed if not exists)
- Similar patterns in other ORM libraries

---

### LI-002: Redis Exporter Health Check Intermittent Failures

**Status:** Open, Investigating
**Severity:** Low (does not affect Redis functionality)

**Description:**
The `pressograph-dev-redis-exporter` occasionally reports unhealthy status despite Redis (Valkey) being fully operational and metrics being exported correctly.

**Evidence:**
```bash
$ podman ps | grep redis-exporter
pressograph-dev-redis-exporter | Up 47 minutes (unhealthy) | 9121/tcp
```

**Investigation:**
- Exporter continues to serve metrics on port 9121
- vmagent successfully scrapes metrics from exporter
- Valkey is healthy and responding to queries
- Health check may have incorrect endpoint or timeout

**Next Steps:**
1. Review redis-exporter health check configuration
2. Verify correct health check endpoint (/health vs /metrics)
3. Adjust timeout if health check is slow
4. May require exporter configuration update

**Priority:** Low - does not impact functionality, only orchestration visibility

---

## Resolved Issues (Historical Reference)

### RI-001: Health Checks Using Incorrect Bind Address (RESOLVED)

**Status:** ✅ Resolved in this sprint
**Resolution Date:** 2025-11-03

**Description:**
Health checks across all services used `localhost:PORT` or `127.0.0.1:PORT` which failed in containerized environments.

**Resolution:**
Updated all health check commands to use `0.0.0.0:PORT` which correctly resolves within Podman/Docker containers.

**Files Modified:**
- All compose files (compose.dev.yaml, compose.victoria.yaml, compose.uptrace.yaml)

**Impact:**
All containers now properly report health status to Podman/Docker orchestration layer.

---

### RI-002: ClickHouse Health Check Incorrect Port (RESOLVED)

**Status:** ✅ Resolved in this sprint
**Resolution Date:** 2025-11-03

**Description:**
ClickHouse health check used port 9000 (native protocol) instead of port 8123 (HTTP interface).

**Resolution:**
```yaml
# OLD (incorrect):
healthcheck:
  test: ["CMD", "wget", "-q", "-O-", "http://localhost:9000/ping"]

# NEW (correct):
healthcheck:
  test: ["CMD", "wget", "-q", "-O-", "http://0.0.0.0:8123/ping"]
```

**Impact:**
ClickHouse now properly reports health status, improving Uptrace startup reliability.

---

## Issue Tracking Guidelines

**When to Add an Issue Here:**
- Infrastructure-level problems affecting multiple services
- Configuration issues that block development or deployment
- Security or performance concerns discovered during sprint
- Known limitations or workarounds that need documentation

**When to Create a GitHub Issue Instead:**
- Application code bugs
- Feature requests
- Individual service improvements
- Long-term architectural changes

**Status Definitions:**
- **Identified:** Issue confirmed, root cause understood
- **Investigating:** Issue confirmed, root cause being determined
- **Awaiting Resolution:** Solution known, waiting for external action
- **Resolved:** Issue fixed and verified
- **Open:** Issue tracked but not actively being addressed

---

## References

- [Sprint 2 Completed Work](./COMPLETED_WORK.md)
- [GitHub Milestone](https://github.com/dantte-lp/pressograph/milestone/17)
- [Cloudflare SSL/TLS Documentation](https://developers.cloudflare.com/ssl/)
- [Traefik Let's Encrypt Documentation](https://doc.traefik.io/traefik/https/acme/)
- [VictoriaMetrics vmagent Documentation](https://docs.victoriametrics.com/vmagent/)
- [Uptrace Configuration Reference](https://uptrace.dev/get/hosted/config)

---

**Next Review:** End of Sprint 2 (2025-11-10)
**Owner:** Infrastructure Team
**Distribution:** Development team, DevOps, Project stakeholders
