import 'dotenv/config'
import { faker } from '@faker-js/faker'
import { Client } from 'pg'
import { uuidv7 } from 'uuidv7'

const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

const TASK_TITLES = [
  'Implement user authentication flow',
  'Create dashboard analytics widget',
  'Add file upload functionality',
  'Build notification system',
  'Design responsive navigation menu',
  'Implement search functionality',
  'Create user profile page',
  'Add dark mode support',
  'Build settings management panel',
  'Implement data export feature',
  'Create API rate limiting',
  'Add caching layer',
  'Build real-time chat feature',
  'Implement password reset flow',
  'Create onboarding wizard',
  'Add two-factor authentication',
  'Build activity feed component',
  'Implement drag-and-drop interface',
  'Create bulk import feature',
  'Add webhook integrations',
]

const TECH_STACK = [
  'React',
  'TypeScript',
  'PostgreSQL',
  'Fastify',
  'Drizzle ORM',
  'TailwindCSS',
  'Shadcn/ui',
  'Vitest',
  'Zod',
]

function generateSteps(): string[] {
  const count = faker.number.int({ min: 3, max: 6 })
  return Array.from({ length: count }, () => faker.hacker.phrase())
}

function generateAcceptanceCriteria(): string[] {
  const count = faker.number.int({ min: 3, max: 5 })
  return Array.from(
    { length: count },
    () =>
      `${faker.hacker.verb()} ${faker.hacker.noun()} ${faker.hacker.adjective()}`,
  )
}

function generateTests(): string[] {
  const count = faker.number.int({ min: 2, max: 4 })
  return Array.from(
    { length: count },
    (_, i) => `it('${faker.hacker.verb()} ${faker.hacker.noun()} ${i + 1}')`,
  )
}

async function seed() {
  await client.connect()

  console.log('Creating chats table...')
  await client.query(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  console.log('Creating tasks table...')
  await client.query(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL REFERENCES chats(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    steps JSONB NOT NULL,
    estimated_time TEXT NOT NULL,
    implementation_suggestion TEXT NOT NULL,
    acceptance_criteria JSONB NOT NULL,
    suggested_tests JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )
`)

  console.log('Truncating tables...')
  await client.query('TRUNCATE TABLE chats RESTART IDENTITY CASCADE')
  await client.query('TRUNCATE TABLE tasks RESTART IDENTITY CASCADE')

  console.log('Seeding 10 chats...')
  const chatIds: string[] = []
  for (let i = 0; i < 10; i++) {
    const id = uuidv7()
    chatIds.push(id)
    const title = faker.lorem.words({ min: 3, max: 5 })
    const description = faker.lorem.sentence()

    await client.query(
      `INSERT INTO chats (id, title, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)`,
      [id, title, description, new Date(), new Date()],
    )
    console.log(`Created chat: ${title}`)
  }

  console.log('Seeding 5 tasks...')
  for (let i = 0; i < 5; i++) {
    const id = uuidv7()
    const chatId = chatIds[i % chatIds.length]
    const title = faker.helpers.arrayElement(TASK_TITLES)
    const description = faker.hacker.phrase()
    const steps = generateSteps()
    const estimatedTime = `${faker.number.int({ min: 1, max: 5 })} day${faker.number.int({ min: 1, max: 5 }) > 1 ? 's' : ''}`
    const tech1 = faker.helpers.arrayElement(TECH_STACK)
    const tech2 = faker.helpers.arrayElement(TECH_STACK)
    const implementationSuggestion = `Use ${tech1} for the frontend and ${tech2} for backend integration.`
    const acceptanceCriteria = generateAcceptanceCriteria()
    const suggestedTests = generateTests()

    await client.query(
      `INSERT INTO tasks (id, chat_id, title, description, steps, estimated_time, implementation_suggestion, acceptance_criteria, suggested_tests, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        chatId,
        title,
        description,
        JSON.stringify(steps),
        estimatedTime,
        implementationSuggestion,
        JSON.stringify(acceptanceCriteria),
        JSON.stringify(suggestedTests),
        new Date(),
        new Date(),
      ],
    )
    console.log(`Created task: ${title}`)
  }

  console.log('Seed complete!')
  await client.end()
}

seed().catch(console.error)
