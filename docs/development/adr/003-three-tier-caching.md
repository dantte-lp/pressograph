# ADR-003: Implement Three-Tier Caching Strategy

## Status
Accepted

## Context
Theme preferences and user data need to be:
- Instantly accessible (no FOUC - Flash of Unstyled Content)
- Synchronized across devices for logged-in users
- Available for anonymous users
- Performant at scale
- Resilient to cache failures

## Decision
Implement a three-tier caching strategy:
1. **Tier 1 - Cookies:** Immediate access, works offline
2. **Tier 2 - Valkey Cache:** Fast memory access, shared across servers
3. **Tier 3 - Database:** Persistent storage, source of truth

## Consequences

### Positive
- **No FOUC:** Cookie tier provides instant theme on page load
- **Performance:** Multiple cache layers reduce database load
- **Resilience:** System degrades gracefully if cache fails
- **Flexibility:** Works for both authenticated and anonymous users
- **Scalability:** Cache reduces database queries at scale
- **User Experience:** Fast theme switching and preference loading

### Negative
- **Complexity:** Three systems to maintain and sync
- **Consistency:** Potential for cache inconsistencies
- **Debugging:** Harder to debug issues across multiple layers
- **Cache invalidation:** Complex invalidation logic needed
- **Memory usage:** Additional memory for cache layer

## Implementation Details

### Read Path (Waterfall)
1. Check cookie (fastest)
2. If miss, check Valkey cache (fast)
3. If miss, check database (slower)
4. Backfill cache layers on miss

### Write Path (Parallel)
1. Update all three tiers simultaneously
2. Cookie for immediate effect
3. Cache for next request
4. Database for persistence

### TTL Strategy
- Cookies: 1 year (client-side)
- Valkey: 1 hour (server-side)
- Database: Permanent

## Alternatives Considered

### Cookie Only
- **Pros:** Simple, works offline, no server state
- **Cons:** Not synchronized across devices, limited size
- **Why not chosen:** No cross-device sync for logged-in users

### Database Only
- **Pros:** Simple, consistent, single source of truth
- **Cons:** Slow, high database load, poor UX
- **Why not chosen:** Too slow for theme preferences

### Local Storage + Database
- **Pros:** Client-side performance, server persistence
- **Cons:** Not available in SSR, requires JS
- **Why not chosen:** Can't prevent FOUC, doesn't work in SSR

### Two-Tier (Cache + Database)
- **Pros:** Simpler than three-tier, good performance
- **Cons:** Still has FOUC, no instant theme on SSR
- **Why not chosen:** Cookie tier essential for preventing FOUC