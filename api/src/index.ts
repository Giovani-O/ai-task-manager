import 'dotenv/config'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import scalarApiReference from '@scalar/fastify-api-reference'
import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'

const app = Fastify({ logger: true })

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

await app.register(cors, {
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
})

await app.register(swagger, {
  openapi: {
    info: {
      title: 'AI Task Manager API',
      version: '1.0.0',
    },
  },
})

await app.register(scalarApiReference, {
  routePrefix: '/reference',
})

app.get('/health', async () => ({ status: 'ok' }))

await app.listen({ port: 3333, host: '0.0.0.0' })
