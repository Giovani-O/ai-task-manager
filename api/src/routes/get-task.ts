import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { tasks } from '@/db/schema'
import { TaskSchema } from '@/types/task'

export const getTask: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/tasks/:id',
    {
      schema: {
        summary: 'Get task by ID',
        tags: ['task'],
        params: z.object({
          id: z.string().uuid(),
        }),
        response: {
          200: z.object({
            task: TaskSchema,
          }),
          400: z.object({
            error: z.string(),
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params

      const result = await app.db
        .select({
          id: tasks.id,
          authorId: tasks.authorId,
          chatId: tasks.chatId,
          title: tasks.title,
          description: tasks.description,
          steps: tasks.steps,
          estimatedTime: tasks.estimatedTime,
          implementationSuggestion: tasks.implementationSuggestion,
          acceptanceCriteria: tasks.acceptanceCriteria,
          suggestedTests: tasks.suggestedTests,
          content: tasks.content,
          chatHistory: tasks.chatHistory,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(eq(tasks.id, id))
        .limit(1)

      if (result.length === 0) {
        return reply.status(404).send({ error: 'Task not found' })
      }

      return reply.status(200).send({ task: result[0] })
    },
  )
}
