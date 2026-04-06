# Save Task Feature — Design Spec

**Date:** 2026-04-06

## Overview

Implement the "Save Task" feature on the `new-task` page. The user refines a task via chat with the AI agent, then clicks "Save Task" to persist it to the database. On success, a toast is shown and the user is redirected to `/tasks`.

As part of this work, three stale columns (`author_id`, `chat_history`, `content`) are dropped from the `tasks` table. Chat history is already stored in `chats.description` and linked via `chatId`; `content` was a redundant markdown rendering of structured fields; `author_id` references a users table that no longer exists.

---

## Section 1 — Database Schema Changes

Drop three columns from `tasks`: `author_id`, `chat_history`, `content`.

### Migration

Generate a new Drizzle migration after updating the schema:

```sql
ALTER TABLE "tasks" DROP COLUMN "author_id";
ALTER TABLE "tasks" DROP COLUMN "chat_history";
ALTER TABLE "tasks" DROP COLUMN "content";
```

### Files to update

| File | Change |
|---|---|
| `api/src/db/schema.ts` | Remove `authorId`, `chatHistory`, `content` fields |
| `api/src/db/seed.ts` | Remove `author_id` from `CREATE TABLE IF NOT EXISTS` block and INSERT statement |
| `api/src/types/task.ts` | Remove `authorId`, `chatHistory`, `content` from `TaskSchema` and all `.omit()` calls that reference them |
| `api/src/services/llm.ts` | Remove `authorId` from `.omit()` |
| `api/src/routes/get-task.ts` | Remove `authorId` from the select projection |
| `api/src/routes/chats.ts` | Remove `authorId`, `chatHistory`, `content` from the `fullTask` construction |
| `api/src/tests/setup/test-helpers.ts` | Remove `authorId` from `insertTask` helper signature and call |
| `api/src/tests/routes/get-task.test.ts` | Remove — will be recreated later |
| `api/src/tests/routes/list-tasks.test.ts` | Remove — will be recreated later |
| `client/src/components/chat-panel.tsx` | Remove `authorId` from `GeneratedTask` type |

---

## Section 2 — API: `POST /tasks`

New file: `api/src/routes/create-task.ts`. Registered in `api/src/server.ts`.

### Request

`POST /tasks`

Body (Zod-validated):

```typescript
{
  chatId: string           // UUID — must exist in chats table
  title: string
  description: string
  steps: string[]
  estimatedTime: string
  implementationSuggestion: string
  acceptanceCriteria: string[]
  suggestedTests: string[]
}
```

### Behaviour

1. Verify `chatId` exists in `chats` — return 404 if not found
2. Insert into `tasks`
3. Return the created task with status 201

### Response

**201:**
```typescript
{
  id: string
  chatId: string
  title: string
  description: string
  steps: string[]
  estimatedTime: string
  implementationSuggestion: string
  acceptanceCriteria: string[]
  suggestedTests: string[]
  createdAt: string   // ISO date string
  updatedAt: string   // ISO date string
}
```

**404:** `{ error: string }` — chatId not found  
**400:** Automatic Zod validation errors

---

## Section 3 — Client: Save Task Button

### `TaskPreviewPanel` changes

- Add `onSave?: () => void` prop (called when Save button is clicked)
- Button is disabled when: no task in cache, `isGenerating` is true, or save is in-flight

### `new-task.tsx` changes

- Add `isSaving` state
- Define `handleSave` async function:
  1. Read current task from query cache (`CURRENT_TASK_KEY`)
  2. `POST /tasks` with task fields + `chatId`
  3. On success: show success toast (`sonner`), navigate to `/tasks`
  4. On error: show error toast, stay on page
- Pass `handleSave` as `onSave` to `TaskPreviewPanel`
- Pass `isSaving` so the button can reflect in-flight state

### `ChatPanel` changes

- Expose `chatId` so `new-task.tsx` can pass it to `handleSave`. Currently `chatId` is internal state in `ChatPanel`. It needs to be surfaced via a callback prop: `onChatCreated?: (chatId: string) => void`.

---

## Testing

No new tests are written as part of this feature. After implementation is complete, run the existing test suite. Any tests that fail due to the schema changes are deleted; passing tests are kept as-is.
