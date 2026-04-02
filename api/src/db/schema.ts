import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'

export const users = pgTable('users', {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  email: text().unique().notNull(),
  name: text().notNull(),
  lastLogin: timestamp('last_login', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .$onUpdate(() => new Date()),
})

export const tasks = pgTable('tasks', {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  title: text().notNull(),
  description: text().notNull(),
  steps: jsonb().notNull().$type<string[]>(),
  estimatedTime: text('estimated_time').notNull(),
  implementationSuggestion: text('implementation_suggestion').notNull(),
  acceptanceCriteria: jsonb('acceptance_criteria').notNull().$type<string[]>(),
  suggestedTests: jsonb('suggested_tests').notNull().$type<string[]>(),
  content: text().notNull(),
  chatHistory: jsonb('chat_history').notNull().$type<unknown[]>(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .$onUpdate(() => new Date()),
})
