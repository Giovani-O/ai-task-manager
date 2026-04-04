# AGENTS.md — AI Coding Agent Guide

## Repository Overview

Pnpm monorepo with two workspaces:
- `client/` — React 19 + Vite + TanStack Router SPA
- `api/` — Fastify v5 + Drizzle ORM + PostgreSQL REST API

**Requirements:** Node.js >= 22, pnpm 10+

---

## Commands

### Development

```bash
# Start API dev server
cd api && pnpm dev

# Start client dev server
cd client && pnpm dev
```

### Build

```bash
pnpm --filter api build       # tsc
pnpm --filter client build    # tsc -b && vite build
```

### Lint / Format / Check

```bash
# From repo root (covers both workspaces)
pnpm lint       # biome lint
pnpm format     # biome format --write
pnpm check      # biome check --write (lint + format)

# Per workspace
cd api && pnpm check
cd client && pnpm check
```

### Tests

```bash
# Run all tests in a workspace
pnpm --filter api test
pnpm --filter client test

# Run a single test file
cd api   && pnpm vitest run src/tests/routes/lists-users.test.ts
cd client && pnpm vitest run src/routes/_layout/__tests__/users.test.tsx

# Run tests matching a name pattern
cd api && pnpm vitest run --reporter=verbose -t "test name pattern"

# Watch mode
cd api && pnpm test:watch
```

**API tests** spin up a real PostgreSQL 17 container via Testcontainers on first run — this takes ~10–20 s the first time.

### Database

```bash
cd api
pnpm db:generate   # drizzle-kit generate (after schema changes)
pnpm db:migrate    # run migrations
pnpm db:studio     # open Drizzle Studio
pnpm db:seed       # seed database with fake data
```

---

## Package Installation Rules

- **Always use `pnpm`** — never npm or yarn.
- **Ask before installing** any new package.
- **shadcn/ui components:** `pnpm dlx shadcn add <component> --preset b6rG9zk5C6`
- **Documentation lookup:** Use Context7 MCP for library docs before writing code.

---

## Code Style

### Formatting (Biome)

- 2-space indentation
- 80-character line width
- Single quotes for strings
- Semicolons only as needed (ASI — no trailing semicolons)
- Run `pnpm check` before claiming work is done

### TypeScript

- `strict: true` in both workspaces — no compiler errors allowed
- Client also enforces `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`
- **Use `import type`** for type-only imports (enforced by `verbatimModuleSyntax` in client)
- Prefer explicit return types on utility/service functions
- Use `type` keyword (not `interface`) for object shapes
- Avoid `any` — Biome warns; find the correct type
- Avoid non-null assertions (`!`) — Biome warns; use nullish coalescing or guards

### Imports

1. Third-party packages first (alphabetical)
2. Internal `@/` aliased paths second
3. Type-only imports use `import type`
4. **Always use `@/` alias** for internal imports — never relative paths (`../`)
5. Node built-ins use the `node:` prefix: `import path from 'node:path'`
6. Named imports strongly preferred; default imports only when a library forces it

```typescript
// Correct
import { useQuery } from '@tanstack/react-query'
import type * as React from 'react'
import { UserTable } from '@/components/user-table'
import type { User } from '@/types/user'
```

### Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| React components | PascalCase | `AppSidebar`, `UsersPage` |
| Non-component functions | camelCase | `formatDateTime`, `listUsers` |
| Constants | SCREAMING_SNAKE_CASE | `PAGE_SIZE` |
| Types / type aliases | PascalCase | `User`, `TaskStatus` |
| React hooks | `use` prefix, camelCase | `useIsMobile` |
| Files | kebab-case | `app-sidebar.tsx`, `list-users.ts` |
| Test files | `*.test.ts(x)` in `__tests__/` or `tests/` subdirectory |
| DB columns | snake_case (Drizzle `casing: 'snake_case'`) | `created_at` |

### File Structure

```
api/src/
  db/           # Schema, connection, seed
  routes/       # One file per route, named exports
  tests/
    routes/     # Integration tests mirroring routes/
    setup/      # Test infrastructure
  types/        # Module augmentation (.d.ts)
  env.ts        # Env var validation (Zod)
  server.ts     # Entry point

client/src/
  components/
    ui/         # shadcn/ui generated — do not hand-edit
  hooks/        # Custom React hooks (use-*.ts)
  lib/          # Pure utility functions
  routes/       # TanStack Router file-based routes
    _layout/
      __tests__/ # Co-located route tests
  test/         # Vitest setup
```

---

## Architecture Patterns

### Data Loading

- **Load data in route modules only**, not in feature components
- Use TanStack Query for all data fetching on the client
- Prefer useSuspenseQuery to fetch data wehere possible
- When using useSuspenseQuery, use react Suspense on the relevant components
- Prefer server-side data loading where possible

### UI Components

- **shadcn/ui exclusively** for UI components — no other component libraries
- **Hugeicons exclusively** for icons (`@hugeicons/core-free-icons` + `@hugeicons/react`)
- Use `clsx` + `tailwind-merge` (via the `cn()` utility) for conditional classNames
- Use barrel exports where appropriate

### API (Fastify)

- Each route in its own file under `api/src/routes/`
- Use `fastify-type-provider-zod` for request/response validation
- Define Zod schemas for all inputs and outputs
- Use Drizzle ORM for all database access — no raw SQL unless necessary
- Validate env vars via Zod at startup (`api/src/env.ts`)

---

## Error Handling

- **API:** Validate all inputs with Zod; use Fastify error handling middleware for consistent error responses
- **Client:** Non-breaking errors preferred — use toasts (sonner) for recoverable errors, fallback text for missing data
- **No app-crashing frontend errors** — always handle null/undefined with `??` and optional chaining
- **Fetch errors:** Check `response.ok` and throw with a descriptive message

```typescript
// Client fetch pattern
const response = await fetch('/api/users')
if (!response.ok) throw new Error('Failed to fetch users')
const data = await response.json()
return data?.users ?? []
```

---

## Testing Approach

Follow **TDD**: write the test first, then implement, then refactor.

### API Tests (Vitest + Testcontainers)

- Use `buildApp()` from `test-helpers.ts` to create a real Fastify instance
- Use `cleanDb()` before each test to reset state
- Use `insertUser()` and similar helpers for setup data
- Tests run against a real PostgreSQL container — do not mock the DB

### Client Tests (Vitest + Testing Library)

- Use `@testing-library/react` + `@testing-library/user-event`
- Mock `fetch` with `vi.stubGlobal('fetch', ...)` — no MSW needed unless specified
- Vitest globals (`describe`, `it`, `expect`, `vi`) are available without importing
- Avoid testing implementation details — test user-visible behavior

---

## Development Guidelines

- Follow **Clean Code** and **SOLID** principles
- Keep functions small and single-purpose
- Prefer composition over inheritance
- `routeTree.gen.ts` and `components/ui/**/*.tsx` are auto-generated — do not edit manually
- Check `docs/core/PRD.md` for product requirements and `docs/core/SDD.md` for system design decisions before implementing features
