import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp, cleanDb } from '../setup/test-helpers'

let app: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  app = await buildApp()
})

beforeEach(async () => {
  await cleanDb()
})

afterAll(async () => {
  await app.close()
})

describe('GET /users', () => {
  it('returns an empty array when there are no users', async () => {
    const res = await app.inject({ method: 'GET', url: '/users' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toEqual({
      page: 1,
      pageSize: 20,
      users: [],
    })
  })
})
