# Posts Table and Tasks Author Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `posts` table and `author_id` foreign key to `tasks` table, then seed with test data.

**Architecture:** Extend existing Drizzle schema with new column and table, update seed script for round-robin author assignment.

**Tech Stack:** Drizzle ORM, PostgreSQL, uuidv7, Faker

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `api/src/db/schema.ts` | Modify | Add `authorId` to `tasks`, add `posts` table |
| `api/src/db/seed.ts` | Modify | Add posts seeding, update tasks with `author_id` |

---

### Task 1: Update Schema — Add `author_id` to Tasks

**Files:**
- Modify: `api/src/db/schema.ts`

- [ ] **Step 1: Add `authorId` field to `tasks` table**

Add the `authorId` field after the `id` field in the `tasks` table definition:

```typescript
import { boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'

export const users = pgTable('users', {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  email: text().unique().notNull(),
  name: text().notNull(),
  lastLogin: timestamp('last_login', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .$onUpdate(() => new Date()),
})

export const tasks = pgTable('tasks', {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  authorId: text('author_id').notNull().references(() => users.id),
  title: text().notNull(),
  description: text().notNull(),
  steps: jsonb().notNull().$type<string[]>(),
  estimatedTime: text('estimated_time').notNull(),
  implementationSuggestion: text('implementation_suggestion').notNull(),
  acceptanceCriteria: jsonb('acceptance_criteria').notNull().$type<string[]>(),
  suggestedTests: jsonb('suggested_tests').notNull().$type<string[]>(),
  content: text().notNull(),
  chatHistory: jsonb('chat_history').notNull().$type<unknown[]>(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .$onUpdate(() => new Date()),
})
```

---

### Task 2: Update Schema — Add `posts` Table

**Files:**
- Modify: `api/src/db/schema.ts`

- [ ] **Step 1: Add `posts` table definition**

Add the `posts` table after the `tasks` table:

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

---

### Task 3: Update Seed Script — Add Posts Table Creation

**Files:**
- Modify: `api/src/db/seed.ts`

- [ ] **Step 1: Add posts table DDL**

Add the posts table creation SQL after the tasks table creation (around line 129):

```typescript
console.log('Creating posts table...')
await client.query(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    author_id TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )
`)
```

- [ ] **Step 2: Add truncate for posts table**

Add posts truncate after tasks truncate:

```typescript
await client.query('TRUNCATE TABLE posts RESTART IDENTITY CASCADE')
```

---

### Task 4: Update Seed Script — Collect User IDs for Assignment

**Files:**
- Modify: `api/src/db/seed.ts`

- [ ] **Step 1: Collect user IDs after seeding users**

After seeding users (around line 149), collect the user IDs:

```typescript
console.log('Seeding 30 users...')
const userIds: string[] = []
for (let i = 0; i < 30; i++) {
  const id = uuidv7()
  userIds.push(id)
  const email = faker.internet.email()
  const name = faker.person.fullName()
  const lastLogin = faker.date.recent({ days: 30 })

  await client.query(
    `INSERT INTO users (id, email, name, last_login, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (email) DO NOTHING`,
    [id, email, name, lastLogin, new Date(), new Date()],
  )
  console.log(`Created user: ${name} (${email})`)
}
```

---

### Task 5: Update Seed Script — Add `author_id` to Tasks

**Files:**
- Modify: `api/src/db/seed.ts`

- [ ] **Step 1: Update tasks seeding with `author_id`**

Replace the tasks seeding loop (lines 151-193) to include `author_id`:

```typescript
console.log('Seeding 60 tasks...')
for (let i = 0; i < 60; i++) {
  const id = uuidv7()
  const authorId = userIds[i % userIds.length]
  const title = faker.helpers.arrayElement(TASK_TITLES)
  const description = faker.hacker.phrase()
  const steps = generateSteps()
  const estimatedTime = `${faker.number.int({ min: 1, max: 5 })} day${faker.number.int({ min: 1, max: 5 }) > 1 ? 's' : ''}`
  const tech1 = faker.helpers.arrayElement(TECH_STACK)
  const tech2 = faker.helpers.arrayElement(TECH_STACK)
  const implementationSuggestion = `Use ${tech1} for the frontend and ${tech2} for backend integration.`
  const acceptanceCriteria = generateAcceptanceCriteria()
  const suggestedTests = generateTests()
  const content = generateContent({
    title,
    description,
    steps,
    estimatedTime,
    implementationSuggestion,
    acceptanceCriteria,
    suggestedTests,
  })
  const chatHistory: unknown[] = []

  await client.query(
    `INSERT INTO tasks (id, author_id, title, description, steps, estimated_time, implementation_suggestion, acceptance_criteria, suggested_tests, content, chat_history, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      id,
      authorId,
      title,
      description,
      JSON.stringify(steps),
      estimatedTime,
      implementationSuggestion,
      JSON.stringify(acceptanceCriteria),
      JSON.stringify(suggestedTests),
      content,
      JSON.stringify(chatHistory),
      new Date(),
      new Date(),
    ],
  )
  console.log(`Created task: ${title}`)
}
```

---

### Task 6: Update Seed Script — Add Posts Seeding

**Files:**
- Modify: `api/src/db/seed.ts`

- [ ] **Step 1: Add posts seeding loop**

Add after tasks seeding (before `console.log('Seed complete!')`):

```typescript
console.log('Seeding 60 posts...')
for (let i = 0; i < 60; i++) {
  const id = uuidv7()
  const authorId = userIds[i % userIds.length]
  const title = faker.hacker.phrase()
  const content = faker.lorem.paragraphs({ min: 2, max: 5 })
  const published = i % 5 === 0

  await client.query(
    `INSERT INTO posts (id, title, content, published, author_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, title, content, published, authorId, new Date(), new Date()],
  )
  console.log(`Created post: ${title}`)
}
```

---

### Task 7: Generate and Run Migration

- [ ] **Step 1: Generate Drizzle migration**

Run from repo root:

```bash
cd api && pnpm db:generate
```

Expected: New migration file created in `api/drizzle/` directory.

- [ ] **Step 2: Run migration**

```bash
cd api && pnpm db:migrate
```

Expected: Migration applied successfully.

- [ ] **Step 3: Run seed script**

```bash
cd api && pnpm db:seed
```

Expected: 30 users, 60 tasks with authors, 60 posts (12 published, 48 unpublished).

---

### Task 8: Verify with Biome Check

- [ ] **Step 1: Run biome check**

```bash
cd api && pnpm check
```

Expected: No errors.
