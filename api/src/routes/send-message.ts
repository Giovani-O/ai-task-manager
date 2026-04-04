import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import { generateTask } from '@/services/llm'
import { TaskSchema } from '@/types/task'

export const sendMessage: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/send-message',
    {
      schema: {
        summary: 'Send a message to the agent',
        tags: ['chatbot'],
        body: z.object({
          message: z.string().min(1).max(10000),
        }),
        response: {
          200: z.object({
            data: z.object({
              task: TaskSchema,
              reply: z.string(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { message } = request.body

      const { task: generatedTask, reply: agentReply } =
        await generateTask(message)

      const now = new Date()
      const response = {
        ...generatedTask,
        id: uuidv7(),
        authorId: uuidv7(),
        chatId: uuidv7(),
        content: '',
        createdAt: now,
        updatedAt: now,
        chatHistory: [],
      }

      return reply
        .status(200)
        .send({ data: { task: response, reply: agentReply } })
    },
  )
}
