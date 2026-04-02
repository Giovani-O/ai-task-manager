# System Design Document (SDD)

## Overview

AI Task Manager is a pnpm monorepo for refining task descriptions via LLM-assisted chatbot interaction. Users submit basic task descriptions; the system uses an LLM to elevate them to product-manager-quality specifications.

The project consists of two workspaces:

- **`client/`** — Single-page application (SPA) built with React 19 + Vite + TanStack Router
- **`api/`** — REST API built with Fastify v5 + Drizzle ORM + PostgreSQL 17

**Requirements:** Node.js ≥22, pnpm 10+

---

## Tech Stack

### Architectural Dependencies

**Root:**

- Biome 2.4.9 (linting, formatting)

**API (`api/package.json`):**

- Fastify v5 — HTTP framework with plugin architecture
- Drizzle ORM — type-safe SQL query builder
- fastify-type-provider-zod — request/response validation
- Zod — schema validation
- @scalar/fastify-api-reference — API documentation UI
- uuidv7 — time-sorted UUID generation
- pg / postgres — PostgreSQL drivers

**Client (`client/package.json`):**

- React 19 — UI library
- TanStack Router — file-based routing with type safety
- TanStack Query — server state management
- TanStack Table — table components with sorting/pagination
- shadcn/ui — component library (Radix + Tailwind)
- Hugeicons — icon library
- sonner — toast notifications
- next-themes — dark mode
- date-fns — date formatting

**Full dependency lists:** See `package.json` (root), `api/package.json`, and `client/package.json`.

**Future:** Vercel AI SDK for LLM integration (Gemini).

---

## Project Structure

The monorepo is organized as follows:

```
ai-task-manager/
├── api/           # Backend workspace
├── client/        # Frontend workspace
├── docs/          # Documentation
├── biome.json     # Global Biome configuration
└── package.json   # Root package.json (workspace config)
```

### API (`api/`)

```
api/
├── src/
│   ├── db/            # Database connection, schema, migrations, seeds
│   ├── routes/        # Route handlers (one file per route)
│   ├── tests/
│   │   ├── routes/    # Route integration tests
│   │   └── setup/     # Test infrastructure and helpers
│   ├── types/         # TypeScript module augmentation
│   ├── env.ts         # Environment variable validation
│   └── server.ts      # Application entry point
├── drizzle/           # Generated migrations
├── package.json
├── tsconfig.json
└── biome.json         # Extends root Biome config
```

### Client (`client/`)

```
client/
├── src/
│   ├── components/
│   │   └── ui/        # shadcn/ui generated components (do not edit)
│   ├── hooks/         # Custom React hooks (use-*.ts)
│   ├── lib/           # Pure utility functions
│   ├── routes/
│   │   └── __tests__/ # Co-located route tests
│   ├── test/          # Vitest setup
│   ├── main.tsx       # Application entry point
│   └── routeTree.gen.ts # Auto-generated route tree (do not edit)
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── biome.json         # Extends root Biome config
```

**Note:** New directories may be created as needed, following existing conventions.

---

## Architecture Patterns

### Data Loading

- Prefer server-side data loading over client-side where possible
- Client-side data fetching occurs in route modules only, not in feature components
- Use TanStack Query for all client-side data fetching
- Route components handle loading and error states

### API Routes

- Each route is defined in its own file under `api/src/routes/`
- Routes use `fastify-type-provider-zod` for request/response validation
- All inputs and outputs must have Zod schemas defined
- Routes are registered as Fastify plugins

### UI Components

- **shadcn/ui exclusively** for UI components — no other component libraries
- **Hugeicons exclusively** for icons
- Installed shadcn/ui components reside in `client/src/components/ui/` (auto-generated, do not edit)
- Use `clsx` + `tailwind-merge` (via `cn()` utility) for conditional classNames
- Barrel exports are encouraged where appropriate

---

## Code Style

### TypeScript

- Both workspaces use `strict: true` — no compiler errors allowed
- Client also enforces `noUnusedLocals`, `noUnusedParameters`,
  `verbatimModuleSyntax`
- Use `import type` for type-only imports (enforced in client)
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
6. Named imports strongly preferred; default imports only when forced by a library

```typescript
// Correct
import { useQuery } from '@tanstack/react-query'
import type * as React from 'react'
import { UserTable } from '@/components/user-table'
import type { User } from '@/types/user'
```

### Naming Conventions

