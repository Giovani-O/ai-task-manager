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
  chatHistory: z.array(z.unknown()),
  createdAt: z.date(),
  updatedAt: z.date(),
  userName: z.string(),
})

export type Task = z.infer<typeof TaskSchema>
