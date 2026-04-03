# Database Schema Changes: Posts Table and Tasks Author

**Date:** 2026-04-03
**Status:** Approved

## Overview

Add a new `posts` table and an `author_id` foreign key to the existing `tasks` table. Both tables will reference the `users` table. Update the seed script to populate the new data.

## Schema Changes

### 1. Tasks Table — Add `author_id`

Add a new column to the existing `tasks` table:

```typescript
authorId: text('author_id').notNull().references(() => users.id),
```

**Constraints:**
- `NOT NULL` — all tasks must have an author
- Foreign key to `users.id`
- No index needed (FK automatically indexed in PostgreSQL)

### 2. Posts Table — New Table

Create a new `posts` table:

```typescript
export const posts = pgTable('posts', {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  title: text().notNull(),
  content: text().notNull(),
  published: boolean().notNull().default(false),
  authorId: text('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .$onUpdate(() => new Date()),
})
```

**Field specifications:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `text` | PK, uuidv7 | Primary key |
| `title` | `text` | NOT NULL | Post title |
| `content` | `text` | NOT NULL | Post body content |
| `published` | `boolean` | NOT NULL, DEFAULT `false` | Publication status |
| `author_id` | `text` | NOT NULL, FK → `users.id` | Author reference |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | `timestamp` | NOT NULL, auto-update | Last modified timestamp |

## Seed Script Changes

### Users Seeding (unchanged)

- 30 users with fake data
- No changes to existing logic

### Tasks Seeding (updated)

- 60 tasks (unchanged count)
- **New:** Assign `author_id` using round-robin distribution
- Each of the 30 users gets exactly 2 tasks

### Posts Seeding (new)

- Create 60 posts
- Round-robin author assignment (2 posts per user)
- Publication status distribution:
  - ~20% published (`true`) — approximately 12 posts
  - ~80% unpublished (`false`) — approximately 48 posts
- Use faker for realistic title and content generation

## Migration Execution

After schema changes:

1. `pnpm --filter api db:generate` — generate Drizzle migration files
2. `pnpm --filter api db:migrate` — apply migrations to database
3. `pnpm --filter api db:seed` — populate data

## File Changes

| File | Change |
|------|--------|
| `api/src/db/schema.ts` | Add `authorId` to `tasks`, add `posts` table definition |
| `api/src/db/seed.ts` | Add `posts` seeding, update `tasks` seeding with `author_id` |

## Data Relationships

```
users (1) ────────< (N) tasks
  │                    │
  │                    └── author_id (NOT NULL)
  │
  └────────────────< (N) posts
                         │
                         └── author_id (NOT NULL)
```

## Decisions

1. **NOT NULL on all FKs** — All data comes from seed, no historical data to preserve
2. **Round-robin distribution** — Even distribution across users for predictable test data
3. **20% published posts** — Realistic mix of draft and published content
4. **No indexes beyond FK** — PostgreSQL auto-indexes foreign keys; additional indexes can be added later if query patterns require
