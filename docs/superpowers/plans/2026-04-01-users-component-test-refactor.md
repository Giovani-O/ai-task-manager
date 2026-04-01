# Users Component Test Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline test-only `UsersTable` re-implementation with tests that
import and exercise the real `UsersPage` component from `users.tsx`.

**Architecture:** Extract `RouteComponent` as a named export `UsersPage` accepting
`users: User[]` props. Keep `RouteComponent` as a private thin adapter that reads from
`Route.useLoaderData()` and delegates to `UsersPage`. Rewrite the test file to import
`UsersPage` directly and render it against real fixture data.

**Tech Stack:** React 19, TanStack Router v1, Vitest 4, @testing-library/react 16,
@testing-library/user-event 14, jsdom, shadcn/ui Pagination + Table

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `client/src/routes/_layout/users.tsx` | Modify | Export `User` type + `UsersPage` component; wire `RouteComponent` as thin adapter |
| `client/src/routes/_layout/__tests__/users.test.tsx` | Rewrite | Test `UsersPage` directly using real component and real `formatDateTime` |

---

## Task 1: Refactor `users.tsx` — export `User` type and `UsersPage` component

**Files:**
- Modify: `client/src/routes/_layout/users.tsx`

- [ ] **Step 1: Open the file and understand the current shape**

  Read `client/src/routes/_layout/users.tsx`. The file currently has:
  - A private `type User` (not exported)
  - `export const Route` with `component: RouteComponent` and a `loader`
  - A private `function RouteComponent()` that calls `Route.useLoaderData()` and
    renders the full table + pagination

