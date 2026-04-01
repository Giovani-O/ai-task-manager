# Fastify Dependency Injection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace direct `db` singleton imports in route handlers with `app.db` Fastify decorator so the test container DB injected in tests is actually used by routes.

**Architecture:** A TypeScript module augmentation declares `db` on `FastifyInstance` once. `server.ts` decorates the production app with the real db before registering routes. Each route reads `app.db` instead of importing the singleton. The test helper's existing `app.decorate('db', testDb)` call becomes the effective DI mechanism with no further changes.

**Tech Stack:** Fastify 5, Drizzle ORM (postgres-js), TypeScript strict mode, Vitest + testcontainers/postgresql

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `api/src/types/fastify.d.ts` | Module augmentation — adds `db` to `FastifyInstance` |
| Modify | `api/src/server.ts` | Decorate app with production `db` before route registration |
| Modify | `api/src/routes/list-users.ts` | Use `app.db` instead of imported `db` singleton |

---

### Task 1: Add Fastify type augmentation

**Files:**
- Create: `api/src/types/fastify.d.ts`

- [ ] **Step 1: Create the type augmentation file**

Create `api/src/types/fastify.d.ts` with this exact content:

```ts
import type { db } from '@/db'

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof db
  }
}
```

This file has no runtime output — it only teaches TypeScript that every `FastifyInstance` has a `db` property typed as the Drizzle instance exported from `@/db`.

- [ ] **Step 2: Verify TypeScript accepts the new file**

Run from `api/`:

```bash
pnpm --filter api build
```

Expected: build succeeds (or fails only on pre-existing errors unrelated to this file). There are no tests for a pure type declaration — the type check passing is the verification.

- [ ] **Step 3: Commit**

```bash
git add api/src/types/fastify.d.ts
git commit -m "feat: add Fastify type augmentation for db decorator"
```

---

### Task 2: Decorate production app with `db`

**Files:**
- Modify: `api/src/server.ts`

- [ ] **Step 1: Add the decorator call**

Open `api/src/server.ts`. After the `import` block at the top, add an import for `db`:

```ts
import { db } from './db'
```

Then, after the line `app.setSerializerCompiler(serializerCompiler)` and before the first `app.register(...)` call, add:

```ts
app.decorate('db', db)
```

The relevant section should look like this after the change:

```ts
const app = Fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.decorate('db', db)

await app.register(fastifyCors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
})
```

- [ ] **Step 2: Verify the build still passes**

```bash
pnpm --filter api build
```

Expected: build succeeds with no new errors.

- [ ] **Step 3: Commit**

```bash
git add api/src/server.ts
git commit -m "feat: decorate Fastify app with production db instance"
```

---

### Task 3: Update route to use `app.db`

**Files:**
- Modify: `api/src/routes/list-users.ts`

- [ ] **Step 1: Run the existing tests to confirm they pass before touching the route**

```bash
pnpm --filter api test
```

Expected: 2 tests pass. This is the baseline.

- [ ] **Step 2: Update the route**

Open `api/src/routes/list-users.ts`.

Remove the line:
```ts
import { db } from '@/db'
```

Change the handler body to use `app.db` instead of `db`. The full file after the change:

```ts
import { desc } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { users } from '@/db/schema'

export const listUsers: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/users',
    {
      schema: {
        summary: 'List users',
        tags: ['user'],
        querystring: z.object({
          page: z.coerce.number().min(1).default(1),
          pageSize: z.coerce.number().default(20),
        }),
        response: {
          200: z.object({
            users: z.array(
              createSelectSchema(users).pick({
                id: true,
                name: true,
                email: true,
                createdAt: true,
              }),
            ),
            page: z.number(),
            pageSize: z.number(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { page, pageSize } = request.query
      const offset = (page - 1) * pageSize

      const result = await app.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.id))
        .limit(pageSize)
        .offset(offset)

      return reply.status(200).send({
        users: result,
        page,
        pageSize,
      })
    },
  )
}
```

- [ ] **Step 3: Run the tests to confirm they still pass**

```bash
pnpm --filter api test
```

Expected: 2 tests pass. If any test fails, the decorator wiring in `test-helpers.ts` or `server.ts` needs to be checked.

- [ ] **Step 4: Run the linter to confirm no style violations**

```bash
pnpm check
```

Expected: no errors. If Biome complains about unused imports or other style issues, fix them before committing.

- [ ] **Step 5: Commit**

```bash
git add api/src/routes/list-users.ts
git commit -m "refactor: use app.db decorator in listUsers route instead of singleton import"
```
