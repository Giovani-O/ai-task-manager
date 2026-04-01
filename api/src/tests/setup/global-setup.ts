import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'

let container: StartedPostgreSqlContainer

export async function setup() {
  // Start the container
  container = await new PostgreSqlContainer('postgres:17-alpine').start()

  // Save the URI to an environment variable so workers can see it
  process.env.DATABASE_URL = container.getConnectionUri()

  // Return the teardown function
  return async () => {
    await container.stop()
  }
}
