import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'

export const users = pgTable('users', {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  email: text().unique().notNull(),
  name: text().notNull(),
  lastLogin: timestamp('last_login', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  lastUpdated: timestamp('last_updated', { mode: 'date' })
    .notNull()
    .$onUpdate(() => new Date()),
})
