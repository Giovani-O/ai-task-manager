import path from 'node:path'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'

let container: StartedPostgreSqlContainer

export async function setup() {
  // Start the container
  container = await new PostgreSqlContainer('postgres:17-alpine').start()

  // Save the URI to an environment variable so workers can see it
  const connectionString = container.getConnectionUri()
  process.env.DATABASE_URL = connectionString

  // Run migrations once for the entire test run
  const migrationClient = new pg.Pool({ connectionString })
  await migrate(drizzle(migrationClient), {
    migrationsFolder: path.join(process.cwd(), 'drizzle'),
  })
  await migrationClient.end()

  // Return the teardown function
  return async () => {
    await container.stop()
  }
}
