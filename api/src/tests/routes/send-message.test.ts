import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp, cleanDb } from '../setup/test-helpers'

let helper: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  helper = await buildApp()
})

beforeEach(async () => {
  await cleanDb(helper.testDb)
})

describe('POST /send-message', () => {
  it('returns 200 and response when message is valid', async () => {
    const res = await helper.app.inject({
      method: 'POST',
      url: '/send-message',
      payload: { message: 'Hello, agent!' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('data')
    expect(body.data).toHaveProperty('id')
    expect(body.data).toHaveProperty('title')
    expect(body.data).toHaveProperty('description')
  })

  it('returns 400 when message is missing', async () => {
    const res = await helper.app.inject({
      method: 'POST',
      url: '/send-message',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when message is empty string', async () => {
    const res = await helper.app.inject({
      method: 'POST',
      url: '/send-message',
      payload: { message: '' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when message exceeds max length', async () => {
    const longMessage = 'a'.repeat(10001)
    const res = await helper.app.inject({
      method: 'POST',
      url: '/send-message',
      payload: { message: longMessage },
    })

    expect(res.statusCode).toBe(400)
  })
})
