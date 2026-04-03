import { uuidv7 } from 'uuidv7'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  buildApp,
  cleanDb,
  insertTask,
  insertUser,
} from '../setup/test-helpers'

let helper: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  helper = await buildApp()
})

beforeEach(async () => {
  await cleanDb(helper.testDb)
})

describe('GET /tasks', () => {
  it('tasks array must be empty when there are no tasks', async () => {
    const res = await helper.app.inject({ method: 'GET', url: '/tasks' })
    const body = res.json()
    expect(res.statusCode).toBe(200)
    expect(body).toEqual({
      page: 1,
      pageSize: 20,
      tasks: [],
    })
  })

  it('tasks array must return existing tasks in desc createdAt order by default', async () => {
    const user = await insertUser(helper.testDb, {
      id: uuidv7(),
      email: 'author@test.me',
    })
    const a = await insertTask(helper.testDb, {
      id: uuidv7(),
      authorId: user.id,
      title: 'Task A',
    })
    const b = await insertTask(helper.testDb, {
      id: uuidv7(),
      authorId: user.id,
      title: 'Task B',
    })
    const c = await insertTask(helper.testDb, {
      id: uuidv7(),
      authorId: user.id,
      title: 'Task C',
    })

    const res = await helper.app.inject({ method: 'GET', url: '/tasks' })
    const { tasks } = res.json()
    expect(res.statusCode).toBe(200)
    expect(tasks[0].id).toBe(c.id)
    expect(tasks[1].id).toBe(b.id)
    expect(tasks[2].id).toBe(a.id)
  })

  it('task includes userName from joined user', async () => {
    const user = await insertUser(helper.testDb, {
      id: uuidv7(),
      email: 'named@test.me',
      name: 'Named User',
    })
    await insertTask(helper.testDb, { id: uuidv7(), authorId: user.id })

    const res = await helper.app.inject({ method: 'GET', url: '/tasks' })
    const { tasks } = res.json()
    expect(res.statusCode).toBe(200)
    expect(tasks[0].userName).toBe('Named User')
  })

  it('task includes required fields: id, title, estimatedTime, createdAt, userName', async () => {
    const user = await insertUser(helper.testDb, {
      id: uuidv7(),
      email: 'fields@test.me',
    })
    await insertTask(helper.testDb, {
      id: uuidv7(),
      authorId: user.id,
      title: 'Field Test',
      estimatedTime: '3h',
    })

    const res = await helper.app.inject({ method: 'GET', url: '/tasks' })
    const { tasks } = res.json()
    expect(res.statusCode).toBe(200)
    expect(tasks[0]).toHaveProperty('id')
    expect(tasks[0]).toHaveProperty('title', 'Field Test')
    expect(tasks[0]).toHaveProperty('estimatedTime', '3h')
    expect(tasks[0]).toHaveProperty('createdAt')
    expect(tasks[0]).toHaveProperty('userName')
  })

  it('returns correct pagination metadata', async () => {
    const res = await helper.app.inject({ method: 'GET', url: '/tasks' })
    const body = res.json()
    expect(body.page).toBe(1)
    expect(body.pageSize).toBe(20)
  })

  it('respects custom pageSize parameter', async () => {
    const user = await insertUser(helper.testDb, {
      id: uuidv7(),
      email: 'page@test.me',
    })
    for (let i = 0; i < 5; i++) {
      await insertTask(helper.testDb, {
        id: uuidv7(),
        authorId: user.id,
        title: `Task ${i}`,
      })
    }

    const res = await helper.app.inject({
      method: 'GET',
      url: '/tasks?pageSize=2',
    })
    const body = res.json()
    expect(body.tasks).toHaveLength(2)
    expect(body.page).toBe(1)
    expect(body.pageSize).toBe(2)
  })

  it('paginates through results correctly', async () => {
    const user = await insertUser(helper.testDb, {
      id: uuidv7(),
      email: 'paginate@test.me',
    })
    for (let i = 0; i < 5; i++) {
      await insertTask(helper.testDb, {
        id: uuidv7(),
        authorId: user.id,
        title: `Task ${i}`,
      })
    }

    const page1 = await helper.app.inject({
      method: 'GET',
      url: '/tasks?page=1&pageSize=2',
    })
    const page2 = await helper.app.inject({
      method: 'GET',
      url: '/tasks?page=2&pageSize=2',
    })

    expect(page1.json().tasks).toHaveLength(2)
    expect(page1.json().page).toBe(1)
    expect(page2.json().tasks).toHaveLength(2)
    expect(page2.json().page).toBe(2)

    const page1Ids = page1.json().tasks.map((t: { id: string }) => t.id)
    const page2Ids = page2.json().tasks.map((t: { id: string }) => t.id)
    expect(page1Ids).not.toEqual(expect.arrayContaining(page2Ids))
  })

  it('returns empty array when page exceeds total pages', async () => {
    const user = await insertUser(helper.testDb, {
      id: uuidv7(),
      email: 'exceed@test.me',
    })
    await insertTask(helper.testDb, { id: uuidv7(), authorId: user.id })

    const res = await helper.app.inject({
      method: 'GET',
      url: '/tasks?page=99&pageSize=20',
    })
    const body = res.json()
    expect(body.tasks).toHaveLength(0)
    expect(body.page).toBe(99)
  })
})
