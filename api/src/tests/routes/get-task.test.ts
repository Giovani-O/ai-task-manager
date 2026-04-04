import { uuidv7 } from 'uuidv7'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  buildApp,
  cleanDb,
  insertChat,
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

describe('GET /tasks/:id', () => {
  it('returns 404 when task does not exist', async () => {
    const nonExistentId = uuidv7()
    const res = await helper.app.inject({
      method: 'GET',
      url: `/tasks/${nonExistentId}`,
    })
    expect(res.statusCode).toBe(404)
    expect(res.json()).toEqual({ error: 'Task not found' })
  })

  it('returns 400 when id is not a valid UUID', async () => {
    const res = await helper.app.inject({
      method: 'GET',
      url: '/tasks/not-a-uuid',
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns the task with all expected fields', async () => {
    const user = await insertUser(helper.testDb, {
      id: uuidv7(),
      email: 'author@task.me',
      name: 'Task Author',
    })
    const chat = await insertChat(helper.testDb, { id: uuidv7() })
    const task = await insertTask(helper.testDb, {
      id: uuidv7(),
      authorId: user.id,
      chatId: chat.id,
      title: 'My Task',
      description: 'Detailed description',
      steps: ['Step 1', 'Step 2'],
      estimatedTime: '4h',
      implementationSuggestion: 'Use composition',
      acceptanceCriteria: ['Works correctly'],
      suggestedTests: ['Unit test it'],
      content: 'Full content here',
      chatHistory: [{ role: 'user', content: 'hello' }],
    })

    const res = await helper.app.inject({
      method: 'GET',
      url: `/tasks/${task.id}`,
    })
    const body = res.json()

    expect(res.statusCode).toBe(200)
    expect(body.task).toMatchObject({
      id: task.id,
      authorId: user.id,
      title: 'My Task',
      description: 'Detailed description',
      steps: ['Step 1', 'Step 2'],
      estimatedTime: '4h',
      implementationSuggestion: 'Use composition',
      acceptanceCriteria: ['Works correctly'],
      suggestedTests: ['Unit test it'],
      content: 'Full content here',
      chatHistory: [{ role: 'user', content: 'hello' }],
      userName: 'Task Author',
    })
  })

  it('task response includes createdAt and updatedAt timestamps', async () => {
    const user = await insertUser(helper.testDb, {
      id: uuidv7(),
      email: 'timestamps@task.me',
    })
    const chat = await insertChat(helper.testDb, { id: uuidv7() })
    const task = await insertTask(helper.testDb, {
      id: uuidv7(),
      authorId: user.id,
      chatId: chat.id,
    })

    const res = await helper.app.inject({
      method: 'GET',
      url: `/tasks/${task.id}`,
    })
    const { task: responseTask } = res.json()

    expect(res.statusCode).toBe(200)
    expect(responseTask).toHaveProperty('createdAt')
    expect(responseTask).toHaveProperty('updatedAt')
  })

  it('returns the correct task when multiple tasks exist', async () => {
    const user = await insertUser(helper.testDb, {
      id: uuidv7(),
      email: 'multi@task.me',
    })
    const chat = await insertChat(helper.testDb, { id: uuidv7() })
    const task1 = await insertTask(helper.testDb, {
      id: uuidv7(),
      authorId: user.id,
      chatId: chat.id,
      title: 'First Task',
    })
    const task2 = await insertTask(helper.testDb, {
      id: uuidv7(),
      authorId: user.id,
      chatId: chat.id,
      title: 'Second Task',
    })

    const res = await helper.app.inject({
      method: 'GET',
      url: `/tasks/${task1.id}`,
    })
    const body = res.json()

    expect(res.statusCode).toBe(200)
    expect(body.task.id).toBe(task1.id)
    expect(body.task.title).toBe('First Task')
    expect(body.task.id).not.toBe(task2.id)
  })
})
