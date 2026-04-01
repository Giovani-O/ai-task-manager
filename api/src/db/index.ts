import { drizzle } from 'drizzle-orm/node-postgres'
import { env } from '@/env'
import * as schema from './schema'

const databaseUrl = env.DATABASE_URL

export const db = drizzle(databaseUrl, { schema, casing: 'snake_case' })
