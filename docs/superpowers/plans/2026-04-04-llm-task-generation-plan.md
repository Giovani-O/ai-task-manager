# LLM Task Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Vercel AI SDK with Google Gemini to generate Task objects from user messages, acting as a Senior Project Manager.

**Architecture:** Create an LLM service that uses Vercel AI's `generateObject` for structured output. The route calls this service and returns `{ task: Task, reply: string }`.

**Tech Stack:** Vercel AI SDK (`ai`, `@ai-sdk/google`), Google Gemini (`gemini-2.5-flash`)

---

### Task 1: Install Dependencies

**Files:**
- Modify: `api/package.json`

- [ ] **Step 1: Install Vercel AI SDK and Google provider**

```bash
cd api && pnpm add ai @ai-sdk/google
```

- [ ] **Step 2: Run check to ensure no errors**

Run: `pnpm check`
Expected: No errors

---

### Task 2: Create LLM Service

**Files:**
- Create: `api/src/services/llm.ts`
- Test: `api/src/tests/services/llm.test.ts`

- [ ] **Step 1: Write the failing test**

Create `api/src/tests/services/llm.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest'
import { generateTask } from '@/services/llm'

vi.mock('@ai-sdk/google', () => ({
  google: {
    generativeModel: vi.fn(() => ({
      doGenerate: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          title: 'Test Task',
          description: 'Test description',
          steps: ['Step 1'],
          estimatedTime: '1 hour',
          implementationSuggestion: 'Test suggestion',
          acceptanceCriteria: ['Test criteria'],
          suggestedTests: ['Test tests'],
        }),
      }),
    })),
  },
}))

describe('generateTask', () => {
  it('should return task and reply from LLM', async () => {
    const result = await generateTask('Create a login page')
    
    expect(result).toHaveProperty('task')
    expect(result).toHaveProperty('reply')
    expect(result.task).toHaveProperty('title')
    expect(result.task).toHaveProperty('description')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && pnpm vitest run src/tests/services/llm.test.ts`
Expected: FAIL - "Cannot find module '@/services/llm'"

- [ ] **Step 3: Write minimal implementation**

Create `api/src/services/llm.ts`:

```typescript
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { env } from '@/env'
import { z } from 'zod'
import { type Task, TaskSchema } from '@/types/task'

const GenerateTaskResponseSchema = z.object({
  task: TaskSchema.omit({
    id: true,
    authorId: true,
    chatId: true,
    createdAt: true,
    updatedAt: true,
    chatHistory: true,
  }),
  reply: z.string(),
})

export type GenerateTaskResponse = z.infer<typeof GenerateTaskResponseSchema>

export async function generateTask(
  userMessage: string
): Promise<GenerateTaskResponse> {
  const model = google('gemini-2.5-flash', {
    apiKey: env.GEMINI_API_KEY,
  })

  const { object } = await generateObject({
    model,
    schema: GenerateTaskResponseSchema,
    system:
      'You are a Senior Project Manager. Given a user request, break it down into a structured task with title, description, steps, estimated time, implementation suggestions, acceptance criteria, and suggested tests. Also provide a friendly reply message explaining what you did.',
    prompt: userMessage,
  })

  return object
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && pnpm vitest run src/tests/services/llm.test.ts`
Expected: PASS

- [ ] **Step 5: Run check**

Run: `cd api && pnpm check`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add api/package.json api/src/services/llm.ts api/src/tests/services/llm.test.ts
git commit -m "feat: add LLM service for task generation"
```

---

### Task 3: Update Send-Message Route

**Files:**
- Modify: `api/src/routes/send-message.ts:1-58`

- [ ] **Step 1: Write the failing test**

Update `api/src/tests/routes/send-message.test.ts` to expect new structure:

```typescript
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildApp, cleanDb } from '../setup/test-helpers'
import { generateTask } from '@/services/llm'

vi.mock('@/services/llm', () => ({
  generateTask: vi.fn().mockResolvedValue({
    task: {
      id: 'test-id',
      authorId: 'test-author',
      chatId: 'test-chat',
      title: 'Test Task',
      description: 'Test description',
      steps: ['Step 1'],
      estimatedTime: '1 hour',
      implementationSuggestion: 'Test suggestion',
      acceptanceCriteria: ['Test criteria'],
      suggestedTests: ['Test tests'],
      content: 'Test content',
      chatHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    reply: 'I have created a task for you.',
  }),
}))

let helper: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  helper = await buildApp()
})

beforeEach(async () => {
  await cleanDb(helper.testDb)
})

describe('POST /send-message', () => {
  it('returns 200 and response when message is valid', async () => {
    const res = await helper.app.inject({
      method: 'POST',
      url: '/send-message',
      payload: { message: 'Create a login page' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('data')
    expect(body.data).toHaveProperty('task')
    expect(body.data).toHaveProperty('reply')
    expect(body.data.task).toHaveProperty('id')
    expect(body.data.task).toHaveProperty('title')
    expect(body.data.task).toHaveProperty('description')
  })

  it('returns 400 when message is missing', async () => {
    const res = await helper.app.inject({
      method: 'POST',
      url: '/send-message',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when message is empty string', async () => {
    const res = await helper.app.inject({
      method: 'POST',
      url: '/send-message',
      payload: { message: '' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when message exceeds max length', async () => {
    const longMessage = 'a'.repeat(10001)
    const res = await helper.app.inject({
      method: 'POST',
      url: '/send-message',
      payload: { message: longMessage },
    })

    expect(res.statusCode).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && pnpm vitest run src/tests/routes/send-message.test.ts`
Expected: FAIL - response structure doesn't match

- [ ] **Step 3: Write implementation**

Update `api/src/routes/send-message.ts`:

```typescript
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import { type Task, TaskSchema } from '@/types/task'
import { generateTask } from '@/services/llm'

export const sendMessage: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/send-message',
    {
      schema: {
        summary: 'Send a message to the agent',
        tags: ['chatbot'],
        body: z.object({
          message: z.string().min(1).max(10000),
        }),
        response: {
          200: z.object({
            data: z.object({
              task: TaskSchema,
              reply: z.string(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { message } = request.body

      const { task: generatedTask, reply: agentReply } = await generateTask(
        message
      )

      const response: Task = {
        ...generatedTask,
        id: uuidv7(),
        authorId: uuidv7(),
        chatId: uuidv7(),
        createdAt: new Date(),
        updatedAt: new Date(),
        chatHistory: [],
      }

      // Insert chat here

      return reply.status(200).send({ data: { task: response, reply: agentReply } })
    },
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && pnpm vitest run src/tests/routes/send-message.test.ts`
Expected: PASS

- [ ] **Step 5: Run check**

Run: `cd api && pnpm check`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add api/src/routes/send-message.ts api/src/tests/routes/send-message.test.ts
git commit -m "feat: integrate LLM service in send-message route"
```

---

### Task 4: Final Verification

**Files:**
- None (verification only)

- [ ] **Step 1: Run all tests**

Run: `cd api && pnpm test`
Expected: All tests pass

- [ ] **Step 2: Run check**

Run: `pnpm check`
Expected: No errors

- [ ] **Step 3: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: complete LLM task generation feature"
```