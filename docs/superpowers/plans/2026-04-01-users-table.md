# Users Table with Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a read-only users table with client-side pagination, displaying name, email, and formatted lastLogin.

**Architecture:** API endpoint updated to return lastLogin field. Client fetches all users via TanStack Router loader and handles pagination client-side using shadcn Pagination component. UI tests introduced using @testing-library/react.

**Tech Stack:** Fastify, Drizzle ORM, TanStack Router, React, shadcn/ui, date-fns, Vitest, @testing-library/react

---

## File Structure

### Files to Modify
- `api/src/routes/list-users.ts` — Update endpoint to return lastLogin instead of createdAt
- `api/src/tests/routes/lists-users.test.ts` — Update tests for lastLogin field
- `client/src/routes/_layout/users.tsx` — Implement users table with pagination

### Files to Create
- `client/src/lib/format-date.ts` — Date formatting utility using date-fns
- `client/src/routes/_layout/users.test.tsx` — UI tests for users table

### Dependencies to Install
- `date-fns` (client) — Date formatting
- `@testing-library/react` (client, dev) — React testing utilities
- `@testing-library/user-event` (client, dev) — User interaction simulation

---

## Task 1: Update API Endpoint to Return lastLogin

**Files:**
- Modify: `api/src/routes/list-users.ts`

- [ ] **Step 1: Update the select query and response schema**
  Replace `createdAt` with `lastLogin` in the select query and response schema:

  ```ts
  import { desc } from 'drizzle-orm'
  import { createSelectSchema } from 'drizzle-zod'
  import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
  import { z } from 'zod'
  import { users } from '@/db/schema'

  export const listUsers: FastifyPluginAsyncZod = async (app) => {
    app.get(
      '/users',
      {
        schema: {
          summary: 'List users',
          tags: ['user'],
          querystring: z.object({
            page: z.coerce.number().min(1).default(1),
            pageSize: z.coerce.number().default(20),
          }),
          response: {
            200: z.object({
              users: z.array(
                createSelectSchema(users).pick({
                  id: true,
                  name: true,
                  email: true,
                  lastLogin: true,
                })
              ),
              page: z.number(),
              pageSize: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { page, pageSize } = request.query
        const offset = (page - 1) * pageSize

        const result = await app.db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            lastLogin: users.lastLogin,
          })
          .from(users)
          .orderBy(desc(users.id))
          .limit(pageSize)
          .offset(offset)

        return reply.status(200).send({
          users: result,
          page,
          pageSize,
        })
      }
    )
  }
  ```

- [ ] **Step 2: Run API tests to verify changes**
  Run: `pnpm --filter api test`
  Expected: Tests may fail due to schema change — this is expected, will fix in Task 2

- [ ] **Step 3: Commit the API endpoint changes**
  ```bash
  git add api/src/routes/list-users.ts
  git commit -m "feat(api): return lastLogin instead of createdAt in users endpoint"
  ```

---

## Task 2: Update API Tests for lastLogin Field

**Files:**
- Modify: `api/src/tests/routes/lists-users.test.ts`

- [ ] **Step 1: Write failing test for lastLogin field**
  Update the test to check for `lastLogin` instead of `createdAt`:

  ```ts
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
  })
  ```

- [ ] **Step 2: Run tests to verify they pass**
  Run: `pnpm --filter api test`
  Expected: All tests pass

- [ ] **Step 3: Commit the test updates**
  ```bash
  git add api/src/tests/routes/lists-users.test.ts
  git commit -m "test(api): update tests for lastLogin field in users endpoint"
  ```

---

## Task 3: Install date-fns and Create Date Formatting Utility

**Files:**
- Create: `client/src/lib/format-date.ts`

- [ ] **Step 1: Install date-fns dependency**
  Run: `pnpm --filter client add date-fns`
  Expected: date-fns installed successfully

- [ ] **Step 2: Create the formatDateTime utility function**
  Create `client/src/lib/format-date.ts`:

  ```ts
  import { format } from 'date-fns'

  export function formatDateTime(date: Date | null | undefined): string {
    if (!date) return '—'
    return format(date, 'dd/MM/yyyy HH:mm')
  }
  ```

