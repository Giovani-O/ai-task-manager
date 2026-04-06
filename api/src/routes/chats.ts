import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { chat as chatTable } from '@/db/schema'
import { generateTask } from '@/services/llm'
import type * as Task from '@/types/task'
import { TaskInitialDataSchema, TaskSchema } from '@/types/task'

type Message =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; task?: Record<string, unknown> }

export const chatsRouter: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/chats',
    {
      schema: {
        summary: 'Create a new chat',
        tags: ['chat'],
        body: z.object({
          title: z.string().optional(),
        }),
        response: {
          201: z.object({
            chatId: z.string(),
            createdAt: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { title } = request.body ?? {}

      const result = await app.db
        .insert(chatTable)
        .values({ title: title ?? null, description: '[]' })
        .returning({ id: chatTable.id, createdAt: chatTable.createdAt })

      if (!result[0]) {
        throw new Error('Failed to create chat')
      }

      return reply.status(201).send({
        chatId: result[0].id,
        createdAt: result[0].createdAt.toISOString(),
      })
    },
  )

  app.post(
    '/chats/:id/messages',
    {
      schema: {
        summary: 'Send a message to refine task',
        tags: ['chat'],
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          message: z.string().min(1).max(10000),
          task: TaskInitialDataSchema.optional(),
        }),
        response: {
          200: z.object({
            task: TaskSchema,
            reply: z.string(),
          }),
          404: z.object({
            error: z.string(),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id: chatId } = request.params
      const { message, task: taskData } = request.body

      const chatResult = await app.db
        .select({ description: chatTable.description })
        .from(chatTable)
        .where(eq(chatTable.id, chatId))
        .limit(1)

      if (!chatResult[0]) {
        return reply.status(404).send({ error: 'Chat not found' })
      }

      let history: Message[] = []
      try {
        history = JSON.parse(chatResult[0].description ?? '[]') as Message[]
      } catch {
        history = []
      }

      const contextMessages: Message[] = [
        ...history,
        ...(taskData
          ? [
              {
                role: 'user' as const,
                content: `Current task state:\n${JSON.stringify(taskData, null, 2)}`,
              },
            ]
          : []),
        { role: 'user', content: message },
      ]

      let generatedTask: Awaited<ReturnType<typeof generateTask>>['task']
      let agentReply: string
      try {
        const result = await generateTask(message, contextMessages)
        generatedTask = result.task
        agentReply = result.reply
      } catch (err) {
        const reason = err instanceof Error ? err.message : 'unknown error'
        const errorMsg = reason.startsWith('LLM generation failed:')
          ? reason
          : `LLM generation failed: ${reason}`
        return reply.status(500).send({ error: errorMsg })
      }

      const now = new Date()
      const fullTask: Task.Task = {
        ...generatedTask,
        id: '',
        chatId,
        createdAt: now,
        updatedAt: now,
      }

      const updatedHistory: Message[] = [
        ...history,
        { role: 'user', content: message },
        {
          role: 'assistant',
          content: agentReply,
          task: generatedTask as Record<string, unknown>,
        },
      ]

      try {
        await app.db
          .update(chatTable)
          .set({ description: JSON.stringify(updatedHistory) })
          .where(eq(chatTable.id, chatId))
      } catch {
        return reply.status(500).send({ error: 'Failed to save chat' })
      }

      return reply.status(200).send({
        task: fullTask,
        reply: agentReply,
      })
    },
  )

  app.delete(
    '/chats/:id',
    {
      schema: {
        summary: 'Delete a chat',
        tags: ['chat'],
        params: z.object({
          id: z.string().uuid(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id: chatId } = request.params

      const result = await app.db
        .delete(chatTable)
        .where(eq(chatTable.id, chatId))
        .returning()

      if (result.length === 0) {
        return reply.status(404).send({ error: 'Chat not found' })
      }

      return reply.status(200).send({ success: true })
    },
  )
}
