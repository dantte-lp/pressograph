# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Pressograph project.

## What is an ADR?

An Architecture Decision Record captures an important architectural decision made along with its context and consequences.

## ADR Template

```markdown
# ADR-XXX: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-YYY]

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?

### Positive
- List of positive consequences

### Negative
- List of negative consequences

## Alternatives Considered
- Alternative 1: Description and why it was not chosen
- Alternative 2: Description and why it was not chosen
```

## Index of ADRs

1. [ADR-001: Use Next.js App Router](./001-nextjs-app-router.md)
2. [ADR-002: Choose Drizzle ORM over Prisma](./002-drizzle-orm.md)
3. [ADR-003: Implement Three-Tier Caching](./003-three-tier-caching.md)
4. [ADR-004: Use Valkey instead of Redis](./004-valkey-cache.md)
5. [ADR-005: Monolithic Architecture](./005-monolithic-architecture.md)