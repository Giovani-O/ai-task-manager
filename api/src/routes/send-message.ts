import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import { type Task, TaskSchema } from '@/types/task'

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
            data: TaskSchema,
          }),
        },
      },
    },
    async (request, reply) => {
      const { message } = request.body

      const response: Task = {
        id: uuidv7(),
        authorId: uuidv7(),
        chatId: uuidv7(),
        title: 'Lorem Ipsum',
        description: message,
        steps: ['Lorem ipsum dolor sit amet', 'Consectetur adipiscing elit'],
        estimatedTime: '1 hour',
        implementationSuggestion: 'Lorem ipsum dolor sit amet.',
        acceptanceCriteria: [
          'Lorem ipsum dolor sit amet',
          'Consectetur adipiscing elit',
        ],
        suggestedTests: [
          'Lorem ipsum dolor sit amet',
          'Consectetur adipiscing elit',
        ],
        content:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        chatHistory: [
          'Lorem ipsum dolor sit amet',
          'Consectetur adipiscing elit',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Insert chat here

      return reply.status(200).send({ data: response })
    },
  )
}
