import path from 'node:path'
import { fastifyCors } from '@fastify/cors'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { fastify } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import pg from 'pg'
import { uuidv7 } from 'uuidv7'
import * as schema from '@/db/schema'
import { users } from '@/db/schema'
import { env } from '@/env'
import { listUsers } from '@/routes/list-users'

// Setup do server de testes
export async function buildApp() {
  const connectionString = env.DATABASE_URL || ''

  // Run migrations (ensure DB is ready for this specific test suite)
  const migrationClient = new pg.Pool({ connectionString })
  await migrate(drizzle(migrationClient), {
    migrationsFolder: path.join(process.cwd(), 'drizzle'),
  })
  await migrationClient.end()

  // Create test DB
  const pool = new pg.Pool({ connectionString })
  const testDb = drizzle(pool, { schema, casing: 'snake_case' })

  const app = fastify().withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(fastifyCors, { origin: true })
  app.decorate('db', testDb)

  app.register(listUsers)

  return { app, testDb }
}

// Limpa banco de testes
export async function cleanDb(db: NodePgDatabase<typeof schema>) {
  await db.delete(users)
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
