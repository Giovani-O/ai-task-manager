import { google } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { TaskSchema } from '@/types/task'

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60_000

const requestTimestamps: number[] = []

function checkRateLimit(): void {
  const now = Date.now()
  const windowStart = now - RATE_WINDOW_MS
  const recentRequests = requestTimestamps.filter((ts) => ts > windowStart)

  if (recentRequests.length >= RATE_LIMIT) {
    const oldestInWindow = recentRequests[0]
    const waitMs = oldestInWindow + RATE_WINDOW_MS - now
    const waitSec = Math.ceil(waitMs / 1000)
    throw new Error(
      `Rate limit exceeded. Please wait ${waitSec} second(s) before trying again.`,
    )
  }

  requestTimestamps.length = 0
  requestTimestamps.push(...recentRequests, now)
}

const GenerateTaskResponseSchema = z.object({
  task: TaskSchema.omit({
    id: true,
    chatId: true,
    createdAt: true,
    updatedAt: true,
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
  checkRateLimit()

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
