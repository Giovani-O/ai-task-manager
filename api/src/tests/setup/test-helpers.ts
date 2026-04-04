import { fastifyCors } from '@fastify/cors'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { fastify } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import pg from 'pg'
import { uuidv7 } from 'uuidv7'
import * as schema from '@/db/schema'
import { chat, tasks, users } from '@/db/schema'
import { env } from '@/env'
import { getTask } from '@/routes/get-task'
import { listTasks } from '@/routes/list-tasks'
import { listUsers } from '@/routes/list-users'
import { sendMessage } from '@/routes/send-message'

type AppHelper = {
  app: ReturnType<typeof fastify>
  testDb: NodePgDatabase<typeof schema>
}

let _helper: AppHelper | undefined

// Returns (and caches) a single shared app instance for the whole test run.
// Migrations are run once in global-setup.ts before any test file executes.
export async function buildApp(): Promise<AppHelper> {
  if (_helper) return _helper

  const connectionString = env.DATABASE_URL || ''

  const pool = new pg.Pool({ connectionString })
  const testDb = drizzle(pool, { schema, casing: 'snake_case' })

  const app = fastify().withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(fastifyCors, { origin: true })
  app.decorate('db', testDb)

  app.register(listUsers)
  app.register(listTasks)
  app.register(getTask)
  app.register(sendMessage)

  await app.ready()

  _helper = { app, testDb }
  return _helper
}

// Limpa banco de testes (order respects FKs: child tables before users)
export async function cleanDb(db: NodePgDatabase<typeof schema>) {
  await db.delete(tasks)
  await db.delete(users)
  await db.delete(chat)
}

// Insere user de teste
export async function insertUser(
  db: NodePgDatabase<typeof schema>,
  overrides: Partial<typeof users.$inferInsert> = {},
) {
  const defaults = {
    id: uuidv7(),
    name: 'John Doe',
    email: 'john@doe.com',
  }

  const result = await db
    .insert(users)
    .values({ ...defaults, ...overrides })
    .returning()

  return result[0]
}

// Insere chat de teste
export async function insertChat(
  db: NodePgDatabase<typeof schema>,
  overrides: Partial<typeof chat.$inferInsert> = {},
) {
  const defaults = {
    id: uuidv7(),
    title: 'Test Chat',
    description: 'A test chat description',
  }

  const result = await db
    .insert(chat)
    .values({ ...defaults, ...overrides })
    .returning()

  return result[0]
}

// Insere task de teste
export async function insertTask(
  db: NodePgDatabase<typeof schema>,
  overrides: Partial<typeof tasks.$inferInsert> & {
    authorId: string
    chatId: string
  },
) {
  const defaults = {
    id: uuidv7(),
    title: 'Test Task',
    description: 'A test task description',
    steps: ['Step 1', 'Step 2'],
    estimatedTime: '2h',
    implementationSuggestion: 'Use TDD',
    acceptanceCriteria: ['It works'],
    suggestedTests: ['Test it'],
    content: 'Task content',
    chatHistory: [],
  }

  const result = await db
    .insert(tasks)
    .values({ ...defaults, ...overrides })
    .returning()

  return result[0]
}
