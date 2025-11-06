# ADR-002: Choose Drizzle ORM over Prisma

## Status
Accepted

## Context
We need an ORM/query builder for TypeScript that provides:
- Type safety for database operations
- Good performance with minimal overhead
- Migration management
- Developer-friendly API
- Support for PostgreSQL features

## Decision
We will use Drizzle ORM instead of Prisma for database operations in Pressograph 2.0.

## Consequences

### Positive
- **Performance:** No generated client, queries compile to SQL directly
- **Type inference:** Types are inferred from schema, not generated
- **SQL-like syntax:** Familiar for developers who know SQL
- **Lightweight:** Smaller bundle size and runtime overhead
- **Flexibility:** Can write raw SQL when needed
- **Drizzle Studio:** Built-in database UI for development
- **Better edge runtime support:** Works in edge functions
- **No build step:** No need to regenerate client after schema changes

### Negative
- **Less mature:** Newer than Prisma, smaller community
- **Less abstraction:** More SQL knowledge required
- **Fewer features:** No built-in seeding, less migration features
- **Documentation:** Less comprehensive than Prisma
- **Learning curve:** Different mental model from traditional ORMs

## Alternatives Considered

### Prisma
- **Pros:** Mature, great DX, excellent docs, large community
- **Cons:** Performance overhead, generated client, build step required
- **Why not chosen:** Performance concerns and added complexity of client generation

### TypeORM
- **Pros:** Mature, full-featured, Active Record and Data Mapper patterns
- **Cons:** Decorator-heavy, complex configuration, performance issues
- **Why not chosen:** Too heavy and complex for our needs

### Kysely
- **Pros:** Type-safe SQL builder, minimal overhead, good performance
- **Cons:** Lower level, no migration system, more verbose
- **Why not chosen:** Lacks higher-level features we need

### Raw SQL with pg driver
- **Pros:** Maximum performance, full control
- **Cons:** No type safety, manual everything, SQL injection risks
- **Why not chosen:** Too much manual work and safety concerns