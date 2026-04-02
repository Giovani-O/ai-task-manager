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

function generateContent(task: {
  title: string
  description: string
  steps: string[]
  estimatedTime: string
  implementationSuggestion: string
  acceptanceCriteria: string[]
  suggestedTests: string[]
}): string {
  return `# ${task.title}

## Description
${task.description}

## Steps
${task.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Estimated Time
${task.estimatedTime}

## Implementation Suggestion
${task.implementationSuggestion}

## Acceptance Criteria
${task.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Suggested Tests
${task.suggestedTests.map((t) => `- ${t}`).join('\n')}
`
}

async function seed() {
  await client.connect()

  console.log('Creating users table...')
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      last_login TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  console.log('Creating tasks table...')
  await client.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      steps JSONB NOT NULL,
      estimated_time TEXT NOT NULL,
      implementation_suggestion TEXT NOT NULL,
      acceptance_criteria JSONB NOT NULL,
      suggested_tests JSONB NOT NULL,
      content TEXT NOT NULL,
      chat_history JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  console.log('Truncating tables...')
  await client.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
  await client.query('TRUNCATE TABLE tasks RESTART IDENTITY CASCADE')

  console.log('Seeding 30 users...')
  for (let i = 0; i < 30; i++) {
    const id = uuidv7()
    const email = faker.internet.email()
    const name = faker.person.fullName()
    const lastLogin = faker.date.recent({ days: 30 })

    await client.query(
      `INSERT INTO users (id, email, name, last_login, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING`,
      [id, email, name, lastLogin, new Date(), new Date()],
    )
    console.log(`Created user: ${name} (${email})`)
  }

  console.log('Seeding 60 tasks...')
  for (let i = 0; i < 60; i++) {
    const id = uuidv7()
    const title = faker.helpers.arrayElement(TASK_TITLES)
    const description = faker.hacker.phrase()
    const steps = generateSteps()
    const estimatedTime = `${faker.number.int({ min: 1, max: 5 })} day${faker.number.int({ min: 1, max: 5 }) > 1 ? 's' : ''}`
    const tech1 = faker.helpers.arrayElement(TECH_STACK)
    const tech2 = faker.helpers.arrayElement(TECH_STACK)
    const implementationSuggestion = `Use ${tech1} for the frontend and ${tech2} for backend integration.`
    const acceptanceCriteria = generateAcceptanceCriteria()
    const suggestedTests = generateTests()
    const content = generateContent({
      title,
      description,
      steps,
      estimatedTime,
      implementationSuggestion,
      acceptanceCriteria,
      suggestedTests,
    })
    const chatHistory: unknown[] = []

    await client.query(
      `INSERT INTO tasks (id, title, description, steps, estimated_time, implementation_suggestion, acceptance_criteria, suggested_tests, content, chat_history, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        title,
        description,
        JSON.stringify(steps),
        estimatedTime,
        implementationSuggestion,
        JSON.stringify(acceptanceCriteria),
        JSON.stringify(suggestedTests),
        content,
        JSON.stringify(chatHistory),
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
