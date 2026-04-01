import { fastifyCors } from '@fastify/cors'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fastify } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import postgres from 'postgres'
import { db } from '@/db'
import { users } from '@/db/schema/schema'
import { listUsers } from '@/routes/list-users'
import path from 'node:path'
import { env } from '@/env'

// Setup do server de testes
export async function buildApp() {
  const connectionString = env.DATABASE_URL || ''

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
  app.register(listUsers)

  return app
}

// Limpa banco de testes
export async function cleanDb() {
  await db.delete(users)
}

// Insere dados de teste
export async function insertWebhook(
  overrides: Partial<typeof users.$inferInsert> = {},
) {
  const defaults = {
    id: '019d4a17-1404-73af-9e52-40a296ad3b42',
    name: 'John Doe',
    email: 'john@doe.com',
  }

  const result = await db
    .insert(users)
    .values({ ...defaults, ...overrides })
    .returning()

  return result[0]
}