| Construct | Convention | Example |
|-----------|------------|---------|
| React components | PascalCase | `AppSidebar`, `UsersPage` |
| Non-component functions | camelCase | `formatDateTime`, `listUsers` |
| Constants | SCREAMING_SNAKE_CASE | `PAGE_SIZE` |
| Types / type aliases | PascalCase | `User`, `TaskStatus` |
| React hooks | `use` prefix, camelCase | `useIsMobile` |
| Files | kebab-case | `app-sidebar.tsx`, `list-users.ts` |
| Test files | `*.test.ts(x)` in `__tests__/` or `tests/` subdirectory | |
| DB columns | snake_case (Drizzle `casing: 'snake_case'`) | `created_at` |

### Formatting (Biome)

- 2-space indentation
- 80-character line width
- Single quotes for strings
- Semicolons only as needed (ASI — no trailing semicolons)
- Run `pnpm check` before claiming work is complete

### Auto-Generated Files

Do not manually edit:

- `client/src/routeTree.gen.ts` — TanStack Router auto-generated
- `client/src/components/ui/**/*.tsx` — shadcn/ui generated

---

## Testing Approach

The project follows **Test-Driven Development (TDD)**:

1. Write the test first
2. Implement the code to pass the test
3. Refactor

### API Tests

- **Framework:** Vitest + Testcontainers (PostgreSQL 17)
- **Location:** `api/src/tests/` mirroring source structure
- **Approach:** Integration tests against a real PostgreSQL container
- **Setup:** Use `buildApp()` helper to create a Fastify instance with test database
- **Cleanup:** Use `cleanDb()` before each test to reset state
- **Do not mock the database** — tests run against a real container

### Client Tests

- **Framework:** Vitest + Testing Library + user-event
- **Location:** Co-located `__tests__/` directories in `routes/`
- **Approach:** Test user-visible behavior, not implementation details
- **Mocking:** Mock `fetch` with `vi.stubGlobal('fetch', ...)` — no MSW unless specified
- **Globals:** Vitest globals (`describe`, `it`, `expect`, `vi`) available without importing

### Coverage

- Target: >80% test coverage
- Run `pnpm --filter api test` or `pnpm --filter client test` to execute tests

---

## Error Handling

### API

- Validate all inputs with Zod schemas
- Use Fastify error handling middleware for consistent error responses
- Never expose internal errors to clients

### Client

- **No app-crashing frontend errors** — always handle null/undefined
- Use `??` for nullish coalescing and optional chaining (`?.`)
- Recoverable errors: display toasts (sonner)
- Missing data: show fallback text or empty states
- Fetch errors: check `response.ok` and throw with descriptive message

```typescript
// Client fetch pattern
const response = await fetch('/api/users')
if (!response.ok) throw new Error('Failed to fetch users')
const data = await response.json()
return data?.users ?? []
```

---

## Database

- **PostgreSQL 17** running in Docker container named `ai-task-manager`
- **Drizzle ORM** for all database access — no raw SQL unless necessary
- **Migrations:** Use `drizzle-kit generate` after schema changes, `drizzle-kit migrate` to apply
- **Schema location:** `api/src/db/schema.ts`
- **Column naming:** snake_case (Drizzle `casing: 'snake_case'`)

### Environment Variables

Validated at startup via Zod in `api/src/env.ts`:

- `NODE_ENV` — development | production | test
- `PORT` — server port (default: 3333)
- `DATABASE_URL` — PostgreSQL connection string
- `GEMINI_API_KEY` — API key for future LLM integration

---

## Development Guidelines

### Principles

- Follow **Clean Code** and **SOLID** principles
- Keep functions small and single-purpose
- Prefer composition over inheritance
- Maintain type safety throughout

### Workflow

1. Write tests first (TDD)
2. Implement to pass tests
3. Refactor
4. Run `pnpm check` before committing

---

## Documentation Resources

Use Context7 MCP to consult library documentation. If unavailable, refer to:

- Node.js: https://nodejs.org/docs/latest/api/
- Fastify: https://fastify.dev/docs/latest/
- Drizzle ORM: https://orm.drizzle.team/docs/overview
- Zod: https://zod.dev/
- React: https://react.dev/reference/react
- TanStack Query: https://tanstack.com/query/latest/docs/framework/react/overview
- TanStack Router: https://tanstack.com/router/latest/docs/overview
- shadcn/ui: https://ui.shadcn.com/docs/installation
- Biome: https://biomejs.dev/guides/getting-started/
- Vitest: https://vitest.dev/guide/

---

## Future Considerations

### LLM Integration

The system will integrate with Vercel AI SDK for LLM-powered task refinement:

- Model: Gemini (via `GEMINI_API_KEY`)
- Use case: Elevate basic task descriptions to structured, actionable specifications
- Storage: Refined tasks stored in database with conversation history

### Vector Embeddings

Future capability for semantic search over task content:

- Tasks converted to markdown and chunked
- Stored as vector embeddings in PostgreSQL
- Enables queries like "Which tasks involve authentication?"
