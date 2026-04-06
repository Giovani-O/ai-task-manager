import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'

export const chat = pgTable('chats', {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  title: text(),
  description: text(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .$onUpdate(() => new Date()),
})

export const tasks = pgTable('tasks', {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  chatId: text('chat_id')
    .notNull()
    .references(() => chat.id),
  title: text().notNull(),
  description: text().notNull(),
  steps: jsonb().notNull().$type<string[]>(),
  estimatedTime: text('estimated_time').notNull(),
  implementationSuggestion: text('implementation_suggestion').notNull(),
  acceptanceCriteria: jsonb('acceptance_criteria').notNull().$type<string[]>(),
  suggestedTests: jsonb('suggested_tests').notNull().$type<string[]>(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .$onUpdate(() => new Date()),
})
