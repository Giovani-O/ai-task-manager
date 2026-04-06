import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { chat as chatTable, tasks } from '@/db/schema'
import { TaskSchema } from '@/types/task'

export const createTask: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/tasks',
    {
      schema: {
        summary: 'Save a generated task',
        tags: ['task'],
        body: z.object({
          chatId: z.string().uuid(),
          title: z.string().min(1),
          description: z.string().min(1),
          steps: z.array(z.string()),
          estimatedTime: z.string().min(1),
          implementationSuggestion: z.string().min(1),
          acceptanceCriteria: z.array(z.string()),
          suggestedTests: z.array(z.string()),
        }),
        response: {
          201: z.object({
            task: TaskSchema,
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const {
        chatId,
        title,
        description,
        steps,
        estimatedTime,
        implementationSuggestion,
        acceptanceCriteria,
        suggestedTests,
      } = request.body

      const chatResult = await app.db
        .select({ id: chatTable.id })
        .from(chatTable)
        .where(eq(chatTable.id, chatId))
        .limit(1)

      if (!chatResult[0]) {
        return reply.status(404).send({ error: 'Chat not found' })
      }

      const result = await app.db
        .insert(tasks)
        .values({
          chatId,
          title,
          description,
          steps,
          estimatedTime,
          implementationSuggestion,
          acceptanceCriteria,
          suggestedTests,
        })
        .returning()

      if (!result[0]) {
        throw new Error('Failed to create task')
      }

      return reply.status(201).send({ task: result[0] })
    },
  )
}
