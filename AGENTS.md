# AGENTS.md — ai-task-manager

Agent instructions for this monorepo. Read before making any changes.

---

## Monorepo Structure

```
ai-task-manager/
├── api/           # Fastify 5 backend (Node 22, ESM, TypeScript)
├── client/        # Vite + React 19 frontend (TanStack Router + Query, shadcn/ui)
├── biome.json     # Root Biome config (authoritative for all workspaces)
└── docs/          # PRD, SDD, plans, specs
```

Package manager: **pnpm** exclusively. Never use `npm` or `yarn`.

---

## Commands

### Root (run from repo root)

```bash
pnpm install         # Install all workspace dependencies
pnpm check           # Biome lint + format check across client/src and api/src
pnpm format          # Auto-fix formatting across both workspaces
pnpm lint            # Lint only (no format write)
```

### API

```bash
pnpm --filter api dev        # Start dev server (port 3333, tsx watch)
pnpm --filter api build      # Compile TypeScript to dist/
pnpm --filter api test       # Run all tests once
pnpm --filter api test:watch # Run tests in watch mode

# Run a single test file
pnpm --filter api exec vitest run src/path/to/file.test.ts

# Run tests matching a name pattern
pnpm --filter api exec vitest run -t "pattern"

# Database
pnpm --filter api db:generate  # Generate Drizzle migrations
pnpm --filter api db:migrate   # Apply migrations
pnpm --filter api db:studio    # Open Drizzle Studio
```

### Client

```bash
pnpm --filter client dev        # Start Vite dev server (port 5173)
pnpm --filter client build      # Type-check + production build
pnpm --filter client preview    # Preview production build
pnpm --filter client test       # Run all tests once
pnpm --filter client test:watch # Run tests in watch mode

# Run a single test file
pnpm --filter client exec vitest run src/path/to/file.test.tsx

# Run tests matching a name pattern
pnpm --filter client exec vitest run -t "pattern"
```

> **Note:** `client/package.json` has a stale `"lint": "eslint ."` script — ESLint is not
> installed. Use `pnpm check` from root for all linting.

---

## Environment Variables

Copy `.env.example` to `.env` before running the API. Never commit `.env`.

```bash
cp api/.env.example api/.env
```

