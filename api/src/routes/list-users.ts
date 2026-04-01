import { desc } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { users } from '@/db/schema'

export const listUsers: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/users',
    {
      schema: {
        summary: 'List users',
        tags: ['user'],
        querystring: z.object({
          page: z.coerce.number().min(1).default(1),
          pageSize: z.coerce.number().default(20),
        }),
        response: {
          200: z.object({
            users: z.array(
              createSelectSchema(users).pick({
                id: true,
                name: true,
                email: true,
                lastLogin: true,
              }),
            ),
            page: z.number(),
            pageSize: z.number(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { page, pageSize } = request.query
      const offset = (page - 1) * pageSize

      const result = await app.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          lastLogin: users.lastLogin,
        })
        .from(users)
        .orderBy(desc(users.id))
        .limit(pageSize)
        .offset(offset)

      return reply.status(200).send({
        users: result,
        page,
        pageSize,
      })
    },
  )
}
