# ADR-001: Use Next.js App Router

## Status
Accepted

## Context
We need to choose a frontend framework for Pressograph 2.0. The application requires:
- Server-side rendering for SEO and performance
- Type safety throughout the application
- Good developer experience
- Production-ready ecosystem
- Long-term support and stability

## Decision
We will use Next.js 15 with the App Router architecture for the Pressograph frontend.

## Consequences

### Positive
- **React Server Components:** Reduced client bundle size and improved performance
- **Server Actions:** Type-safe server mutations without API endpoints
- **File-based routing:** Intuitive project structure
- **Built-in optimizations:** Image optimization, font loading, script optimization
- **Streaming SSR:** Better perceived performance with progressive rendering
- **Middleware support:** Request interception for auth and theme management
- **Excellent TypeScript support:** First-class TS integration
- **Large ecosystem:** Extensive community and package support
- **Vercel backing:** Well-funded and actively developed

### Negative
- **Learning curve:** App Router is different from Pages Router
- **Complexity:** More concepts to understand (RSC, Server Actions, etc.)
- **Vendor influence:** Heavy Vercel influence on direction
- **Bundle size:** Still larger than some alternatives like Svelte
- **Breaking changes:** Major version updates can require significant refactoring

## Alternatives Considered

### Remix
- **Pros:** Good DX, nested routing, progressive enhancement focus
- **Cons:** Smaller ecosystem, less mature, fewer learning resources
- **Why not chosen:** Next.js has better ecosystem support and more production deployments

### Vite + React
- **Pros:** Fast builds, simple configuration, flexible
- **Cons:** No built-in SSR, need to configure everything manually
- **Why not chosen:** Requires too much custom setup for SSR and optimization

### SvelteKit
- **Pros:** Smaller bundle sizes, simpler mental model, fast
- **Cons:** Smaller ecosystem, less TypeScript maturity, fewer developers
- **Why not chosen:** Team familiarity with React and larger ecosystem needs

### Nuxt 3 (Vue)
- **Pros:** Good DX, auto-imports, good performance
- **Cons:** Vue ecosystem smaller than React, less TS support
- **Why not chosen:** React ecosystem advantages and team experience