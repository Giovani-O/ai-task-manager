import { z } from 'zod'

export const TaskSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  chatId: z.string(),
  title: z.string(),
  description: z.string(),
  steps: z.array(z.string()),
  estimatedTime: z.string(),
  implementationSuggestion: z.string(),
  acceptanceCriteria: z.array(z.string()),
  suggestedTests: z.array(z.string()),
  content: z.string(),
  chatHistory: z.array(
    z.discriminatedUnion('role', [
      z.object({ role: z.literal('user'), content: z.string() }),
      z.object({ role: z.literal('assistant'), content: z.string() }),
    ]),
  ),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Task = z.infer<typeof TaskSchema>

export const TaskInitialDataSchema = TaskSchema.omit({
  id: true,
  authorId: true,
  chatId: true,
  createdAt: true,
  updatedAt: true,
  chatHistory: true,
  content: true,
})

export type TaskInitialData = z.infer<typeof TaskInitialDataSchema>