- [ ] **Step 2: Apply the refactor**

  Replace the entire file with the following. The rendering logic inside
  `RouteComponent` is moved verbatim into `UsersPage` — nothing is changed except the
  function name, its export status, its props signature, and the new thin
  `RouteComponent`:

  ```tsx
  import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
  import { HugeiconsIcon } from '@hugeicons/react'
  import { createFileRoute } from '@tanstack/react-router'
  import { useState } from 'react'
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

  export type User = {
    id: string
    name: string
    email: string
    lastLogin: string | null
  }

  export const Route = createFileRoute('/_layout/users')({
    component: function RouteComponent() {
      const { users } = Route.useLoaderData()
      return <UsersPage users={users} />
    },
    loader: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json() as Promise<{
        users: User[]
        page: number
        pageSize: number
      }>
    },
  })

  export function UsersPage({ users }: { users: User[] }) {
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10
    const totalPages = Math.ceil(users.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const paginatedUsers = users.slice(startIndex, startIndex + pageSize)

    const handlePageChange = (page: number) => {
      setCurrentPage(page)
    }

    const getVisiblePages = (): (
      | number
      | 'left-ellipsis'
      | 'right-ellipsis'
    )[] => {
      const pages: (number | 'left-ellipsis' | 'right-ellipsis')[] = []
      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        if (currentPage > 3) {
          pages.push('left-ellipsis')
        }
        const start = Math.max(2, currentPage - 1)
        const end = Math.min(totalPages - 1, currentPage + 1)
        for (let i = start; i <= end; i++) {
          pages.push(i)
        }
        if (currentPage < totalPages - 2) {
          pages.push('right-ellipsis')
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
                      {formatDateTime(
                        user.lastLogin ? new Date(user.lastLogin) : null,
                      )}
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
                  className={
                    currentPage === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                </PaginationPrevious>
              </PaginationItem>
              {getVisiblePages().map((page) =>
                page === 'left-ellipsis' || page === 'right-ellipsis' ? (
                  <PaginationItem key={page}>
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
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  aria-disabled={currentPage === totalPages}
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
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

- [ ] **Step 3: Verify TypeScript compiles**

  Run from the repo root:
  ```bash
  pnpm --filter client build
  ```
  Expected: exits 0. No type errors. The `routeTree.gen.ts` may be regenerated — that
  is fine and expected.

- [ ] **Step 4: Commit**

  ```bash
  git add client/src/routes/_layout/users.tsx
  git commit -m "refactor(users): export UsersPage component and User type for testability"
  ```

---

## Task 2: Rewrite the test file

**Files:**
- Rewrite: `client/src/routes/_layout/__tests__/users.test.tsx`

### Background on the real components

Before writing tests, understand the real elements you are asserting against:

- **`PaginationPrevious`** renders as `<a aria-label="Go to previous page" ...>`
  → query: `screen.getByRole('link', { name: /go to previous page/i })`
- **`PaginationNext`** renders as `<a aria-label="Go to next page" ...>`
  → query: `screen.getByRole('link', { name: /go to next page/i })`
- **Page number links** render as `<a>2</a>`
  → query: `screen.getByRole('link', { name: '2' })`
- **`PaginationEllipsis`** has `aria-hidden` on its outer `<span>`, so accessible
  queries won't find it. Assert via:
  `document.querySelector('[data-slot="pagination-ellipsis"]')`
- **`aria-disabled`** on `PaginationPrevious`/`PaginationNext` is forwarded to the
  `<a>` element as a string. Assert with:
  `expect(link).toHaveAttribute('aria-disabled', 'true')`
  NOT `toBeDisabled()` (that checks the HTML `disabled` attribute, which `<a>` doesn't
  support).
- **`Pagination`** renders as `<nav role="navigation" aria-label="pagination">`
  → query: `screen.getByRole('navigation', { name: /pagination/i })`
- **`formatDateTime`** from `@/lib/format-date` formats as `dd/MM/yyyy HH:mm` using
  `date-fns`. Example: `'2026-04-01T10:30:00Z'` → `'01/04/2026 10:30'` (in UTC).
  Note: `date-fns` `format()` uses the local timezone of the test runner. Tests that
  assert exact formatted strings must use UTC-safe fixture dates or match the local
  timezone. The safest approach is to call `formatDateTime` in the test itself to derive
  the expected string rather than hardcoding it.

- [ ] **Step 1: Write the fixture data**

  Replace the entire contents of
  `client/src/routes/_layout/__tests__/users.test.tsx` with the following. Write the
  file in full — do not patch the existing one:

  ```tsx
  import { render, screen } from '@testing-library/react'
  import userEvent from '@testing-library/user-event'
  import { describe, expect, it } from 'vitest'
  import { formatDateTime } from '@/lib/format-date'
  import { UsersPage, type User } from '../users'

  // ---------------------------------------------------------------------------
  // Fixtures
  // ---------------------------------------------------------------------------

  function makeUser(overrides: Partial<User> & { id: string }): User {
    return {
      name: `User ${overrides.id}`,
      email: `user${overrides.id}@example.com`,
      lastLogin: null,
      ...overrides,
    }
  }

  /** 3 users — fits on one page, no pagination */
  const fewUsers: User[] = [
    makeUser({ id: '1', name: 'John Doe', email: 'john@example.com', lastLogin: '2026-04-01T10:30:00Z' }),
    makeUser({ id: '2', name: 'Jane Smith', email: 'jane@example.com', lastLogin: null }),
    makeUser({ id: '3', name: 'Bob Wilson', email: 'bob@example.com', lastLogin: '2026-03-15T08:00:00Z' }),
  ]

  /** 11 users — spills onto page 2, pagination appears */
  const manyUsers: User[] = Array.from({ length: 11 }, (_, i) =>
    makeUser({ id: String(i + 1) }),
  )

  /** 60 users — 6 pages, enough to trigger ellipsis in getVisiblePages on page 1 */
  const lotsOfUsers: User[] = Array.from({ length: 60 }, (_, i) =>
    makeUser({ id: String(i + 1) }),
  )

  // ---------------------------------------------------------------------------
  // Table rendering
  // ---------------------------------------------------------------------------

  describe('UsersPage — table', () => {
    it('renders column headers', () => {
      render(<UsersPage users={fewUsers} />)
      expect(screen.getByRole('columnheader', { name: /^name$/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /^email$/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /^last login$/i })).toBeInTheDocument()
    })

    it('displays user name and email', () => {
      render(<UsersPage users={fewUsers} />)
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('renders empty state when no users are provided', () => {
      render(<UsersPage users={[]} />)
      expect(screen.getByText('No users found.')).toBeInTheDocument()
    })

    it('formats lastLogin using the real formatDateTime utility', () => {
      render(<UsersPage users={fewUsers} />)
      // Derive expected string via the same utility the component uses —
      // avoids timezone-sensitive hardcoding
      const expected = formatDateTime(new Date('2026-04-01T10:30:00Z'))
      expect(screen.getByText(expected)).toBeInTheDocument()
    })

    it('renders em-dash for null lastLogin', () => {
      render(<UsersPage users={fewUsers} />)
      // Jane Smith has null lastLogin → should render '—'
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThan(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Pagination — visibility
  // ---------------------------------------------------------------------------

  describe('UsersPage — pagination visibility', () => {
    it('does not render pagination when users fit on one page', () => {
      render(<UsersPage users={fewUsers} />)
      expect(screen.queryByRole('navigation', { name: /pagination/i })).not.toBeInTheDocument()
    })

    it('renders pagination when users exceed one page', () => {
      render(<UsersPage users={manyUsers} />)
      expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // Pagination — navigation
  // ---------------------------------------------------------------------------

  describe('UsersPage — pagination navigation', () => {
    it('shows first page users on initial render', () => {
      render(<UsersPage users={manyUsers} />)
      // User 1 is on page 1 (index 0)
      expect(screen.getByText('User 1')).toBeInTheDocument()
      // User 11 is on page 2 (index 10) — should NOT be visible
      expect(screen.queryByText('User 11')).not.toBeInTheDocument()
    })

    it('clicking Next shows the next page', async () => {
      const user = userEvent.setup()
      render(<UsersPage users={manyUsers} />)
      await user.click(screen.getByRole('link', { name: /go to next page/i }))
      expect(screen.getByText('User 11')).toBeInTheDocument()
      expect(screen.queryByText('User 1')).not.toBeInTheDocument()
    })

    it('clicking Previous returns to the previous page', async () => {
      const user = userEvent.setup()
      render(<UsersPage users={manyUsers} />)
      await user.click(screen.getByRole('link', { name: /go to next page/i }))
      await user.click(screen.getByRole('link', { name: /go to previous page/i }))
      expect(screen.getByText('User 1')).toBeInTheDocument()
      expect(screen.queryByText('User 11')).not.toBeInTheDocument()
    })

    it('clicking a page number link navigates to that page', async () => {
      const user = userEvent.setup()
      render(<UsersPage users={manyUsers} />)
      await user.click(screen.getByRole('link', { name: '2' }))
      expect(screen.getByText('User 11')).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // Pagination — disabled states
  // ---------------------------------------------------------------------------

  describe('UsersPage — pagination disabled states', () => {
    it('Previous link has aria-disabled="true" on the first page', () => {
      render(<UsersPage users={manyUsers} />)
      const prevLink = screen.getByRole('link', { name: /go to previous page/i })
      expect(prevLink).toHaveAttribute('aria-disabled', 'true')
    })

    it('Next link does not have aria-disabled on the first page', () => {
      render(<UsersPage users={manyUsers} />)
      const nextLink = screen.getByRole('link', { name: /go to next page/i })
      expect(nextLink).not.toHaveAttribute('aria-disabled', 'true')
    })

    it('Next link has aria-disabled="true" on the last page', async () => {
      const user = userEvent.setup()
      render(<UsersPage users={manyUsers} />)
      await user.click(screen.getByRole('link', { name: /go to next page/i }))
      const nextLink = screen.getByRole('link', { name: /go to next page/i })
      expect(nextLink).toHaveAttribute('aria-disabled', 'true')
    })

    it('Previous link does not have aria-disabled on the last page', async () => {
      const user = userEvent.setup()
      render(<UsersPage users={manyUsers} />)
      await user.click(screen.getByRole('link', { name: /go to next page/i }))
      const prevLink = screen.getByRole('link', { name: /go to previous page/i })
      expect(prevLink).not.toHaveAttribute('aria-disabled', 'true')
    })
  })

  // ---------------------------------------------------------------------------
  // Pagination — ellipsis
  // ---------------------------------------------------------------------------

  describe('UsersPage — pagination ellipsis', () => {
    it('renders ellipsis when there are enough pages', () => {
      render(<UsersPage users={lotsOfUsers} />)
      // PaginationEllipsis has aria-hidden so accessible queries skip it.
      // Query via data-slot attribute instead.
      const ellipsis = document.querySelector('[data-slot="pagination-ellipsis"]')
      expect(ellipsis).toBeInTheDocument()
    })

    it('does not render ellipsis when pages are few', () => {
      render(<UsersPage users={manyUsers} />)
      const ellipsis = document.querySelector('[data-slot="pagination-ellipsis"]')
      expect(ellipsis).not.toBeInTheDocument()
    })
  })
  ```

- [ ] **Step 2: Run the tests — expect them to fail (TDD red phase)**

  Run from the repo root:
  ```bash
  pnpm --filter client exec vitest run src/routes/_layout/__tests__/users.test.tsx
  ```
  Expected: tests fail because `UsersPage` is not yet exported from `users.tsx`.
  If Task 1 was completed first, they may already pass — proceed to Step 3.

- [ ] **Step 3: Run the tests again after Task 1 is complete**

  Run:
  ```bash
  pnpm --filter client exec vitest run src/routes/_layout/__tests__/users.test.tsx
  ```
  Expected output (all 16 tests pass):
  ```
  ✓ UsersPage — table > renders column headers
  ✓ UsersPage — table > displays user name and email
  ✓ UsersPage — table > renders empty state when no users are provided
  ✓ UsersPage — table > formats lastLogin using the real formatDateTime utility
  ✓ UsersPage — table > renders em-dash for null lastLogin
  ✓ UsersPage — pagination visibility > does not render pagination when users fit on one page
  ✓ UsersPage — pagination visibility > renders pagination when users exceed one page
  ✓ UsersPage — pagination navigation > shows first page users on initial render
  ✓ UsersPage — pagination navigation > clicking Next shows the next page
  ✓ UsersPage — pagination navigation > clicking Previous returns to the previous page
  ✓ UsersPage — pagination navigation > clicking a page number link navigates to that page
  ✓ UsersPage — pagination disabled states > Previous link has aria-disabled="true" on the first page
  ✓ UsersPage — pagination disabled states > Next link does not have aria-disabled on the first page
  ✓ UsersPage — pagination disabled states > Next link has aria-disabled="true" on the last page
  ✓ UsersPage — pagination disabled states > Previous link does not have aria-disabled on the last page
  ✓ UsersPage — pagination ellipsis > renders ellipsis when there are enough pages
  ✓ UsersPage — pagination ellipsis > does not render ellipsis when pages are few
  ```
  If any test fails, see the Troubleshooting section at the bottom of this plan.

- [ ] **Step 4: Run the full client test suite to check for regressions**

  ```bash
  pnpm --filter client test
  ```
  Expected: all tests pass, exit 0.

- [ ] **Step 5: Run the Biome check**

  ```bash
  pnpm check
  ```
  Expected: exit 0. If formatting issues appear, run `pnpm format` and re-check.

- [ ] **Step 6: Commit**

  ```bash
  git add client/src/routes/_layout/__tests__/users.test.tsx
  git commit -m "test(users): rewrite tests to exercise real UsersPage component"
  ```

---

## Troubleshooting

**`aria-disabled` assertion fails:** The `PaginationPrevious`/`PaginationNext` in
`users.tsx` passes `aria-disabled={currentPage === 1}` as a boolean prop. React renders
boolean `true` as the string `"true"` on the DOM element, which is what
`toHaveAttribute('aria-disabled', 'true')` checks. If the prop is `false`, the
attribute is omitted (React doesn't render `aria-disabled="false"`). Confirm the
condition in `users.tsx` is `aria-disabled={currentPage === 1}` (boolean), not
`aria-disabled="true"` (hardcoded string).

**`formatDateTime` produces unexpected output:** `date-fns` `format()` converts to
local time. If the test runner's timezone differs from UTC, `'2026-04-01T10:30:00Z'`
may render as a different hour. The test derives the expected string via
`formatDateTime(new Date('2026-04-01T10:30:00Z'))` — the same call the component makes
— so the assertion is always consistent regardless of timezone.

**`getByRole('columnheader', { name: /^name$/i })` not found:** The shadcn `TableHead`
renders a `<th>` element. If the query fails, check that `scope="col"` is present (it
is in the shadcn default). If it still fails, fall back to `getByText('Name')` with a
`within(screen.getByRole('table'))` scope.

**`getByRole('link', { name: /go to next page/i })` returns multiple elements:**
Should not happen with a single `UsersPage` render, but if it does, use `getAllByRole`
and assert `[0]`.

**Ellipsis not appearing:** The `getVisiblePages` function shows a right ellipsis when
`currentPage < totalPages - 2`. With 60 users and pageSize 10, there are 6 pages. On
page 1: `1 < 4` is true — ellipsis renders. If you change the fixture size, ensure
`totalPages >= 6` (i.e., at least 51 users) for the ellipsis to appear on page 1.
