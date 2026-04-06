import { google } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
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

type Message =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }

export async function generateTask(
  userMessage: string,
  chatHistory: Message[] = [],
): Promise<GenerateTaskResponse> {
  const model = google('gemini-2.5-flash')

  try {
    const { output } = await generateText({
      model,
      output: Output.object({
        schema: GenerateTaskResponseSchema,
      }),
      system:
        'You are a Senior Project Manager. Given a user request, break it down into a structured task with title, description, steps, estimated time, implementation suggestions, acceptance criteria, and suggested tests. Also provide a friendly reply message explaining what you did.',
      messages: [
        ...chatHistory.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: userMessage },
      ],
    })

    return output
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`LLM generation failed: ${error.message}`)
    }
    throw new Error('LLM generation failed: unknown error')
  }
}
