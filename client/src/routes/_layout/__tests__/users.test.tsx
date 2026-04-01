import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { formatDateTime } from '@/lib/format-date'
import { type User, UsersPage } from '../users'

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
  makeUser({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    lastLogin: '2026-04-01T10:30:00Z',
  }),
  makeUser({
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    lastLogin: null,
  }),
  makeUser({
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    lastLogin: '2026-03-15T08:00:00Z',
  }),
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
    expect(
      screen.getByRole('columnheader', { name: /^name$/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /^email$/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /^last login$/i }),
    ).toBeInTheDocument()
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
    expect(
      screen.queryByRole('navigation', { name: /pagination/i }),
    ).not.toBeInTheDocument()
  })

  it('renders pagination when users exceed one page', () => {
    render(<UsersPage users={manyUsers} />)
    expect(
      screen.getByRole('navigation', { name: /pagination/i }),
    ).toBeInTheDocument()
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
    await user.click(screen.getByLabelText(/go to next page/i))
    expect(screen.getByText('User 11')).toBeInTheDocument()
    expect(screen.queryByText('User 1')).not.toBeInTheDocument()
  })

  it('clicking Previous returns to the previous page', async () => {
    const user = userEvent.setup()
    render(<UsersPage users={manyUsers} />)
    await user.click(screen.getByLabelText(/go to next page/i))
    await user.click(screen.getByLabelText(/go to previous page/i))
    expect(screen.getByText('User 1')).toBeInTheDocument()
    expect(screen.queryByText('User 11')).not.toBeInTheDocument()
  })

  it('clicking a page number link navigates to that page', async () => {
    const user = userEvent.setup()
    render(<UsersPage users={manyUsers} />)
    // Page number links rendered as <a data-slot="pagination-link">
    const pageLinks = document.querySelectorAll('[data-slot="pagination-link"]')
    // First is prev (aria-label), last is next (aria-label), middle ones are page numbers
    // Find the one with text content "2"
    const page2Link = Array.from(pageLinks).find(
      (el) => el.textContent?.trim() === '2',
    ) as HTMLElement
    await user.click(page2Link)
    expect(screen.getByText('User 11')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Pagination — disabled states
// ---------------------------------------------------------------------------

describe('UsersPage — pagination disabled states', () => {
  it('Previous link has aria-disabled="true" on the first page', () => {
    render(<UsersPage users={manyUsers} />)
    const prevLink = screen.getByLabelText(/go to previous page/i)
    expect(prevLink).toHaveAttribute('aria-disabled', 'true')
  })

  it('Next link does not have aria-disabled on the first page', () => {
    render(<UsersPage users={manyUsers} />)
    const nextLink = screen.getByLabelText(/go to next page/i)
    expect(nextLink).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('Next link has aria-disabled="true" on the last page', async () => {
    const user = userEvent.setup()
    render(<UsersPage users={manyUsers} />)
    await user.click(screen.getByLabelText(/go to next page/i))
    const nextLink = screen.getByLabelText(/go to next page/i)
    expect(nextLink).toHaveAttribute('aria-disabled', 'true')
  })

  it('Previous link does not have aria-disabled on the last page', async () => {
    const user = userEvent.setup()
    render(<UsersPage users={manyUsers} />)
    await user.click(screen.getByLabelText(/go to next page/i))
    const prevLink = screen.getByLabelText(/go to previous page/i)
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
