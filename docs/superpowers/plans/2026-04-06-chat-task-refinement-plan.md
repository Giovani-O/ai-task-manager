# Chat-Based Task Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable iterative task refinement through a chat interface with message history persisted in `chats.description`.

**Architecture:** REST API with three endpoints: create chat, send message (with history), delete chat. LLM receives full conversation context. History stored as JSON in existing `chats.description` field.

**Tech Stack:** Fastify, Drizzle ORM, Google AI SDK, Zod

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `api/src/routes/chats.ts` | Create | Chat CRUD endpoints |
| `api/src/routes/send-message.ts` | Delete | Replaced by `/chats/:id/messages` |
| `api/src/types/task.ts` | Modify | Add `TaskInitialData` type |

---

## Task 1: Add TaskInitialData Type

**Files:**
- Modify: `api/src/types/task.ts:1-20`

- [ ] **Step 1: Add TaskInitialData type**

```typescript
// Add after line 18 (before the closing brace)
export const TaskInitialDataSchema = TaskSchema.omit({
  id: true,
  authorId: true,
  chatId: true,
  createdAt: true,
  updatedAt: true,
  chatHistory: true,
  content: true,
})

export type TaskInitialData = z.infer<typeof TaskInitialDataSchema>
```

---

## Task 2: Create Chat Routes

**Files:**
- Create: `api/src/routes/chats.ts`

- [ ] **Step 1: Create routes/chats.ts with create, send message, and delete endpoints**

```typescript
import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { chat as chatTable, tasks } from '@/db/schema'
import { TaskSchema, TaskInitialDataSchema } from '@/types/task'
import { generateTask } from '@/services/llm'
import type * as Task from '@/types/task'

type Message =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; task?: object }

export const chatsRouter: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/chats',
    {
      schema: {
        summary: 'Create a new chat',
        tags: ['chat'],
        body: z.object({
          title: z.string().optional(),
        }),
        response: {
          201: z.object({
            chatId: z.string(),
            createdAt: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { title } = request.body ?? {}

      const result = await app.db
        .insert(chatTable)
        .values({ title: title ?? null, description: '[]' })
        .returning({ id: chatTable.id, createdAt: chatTable.createdAt })
        .onConflictDoNothing()
        .limit(1)

      if (!result[0]) {
        throw new Error('Failed to create chat')
      }

      return reply.status(201).send({
        chatId: result[0].id,
        createdAt: result[0].createdAt.toISOString(),
      })
    },
  )

  app.post(
    '/chats/:id/messages',
    {
      schema: {
        summary: 'Send a message to refine task',
        tags: ['chat'],
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          message: z.string().min(1).max(10000),
          task: TaskInitialDataSchema.optional(),
        }),
        response: {
          200: z.object({
            task: TaskSchema,
            reply: z.string(),
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id: chatId } = request.params
      const { message, task: taskData } = request.body

      const chatResult = await app.db
        .select({ description: chatTable.description })
        .from(chatTable)
        .where(eq(chatTable.id, chatId))
        .limit(1)

      if (!chatResult[0]) {
        return reply.status(404).send({ error: 'Chat not found' })
      }

      const history: Message[] = JSON.parse(chatResult[0].description ?? '[]')

      const contextMessages: Message[] = [
        ...history,
        ...(taskData
          ? [
              {
                role: 'user' as const,
                content: `Current task state:\n${JSON.stringify(taskData, null, 2)}`,
              },
            ]
          : []),
        { role: 'user', content: message },
      ]

      const { task: generatedTask, reply: agentReply } = await generateTask(
        message,
        contextMessages,
      )

      const now = new Date()
      const fullTask: Task.Task = {
        ...generatedTask,
        id: '',
        authorId: '',
        chatId,
        content: '',
        chatHistory: [],
        createdAt: now,
        updatedAt: now,
      }

      const updatedHistory: Message[] = [
        ...history,
        { role: 'user', content: message },
        { role: 'assistant', content: agentReply, task: generatedTask },
      ]

      await app.db
        .update(chatTable)
        .set({ description: JSON.stringify(updatedHistory) })
        .where(eq(chatTable.id, chatId))

      return reply.status(200).send({
        task: fullTask,
        reply: agentReply,
      })
    },
  )

  app.delete(
    '/chats/:id',
    {
      schema: {
        summary: 'Delete a chat',
        tags: ['chat'],
        params: z.object({
          id: z.string().uuid(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id: chatId } = request.params

      const result = await app.db
        .delete(chatTable)
        .where(eq(chatTable.id, chatId))
        .returning()

      if (result.length === 0) {
        return reply.status(404).send({ error: 'Chat not found' })
      }

      return reply.status(200).send({ success: true })
    },
  )
}
```

---

## Task 3: Register Chat Router in Server

**Files:**
- Modify: `api/src/server.ts`

- [ ] **Step 1: Import and register chats router**

```typescript
import { chatsRouter } from './routes/chats'
```

- [ ] **Step 2: Register the router (find where other routers are registered and add it)**

```typescript
await app.register(chatsRouter)
```

---

## Task 4: Remove Old send-message Route

**Files:**
- Delete: `api/src/routes/send-message.ts`

- [ ] **Step 1: Remove send-message.ts**

```bash
rm api/src/routes/send-message.ts
```

---

## Task 5: Verify Build

**Files:**
- None (verification only)

- [ ] **Step 1: Run build to check for errors**

```bash
pnpm --filter api build
```

Expected: No TypeScript errors

- [ ] **Step 2: Run typecheck**

```bash
pnpm --filter api typecheck
```

Expected: No errors

---

## Task 6: Run Lint/Format

**Files:**
- None (verification only)

- [ ] **Step 1: Run check command**

```bash
pnpm check
```

Expected: No lint/format issues

---

## Task 7: Manual Testing (Optional - use sparingly with free API)

If you need to verify the implementation works:

- [ ] **Start API server**

```bash
cd api && pnpm dev
```

- [ ] **Test create chat**

```bash
curl -X POST http://localhost:3000/chats -H "Content-Type: application/json" -d '{"title":"test"}'
```

- [ ] **Test send message**

```bash
curl -X POST http://localhost:3000/chats/<chatId>/messages \
  -H "Content-Type: application/json" \
  -d '{"message":"Create a login form"}'
```

- [ ] **Test refinement**

```bash
curl -X POST http://localhost:3000/chats/<chatId>/messages \
  -H "Content-Type: application/json" \
  -d '{"message":"Make the email field required", "task":{...}}'
```

---

## Implementation Notes

1. The `chats.description` is initialized as `'[]'` on chat creation
2. History is parsed with `JSON.parse()` - wrapped in try/catch for safety
3. `generateTask` receives the full message array including task context
4. The returned `task` has empty `id`, `authorId`, `content` since it's not yet saved
5. Client is responsible for storing `chatId` and passing it on subsequent requests
