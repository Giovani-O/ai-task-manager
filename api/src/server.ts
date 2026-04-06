import 'dotenv/config'
import { fastifyCors } from '@fastify/cors'
import { fastifySwagger } from '@fastify/swagger'
import scalarApiReference from '@scalar/fastify-api-reference'
import Fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { chatsRouter } from '@/routes/chats'
import { db } from './db'
import { createTask } from './routes/create-task'
import { getTask } from './routes/get-task'
import { listTasks } from './routes/list-tasks'

const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
app.decorate('db', db)

await app.register(fastifyCors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
})

await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'AI Task Manager API',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
})

await app.register(scalarApiReference, {
  routePrefix: '/docs',
})

app.get('/health', async () => ({ status: 'ok' }))

await app.register(listTasks)
await app.register(getTask)
await app.register(createTask)
await app.register(chatsRouter)

await app.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.info('--------------------------------------------------------')
  console.info('    Node.js server is running! http://localhost:3333    ')
  console.info('    Docs available at http://localhost:3333/docs        ')
  console.info('--------------------------------------------------------')
})
