import { uuidv7 } from 'uuidv7'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp, cleanDb, insertUser } from '../setup/test-helpers'

let helper: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  helper = await buildApp()
})

beforeEach(async () => {
  await cleanDb(helper.testDb)
})

afterAll(async () => {
  await helper.app.close()
})

describe('GET /users', () => {
  it('users array must be empty when there are no users', async () => {
    const res = await helper.app.inject({ method: 'GET', url: '/users' })
    const body = res.json()
    expect(res.statusCode).toBe(200)
    expect(body).toEqual({
      page: 1,
      pageSize: 20,
      users: [],
    })
  })

  it('users array must return the existent users in desc order', async () => {
    const a = await insertUser(helper.testDb, { id: uuidv7(), email: 'a@a.me' })
    const b = await insertUser(helper.testDb, { id: uuidv7(), email: 'b@b.me' })
    const c = await insertUser(helper.testDb, { id: uuidv7(), email: 'c@c.me' })

    const res = await helper.app.inject({ method: 'GET', url: '/users' })
    const { users } = res.json()
    expect(res.statusCode).toBe(200)
    expect(users[0].id).toBe(c.id)
    expect(users[1].id).toBe(b.id)
    expect(users[2].id).toBe(a.id)
  })

  it('users must include lastLogin field', async () => {
    const lastLogin = new Date('2026-04-01T10:30:00Z')
    await insertUser(helper.testDb, {
      id: uuidv7(),
      email: 'test@test.me',
      lastLogin,
    })

    const res = await helper.app.inject({ method: 'GET', url: '/users' })
    const { users } = res.json()
    expect(res.statusCode).toBe(200)
    expect(users[0]).toHaveProperty('lastLogin')
    expect(new Date(users[0].lastLogin)).toEqual(lastLogin)
  })

  it('lastLogin can be null', async () => {
    await insertUser(helper.testDb, {
      id: uuidv7(),
      email: 'null@test.me',
      lastLogin: null,
    })

    const res = await helper.app.inject({ method: 'GET', url: '/users' })
    const { users } = res.json()
    expect(res.statusCode).toBe(200)
    expect(users[0].lastLogin).toBeNull()
  })

  it('returns correct pagination metadata', async () => {
    const res = await helper.app.inject({ method: 'GET', url: '/users' })
    const body = res.json()
    expect(body.page).toBe(1)
    expect(body.pageSize).toBe(20)
  })

  it('respects custom pageSize parameter', async () => {
    for (let i = 0; i < 5; i++) {
      await insertUser(helper.testDb, { id: uuidv7(), email: `u${i}@test.me` })
    }

    const res = await helper.app.inject({
      method: 'GET',
      url: '/users?pageSize=2',
    })
    const body = res.json()
    expect(body.users).toHaveLength(2)
    expect(body.page).toBe(1)
    expect(body.pageSize).toBe(2)
  })

  it('paginates through results correctly', async () => {
    for (let i = 0; i < 5; i++) {
      await insertUser(helper.testDb, { id: uuidv7(), email: `u${i}@test.me` })
    }

    const page1 = await helper.app.inject({
      method: 'GET',
      url: '/users?page=1&pageSize=2',
    })
    const page2 = await helper.app.inject({
      method: 'GET',
      url: '/users?page=2&pageSize=2',
    })

    expect(page1.json().users).toHaveLength(2)
    expect(page1.json().page).toBe(1)
    expect(page2.json().users).toHaveLength(2)
    expect(page2.json().page).toBe(2)

    const page1Ids = page1.json().users.map((u: { id: string }) => u.id)
    const page2Ids = page2.json().users.map((u: { id: string }) => u.id)
    expect(page1Ids).not.toEqual(expect.arrayContaining(page2Ids))
  })

  it('returns empty array when page exceeds total pages', async () => {
    await insertUser(helper.testDb, { id: uuidv7(), email: 'single@test.me' })

    const res = await helper.app.inject({
      method: 'GET',
      url: '/users?page=99&pageSize=20',
    })
    const body = res.json()
    expect(body.users).toHaveLength(0)
    expect(body.page).toBe(99)
  })
})
