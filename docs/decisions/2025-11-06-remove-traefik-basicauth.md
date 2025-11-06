# Architectural Decision: Remove Traefik BasicAuth

**Date:** 2025-11-06
**Status:** Decided
**Issue:** #45 (Closed)

## Context

Initially, the project planned to implement Traefik-level BasicAuth authentication for securing the development environment at `dev-pressograph.infra4.dev` and `dbdev-pressograph.infra4.dev`.

## Decision

We have decided to **remove Traefik BasicAuth** from the project scope and rely entirely on **NextAuth** for application-level authentication.

## Rationale

1. **Better User Experience**: Application-level auth provides a more seamless experience with proper login/logout flows
2. **Single Authentication System**: Avoiding duplicate authentication systems (Traefik + NextAuth)
3. **Simplified Architecture**: One less infrastructure component to configure and maintain
4. **NextAuth Already Implemented**: Issue #37 completed on 2025-11-05 with full NextAuth integration
5. **Development Focus**: For development environment, application-level auth is sufficient

## Consequences

### Positive
- Reduced Sprint 1 scope by 5 SP (from 27 to 22 SP)
- Improved sprint velocity requirements (1.2 SP/day vs 1.6 SP/day)
- Simpler deployment and configuration
- Better user experience with proper auth UI
- No need to manage separate BasicAuth credentials

### Negative
- Development environment relies solely on application authentication
- No infrastructure-level protection (mitigated by NextAuth being mandatory)

## Impact on Other Issues

- **Issue #46 (Drizzle Studio Routing)**: Under review - may not need external access at all
  - Option A: Close if external access not needed (use SSH port-forwarding)
  - Option B: Implement with NextAuth instead of BasicAuth
  - Option C: Reduce priority and defer

## Implementation

1. ✅ Closed Issue #45 with explanation
2. ✅ Updated Sprint 1 documentation (PLAN.md)
3. ✅ Updated CHANGELOG.md
4. ✅ Updated Development Roadmap
5. ✅ Added comment to Issue #46 about dependency change
6. ✅ Committed all changes with detailed commit message

## Sprint 1 Impact

- **Original Scope:** 27 SP
- **New Scope:** 22 SP
- **Completion:** 41% (9 SP done, 13 SP remaining)
- **Status:** On track for successful completion

## Security Considerations

Application-level authentication via NextAuth provides adequate security for the development environment. Production deployments should consider additional security layers based on specific requirements.

## References

- GitHub Issue #45: https://github.com/dantte-lp/pressograph/issues/45
- GitHub Issue #46: https://github.com/dantte-lp/pressograph/issues/46
- GitHub Issue #37: https://github.com/dantte-lp/pressograph/issues/37 (NextAuth implementation)
- Commit: d99c7a51