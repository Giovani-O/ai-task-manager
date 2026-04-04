import { desc } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { tasks } from '@/db/schema'

export const listTasks: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/tasks',
    {
      schema: {
        summary: 'List tasks',
        tags: ['task'],
        querystring: z.object({
          page: z.coerce.number().min(1).default(1),
          pageSize: z.coerce.number().default(20),
          sortBy: z
            .enum(['title', 'estimatedTime', 'createdAt'])
            .default('createdAt'),
          sortDirection: z.enum(['asc', 'desc']).default('desc'),
        }),
        response: {
          200: z.object({
            tasks: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                estimatedTime: z.string(),
                createdAt: z.date(),
              }),
            ),
            page: z.number(),
            pageSize: z.number(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { page, pageSize, sortBy, sortDirection } = request.query
      const offset = (page - 1) * pageSize

      const sortColumn =
        tasks[sortBy === 'estimatedTime' ? 'estimatedTime' : sortBy]
      const order = sortDirection === 'asc' ? sortColumn : desc(sortColumn)

      const result = await app.db
        .select({
          id: tasks.id,
          title: tasks.title,
          estimatedTime: tasks.estimatedTime,
          createdAt: tasks.createdAt,
        })
        .from(tasks)
        .orderBy(order)
        .limit(pageSize)
        .offset(offset)

      return reply.status(200).send({
        tasks: result,
        page,
        pageSize,
      })
    },
  )
}