Required vars (`api/.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `GEMINI_API_KEY` — Google Gemini API key (AI features)

Client env (`client/.env`):
- `VITE_API_URL` — API base URL (defaults to `http://localhost:3333`)

---

## Code Style

### Formatting (Biome 2.4.9)

- **Indentation:** 2 spaces (never tabs)
- **Line width:** 80 characters
- **Quotes:** single quotes in JS/TS
- **Semicolons:** omitted (ASI-safe, `asNeeded` mode)
- **Trailing commas:** all multi-line structures
- Run `pnpm check` to auto-fix before committing

### TypeScript

- Strict mode everywhere (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- **Client only:** `verbatimModuleSyntax: true` — type-only imports must use
  `import type X` or inline `import { type X }` syntax
- **Client only:** `erasableSyntaxOnly: true` — no `const enum`, no legacy decorators
- Avoid `any`; Biome warns on it. Use `unknown` + type narrowing instead
- Non-null assertions (`!`) warn via Biome. Prefer optional chaining or explicit guards
- `routeTree.gen.ts` is auto-generated — never edit it manually

### Imports

Order (Biome enforces):
1. Side-effect imports (`import 'dotenv/config'`)
2. External packages
3. Internal aliases (`@/...`)
4. Relative paths

Use the `@/` alias (resolves to `src/`) in both workspaces. Never use deep relative
paths like `../../utils`.

```ts
// Good
import { cn } from '@/lib/utils'

// Avoid
import { cn } from '../../../lib/utils'
```

Use inline `type` modifier when `verbatimModuleSyntax` is active (client):

```ts
import { type ClassValue, clsx } from 'clsx'
```

For type-only imports from React, use `import type * as React`:

```ts
import type * as React from 'react'
```

### Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files (components) | kebab-case | `task-card.tsx` |
| Files (utilities) | kebab-case | `format-date.ts` |
| React components | PascalCase | `TaskCard` |
| TanStack route exports | `Route` (constant) | `export const Route = createFileRoute(...)` |
| Variables / functions | camelCase | `queryClient`, `formatDate` |
| Types / interfaces | PascalCase | `TaskPayload`, `ApiResponse` |
| Zod schemas | camelCase + `Schema` suffix | `createTaskSchema` |
| DB table names (Drizzle) | snake_case | `tasks`, `user_sessions` |

### API (Fastify)

- Use `fastify-type-provider-zod` for all route schemas — define `schema.body`,
  `schema.response`, etc. with Zod objects
- Use `FastifyPluginAsyncZod` type for route plugins
- Always register `validatorCompiler` and `serializerCompiler` (already in `server.ts`)
- Organise routes as plugins in `src/routes/` (one file per domain)
- DB access via Drizzle in `src/db/` — schema in `src/db/schema.ts`
- API docs available at `/docs` via `@scalar/fastify-api-reference`

```ts
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { createSelectSchema } from 'drizzle-zod'
import { db } from '@/db'
import { tasks } from '@/db/schema/schema'

export const listTasks: FastifyPluginAsyncZod = async (app) => {
  app.get('/tasks', {
    schema: {
      summary: 'List tasks',
      tags: ['task'],
      querystring: z.object({
        page: z.coerce.number().min(1).default(1),
        pageSize: z.coerce.number().default(20),
      }),
      response: {
        200: z.object({
          tasks: z.array(createSelectSchema(tasks)),
          page: z.number(),
          pageSize: z.number(),
        }),
      },
    },
  }, async (request, reply) => {
    const { page, pageSize } = request.query
    const offset = (page - 1) * pageSize
    const result = await db.select().from(tasks).limit(pageSize).offset(offset)
    return reply.send({ tasks: result, page, pageSize })
  })
}
```

### Client (React)

- File-based routing via TanStack Router — create files in `src/routes/`
- Server state: TanStack Query (`useQuery`, `useMutation`) — no ad-hoc `fetch` in components
- Components go in `src/components/`, UI primitives in `src/components/ui/` (shadcn)
- Icons: **Hugeicons only** (`@hugeicons/react`) — do not use other icon libraries
- Styling: Tailwind utility classes + `cn()` helper for conditional classes

```tsx
import { cn } from '@/lib/utils'

function Button({ active }: { active: boolean }) {
  return <button className={cn('px-4 py-2', active && 'bg-blue-500')} />
}
```

- Component props: Use inline type definitions for simple cases:

```tsx
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <h2>{title}</h2>
      {children}
    </div>
  )
}
```

- Add shadcn components via CLI (run from `client/`):
```bash
pnpm dlx shadcn@latest add <component>
```

### Error Handling

- **API:** Use Fastify's built-in error handling. Throw `FastifyError` or use
  `app.httpErrors` for HTTP error responses:
  ```ts
  import { FastifyError } from 'fastify'

  if (!task) {
    throw app.httpErrors.notFound('Task not found')
  }
  ```

- **Client:** Use TanStack Query's `onError` callback or error boundaries for
  runtime errors. Toast notifications via `sonner` for user-facing errors:
  ```tsx
  import { toast } from 'sonner'

  // In mutation
  useMutation({
    mutationFn: createTask,
    onError: (error) => toast.error(error.message),
  })
  ```

### Testing

- Vitest with jsdom environment (client) and Node environment (api)
- Globals enabled — no need to import `describe`, `it`, `expect`
- Test files: `*.test.ts` / `*.test.tsx` co-located with source
- Client setup file (`src/test/setup.ts`) imports `@testing-library/jest-dom`
- Use `@testing-library/react` for component tests

---

## Key Files

| Path | Purpose |
|------|---------|
| `api/src/server.ts` | Fastify app entry point |
| `api/src/db/schema.ts` | Drizzle ORM table definitions |
| `api/drizzle.config.ts` | Drizzle Kit configuration |
| `api/docker-compose.yml` | PostgreSQL 17 container |
| `client/src/main.tsx` | React app entry, router + query setup |
| `client/src/routes/__root.tsx` | Root route layout |
| `client/src/routes/_layout.tsx` | Layout route with sidebar |
| `client/src/lib/utils.ts` | `cn()` class merging utility |
| `client/src/index.css` | Tailwind v4 config + design tokens |
| `client/vitest.config.ts` | Vitest configuration |
| `docs/core/PRD.md` | Product requirements |
| `docs/core/SDD.md` | System design document |
