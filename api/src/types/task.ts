import { z } from 'zod'

export const TaskSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  title: z.string(),
  description: z.string(),
  steps: z.array(z.string()),
  estimatedTime: z.string(),
  implementationSuggestion: z.string(),
  acceptanceCriteria: z.array(z.string()),
  suggestedTests: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Task = z.infer<typeof TaskSchema>

export const TaskInitialDataSchema = TaskSchema.omit({
  id: true,
  chatId: true,
  createdAt: true,
  updatedAt: true,
})

export type TaskInitialData = z.infer<typeof TaskInitialDataSchema>
