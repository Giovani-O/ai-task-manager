import path from 'node:path'
import { fastifyCors } from '@fastify/cors'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fastify } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import postgres from 'postgres'
import { uuidv7 } from 'uuidv7'
import { users } from '@/db/schema'
import { env } from '@/env'
import { listUsers } from '@/routes/list-users'

type TestDbType = PostgresJsDatabase<Record<string, never>> & {
  $client: postgres.Sql<{}>
}

// Setup do server de testes
export async function buildApp() {
  const connectionString = env.DATABASE_URL || ''

  // Create test DB
  const testDb = drizzle(postgres(connectionString))

  // Run migrations (ensure DB is ready for this specific test suite)
  const migrationClient = postgres(connectionString, { max: 1 })
  await migrate(drizzle(migrationClient), {
    migrationsFolder: path.join(process.cwd(), 'drizzle'),
  })
  await migrationClient.end()

  const app = fastify().withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(fastifyCors, { origin: true })
  app.decorate('db', testDb)

  app.register(listUsers)

  return { app, testDb }
}

// Limpa banco de testes
export async function cleanDb(db: TestDbType) {
  await db.delete(users)
}

// Insere user de teste
export async function insertUser(
  db: TestDbType,
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