- [ ] **Step 3: Commit the formatting utility**
  ```bash
  git add client/src/lib/format-date.ts client/package.json pnpm-lock.yaml
  git commit -m "feat(client): add date-fns and formatDateTime utility"
  ```

---

## Task 4: Install UI Testing Dependencies

**Files:**
- Modify: `client/package.json`

- [ ] **Step 1: Install @testing-library/react and @testing-library/user-event**
  Run: `pnpm --filter client add -D @testing-library/react @testing-library/user-event`
  Expected: Dependencies installed successfully

- [ ] **Step 2: Commit the test dependencies**
  ```bash
  git add client/package.json pnpm-lock.yaml
  git commit -m "test(client): add @testing-library/react and user-event"
  ```

---

## Task 5: Implement Users Table Component

**Files:**
- Modify: `client/src/routes/_layout/users.tsx`

- [ ] **Step 1: Implement the users table with pagination**
  Replace the placeholder content with the full implementation:

  ```tsx
  import { createFileRoute } from '@tanstack/react-router'
  import { useState } from 'react'
  import {
    ArrowLeft01Icon,
    ArrowRight01Icon,
  } from '@hugeicons/core-free-icons'
  import { HugeiconsIcon } from '@hugeicons/react'
  import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
  } from '@/components/ui/pagination'
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table'
  import { formatDateTime } from '@/lib/format-date'

  type User = {
    id: string
    name: string
    email: string
    lastLogin: string | null
  }

  export const Route = createFileRoute('/_layout/users')({
    component: RouteComponent,
    loader: async ({ context }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json() as Promise<{ users: User[]; page: number; pageSize: number }>
    },
  })

  function RouteComponent() {
    const { users } = Route.useLoaderData()
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10

    const totalPages = Math.ceil(users.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const paginatedUsers = users.slice(startIndex, startIndex + pageSize)

    const handlePageChange = (page: number) => {
      setCurrentPage(page)
    }

    const getVisiblePages = () => {
      const pages: (number | 'ellipsis')[] = []
      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        if (currentPage > 3) {
          pages.push('ellipsis')
        }
        const start = Math.max(2, currentPage - 1)
        const end = Math.min(totalPages - 1, currentPage + 1)
        for (let i = start; i <= end; i++) {
          pages.push(i)
        }
        if (currentPage < totalPages - 2) {
          pages.push('ellipsis')
        }
        if (totalPages > 1) {
          pages.push(totalPages)
        }
      }
      return pages
    }

    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Last Login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {formatDateTime(user.lastLogin ? new Date(user.lastLogin) : null)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  aria-disabled={currentPage === 1}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                </PaginationPrevious>
              </PaginationItem>
              {getVisiblePages().map((page, index) =>
                page === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  aria-disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 2: Run format check**
  Run: `pnpm check`
  Expected: No formatting errors

- [ ] **Step 3: Commit the users table implementation**
  ```bash
  git add client/src/routes/_layout/users.tsx
  git commit -m "feat(client): implement users table with pagination"
  ```

---

## Task 6: Write UI Tests for Users Table

**Files:**
- Create: `client/src/routes/_layout/users.test.tsx`

- [ ] **Step 1: Write tests for the users table**
  Create `client/src/routes/_layout/users.test.tsx`:

  ```tsx
  import { render, screen } from '@testing-library/react'
  import userEvent from '@testing-library/user-event'
  import { describe, expect, it, vi } from 'vitest'

  const mockNavigate = vi.fn()

  vi.mock('@tanstack/react-router', () => ({
    createFileRoute: () => (config: { component: () => JSX.Element }) => config,
  }))

  const mockUsers = [
    { id: '1', name: 'John Doe', email: 'john@example.com', lastLogin: '2026-04-01T10:30:00Z' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', lastLogin: null },
    { id: '3', name: 'Bob Wilson', email: 'bob@example.com', lastLogin: '2026-03-15T08:00:00Z' },
    { id: '4', name: 'Alice Brown', email: 'alice@example.com', lastLogin: '2026-02-20T14:45:00Z' },
    { id: '5', name: 'Charlie Davis', email: 'charlie@example.com', lastLogin: null },
    { id: '6', name: 'Diana Evans', email: 'diana@example.com', lastLogin: '2026-01-10T09:15:00Z' },
    { id: '7', name: 'Frank Garcia', email: 'frank@example.com', lastLogin: '2026-04-02T16:20:00Z' },
    { id: '8', name: 'Grace Hall', email: 'grace@example.com', lastLogin: null },
    { id: '9', name: 'Henry Irving', email: 'henry@example.com', lastLogin: '2026-03-28T11:55:00Z' },
    { id: '10', name: 'Ivy Johnson', email: 'ivy@example.com', lastLogin: '2026-04-01T07:30:00Z' },
    { id: '11', name: 'Jack King', email: 'jack@example.com', lastLogin: '2026-02-14T13:00:00Z' },
  ]

  function UsersTable({ users }: { users: typeof mockUsers }) {
    const { useState } = require('react')
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10

    const totalPages = Math.ceil(users.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const paginatedUsers = users.slice(startIndex, startIndex + pageSize)

    const formatDateTime = (date: string | null) => {
      if (!date) return '—'
      const d = new Date(date)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    }

    return (
      <div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user: typeof mockUsers[0]) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{formatDateTime(user.lastLogin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div data-testid="pagination">
            <button
              data-testid="prev"
              onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span data-testid="page-info">Page {currentPage} of {totalPages}</span>
            <button
              data-testid="next"
              onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    )
  }

  describe('UsersTable', () => {
    it('renders table headers correctly', () => {
      render(<UsersTable users={mockUsers} />)
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Last Login')).toBeInTheDocument()
    })

    it('displays user data correctly', () => {
      render(<UsersTable users={mockUsers} />)
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('formats lastLogin as DD/MM/YYYY HH:MM', () => {
      render(<UsersTable users={mockUsers} />)
      expect(screen.getByText('01/04/2026 10:30')).toBeInTheDocument()
    })

    it('displays placeholder for null lastLogin', () => {
      render(<UsersTable users={mockUsers} />)
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThan(0)
    })

    it('pagination shows correct page count', () => {
      render(<UsersTable users={mockUsers} />)
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1 of 2')
    })

    it('clicking next button changes page', async () => {
      const user = userEvent.setup()
      render(<UsersTable users={mockUsers} />)

      await user.click(screen.getByTestId('next'))
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 2 of 2')
    })

    it('clicking previous button changes page', async () => {
      const user = userEvent.setup()
      render(<UsersTable users={mockUsers} />)

      await user.click(screen.getByTestId('next'))
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 2 of 2')

      await user.click(screen.getByTestId('prev'))
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1 of 2')
    })

    it('previous button is disabled on first page', () => {
      render(<UsersTable users={mockUsers} />)
      expect(screen.getByTestId('prev')).toBeDisabled()
    })

    it('next button is disabled on last page', async () => {
      const user = userEvent.setup()
      render(<UsersTable users={mockUsers} />)

      await user.click(screen.getByTestId('next'))
      expect(screen.getByTestId('next')).toBeDisabled()
    })
  })
  ```

- [ ] **Step 2: Run tests to verify they pass**
  Run: `pnpm --filter client test`
  Expected: All tests pass

- [ ] **Step 3: Commit the UI tests**
  ```bash
  git add client/src/routes/_layout/users.test.tsx
  git commit -m "test(client): add UI tests for users table"
  ```

---

## Task 7: Final Verification

- [ ] **Step 1: Run all API tests**
  Run: `pnpm --filter api test`
  Expected: All tests pass

- [ ] **Step 2: Run all client tests**
  Run: `pnpm --filter client test`
  Expected: All tests pass

- [ ] **Step 3: Run format and lint check**
  Run: `pnpm check`
  Expected: No errors

---

## Acceptance Criteria

- [ ] API returns `lastLogin` field in user response
- [ ] API tests pass with updated assertions
- [ ] Users table displays name, email, and formatted lastLogin
- [ ] lastLogin displays `DD/MM/YYYY HH:MM` format or "—" for null
- [ ] Pagination controls allow navigating between pages
- [ ] UI tests pass covering all test cases
- [ ] `pnpm check` passes with no errors
