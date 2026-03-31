import 'dotenv/config'
import { faker } from '@faker-js/faker'
import { Client } from 'pg'
import { uuidv7 } from 'uuidv7'

const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

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
      last_updated TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  console.log('Truncating users table...')
  await client.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE')

  console.log('Seeding 20 users...')
  for (let i = 0; i < 20; i++) {
    const id = uuidv7()
    const email = faker.internet.email()
    const name = faker.person.fullName()
    const lastLogin = faker.date.recent({ days: 30 })

    await client.query(
      `INSERT INTO users (id, email, name, last_login, created_at, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      [id, email, name, lastLogin, new Date(), new Date()],
    )
    console.log(`Created user: ${name} (${email})`)
  }

  console.log('Seed complete!')
  await client.end()
}

seed().catch(console.error)
