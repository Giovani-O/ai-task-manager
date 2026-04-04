import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { TaskSchema } from '@/types/task'

const GenerateTaskResponseSchema = z.object({
  task: TaskSchema.omit({
    id: true,
    authorId: true,
    chatId: true,
    createdAt: true,
    updatedAt: true,
    chatHistory: true,
    content: true,
  }),
  reply: z.string(),
})

export type GenerateTaskResponse = z.infer<typeof GenerateTaskResponseSchema>

export async function generateTask(
  userMessage: string,
): Promise<GenerateTaskResponse> {
  const model = google('gemini-2.5-flash')

  try {
    const { object } = await generateObject({
      model,
      schema: GenerateTaskResponseSchema,
      system:
        'You are a Senior Project Manager. Given a user request, break it down into a structured task with title, description, steps, estimated time, implementation suggestions, acceptance criteria, and suggested tests. Also provide a friendly reply message explaining what you did.',
      prompt: userMessage,
    })

    return object
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`LLM generation failed: ${error.message}`)
    }
    throw new Error('LLM generation failed: unknown error')
  }
}
