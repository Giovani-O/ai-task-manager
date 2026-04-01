# Design: Fastify Dependency Injection (Minimal)

**Date:** 2026-04-01
**Status:** Approved

## Goal

Refactor the API so route handlers receive their database instance via Fastify's decorator mechanism (`app.db`) rather than importing the `db` singleton directly. This makes the existing test setup in `test-helpers.ts` actually effective: the test DB injected via `app.decorate('db', testDb)` will be used by routes instead of the module-level production singleton.

## Approach

Option A — typed Fastify decorator on the root app instance.

## Files Changed

| File | Change |
|------|--------|
| `api/src/types/fastify.d.ts` | **new** — module augmentation declaring `db` on `FastifyInstance` |
| `api/src/server.ts` | add `app.decorate('db', db)` before route registration |
| `api/src/routes/list-users.ts` | remove `import { db }`, use `app.db` instead |
| `api/src/tests/setup/test-helpers.ts` | no changes needed |
| `api/src/db/index.ts` | no changes needed |

## Design Details

### Type Augmentation (`src/types/fastify.d.ts`)

Augments `FastifyInstance` so `app.db` is typed as the Drizzle instance everywhere without casting.

```ts
import type { db } from '@/db'

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof db
  }
}
```

### Production Wiring (`server.ts`)

After the app instance is created, decorate with the production db singleton before registering routes:

```ts
import { db } from './db'
// ...
app.decorate('db', db)
await app.register(listUsers)
```

### Route Change (`list-users.ts`)

Remove the direct `import { db } from '@/db'` and reference `app.db` in the handler:

```ts
const result = await app.db.select({ ... }).from(users)...
```

### Test Wiring (`test-helpers.ts`)

Already calls `app.decorate('db', testDb)`. This was previously dead code because routes bypassed it. After the route change it becomes the actual DI mechanism — no changes required.

## Constraints

- No service/repository layer introduced (out of scope for this refactor)
- `db/index.ts` singleton is kept for production use
- All existing tests must continue to pass without modification
- `GEMINI_API_KEY` env var requirement in `env.ts` must not break test runs (already handled by global-setup setting `DATABASE_URL`)
