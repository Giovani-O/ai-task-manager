import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { formatDateTime } from '@/lib/format-date'
import { type User, UsersPage } from '../users'

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

function mockFetchResponse(users: User[], page = 1, pageSize = 20) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ users, page, pageSize }),
    }),
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

function renderUsersPage(queryClient = makeQueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <UsersPage />
    </QueryClientProvider>,
  )
}

function makeUser(overrides: Partial<User> & { id: string }): User {
  return {
    name: `User ${overrides.id}`,
    email: `user${overrides.id}@example.com`,
    lastLogin: null,
    ...overrides,
  }
}

/** 3 users — fewer than pageSize=20, so no next page */
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

/** 20 users — exactly pageSize, so hasNextPage=true */
const fullPageUsers: User[] = Array.from({ length: 20 }, (_, i) =>
  makeUser({ id: String(i + 1) }),
)

/** Second page with 3 users — last page */
const secondPageUsers: User[] = Array.from({ length: 3 }, (_, i) =>
  makeUser({ id: String(21 + i) }),
)

// ---------------------------------------------------------------------------
// Table rendering
// ---------------------------------------------------------------------------

describe('UsersPage — table', () => {
  it('renders column headers', async () => {
    mockFetchResponse(fewUsers)
    renderUsersPage()
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

  it('displays user name and email after loading', async () => {
    mockFetchResponse(fewUsers)
    renderUsersPage()
    await waitFor(() =>
      expect(screen.getByText('John Doe')).toBeInTheDocument(),
    )
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('renders empty state when API returns no users', async () => {
    mockFetchResponse([])
    renderUsersPage()
    await waitFor(() =>
      expect(screen.getByText('No users found.')).toBeInTheDocument(),
    )
  })

  it('shows a loading indicator while fetching', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise(() => {})), // never resolves
    )
    renderUsersPage()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('formats lastLogin using the real formatDateTime utility', async () => {
    mockFetchResponse(fewUsers)
    renderUsersPage()
    const expected = formatDateTime(new Date('2026-04-01T10:30:00Z'))
    await waitFor(() => expect(screen.getByText(expected)).toBeInTheDocument())
  })

  it('renders em-dash for null lastLogin', async () => {
    mockFetchResponse(fewUsers)
    renderUsersPage()
    await waitFor(() => screen.getByText('John Doe'))
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('renders all users returned by the API (no client-side slicing)', async () => {
    mockFetchResponse(fullPageUsers)
    renderUsersPage()
    await waitFor(() => screen.getByText('User 1'))
    for (let i = 1; i <= 20; i++) {
      expect(screen.getByText(`User ${i}`)).toBeInTheDocument()
    }
  })
})

// ---------------------------------------------------------------------------
// Pagination — visibility
// ---------------------------------------------------------------------------

describe('UsersPage — pagination visibility', () => {
  it('does not render pagination on page 1 with fewer users than pageSize', async () => {
    mockFetchResponse(fewUsers)
    renderUsersPage()
    await waitFor(() => screen.getByText('John Doe'))
    expect(
      screen.queryByRole('navigation', { name: /pagination/i }),
    ).not.toBeInTheDocument()
  })

  it('renders pagination on page 1 when there is a next page', async () => {
    mockFetchResponse(fullPageUsers)
    renderUsersPage()
    await waitFor(() =>
      expect(
        screen.getByRole('navigation', { name: /pagination/i }),
      ).toBeInTheDocument(),
    )
  })
})

// ---------------------------------------------------------------------------
// Pagination — navigation
// ---------------------------------------------------------------------------

describe('UsersPage — pagination navigation', () => {
  it('clicking Next fetches the next page', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ users: fullPageUsers, page: 1, pageSize: 20 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ users: secondPageUsers, page: 2, pageSize: 20 }),
      })
    vi.stubGlobal('fetch', fetchMock)

    renderUsersPage()
    await waitFor(() => screen.getByText('User 1'))

    await user.click(screen.getByLabelText(/go to next page/i))

    await waitFor(() => screen.getByText('User 21'))
    expect(screen.queryByText('User 1')).not.toBeInTheDocument()
  })

  it('clicking Previous fetches the previous page', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ users: fullPageUsers, page: 1, pageSize: 20 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ users: secondPageUsers, page: 2, pageSize: 20 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ users: fullPageUsers, page: 1, pageSize: 20 }),
      })
    vi.stubGlobal('fetch', fetchMock)

    renderUsersPage()
    await waitFor(() => screen.getByText('User 1'))

    await user.click(screen.getByLabelText(/go to next page/i))
    await waitFor(() => screen.getByText('User 21'))

    await user.click(screen.getByLabelText(/go to previous page/i))
    await waitFor(() => screen.getByText('User 1'))
    expect(screen.queryByText('User 21')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Pagination — disabled states
// ---------------------------------------------------------------------------

describe('UsersPage — pagination disabled states', () => {
  it('Previous link has aria-disabled="true" on the first page', async () => {
    mockFetchResponse(fullPageUsers)
    renderUsersPage()
    await waitFor(() => screen.getByRole('navigation', { name: /pagination/i }))
    const prevLink = screen.getByLabelText(/go to previous page/i)
    expect(prevLink).toHaveAttribute('aria-disabled', 'true')
  })

  it('Next link does not have aria-disabled when there is a next page', async () => {
    mockFetchResponse(fullPageUsers)
    renderUsersPage()
    await waitFor(() => screen.getByRole('navigation', { name: /pagination/i }))
    const nextLink = screen.getByLabelText(/go to next page/i)
    expect(nextLink).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('Next link has aria-disabled="true" on the last page', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ users: fullPageUsers, page: 1, pageSize: 20 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ users: secondPageUsers, page: 2, pageSize: 20 }),
      })
    vi.stubGlobal('fetch', fetchMock)

    renderUsersPage()
    await waitFor(() => screen.getByText('User 1'))
    await user.click(screen.getByLabelText(/go to next page/i))
    await waitFor(() => screen.getByText('User 21'))

    const nextLink = screen.getByLabelText(/go to next page/i)
    expect(nextLink).toHaveAttribute('aria-disabled', 'true')
  })

  it('Previous link does not have aria-disabled on pages after the first', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ users: fullPageUsers, page: 1, pageSize: 20 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ users: secondPageUsers, page: 2, pageSize: 20 }),
      })
    vi.stubGlobal('fetch', fetchMock)

    renderUsersPage()
    await waitFor(() => screen.getByText('User 1'))
    await user.click(screen.getByLabelText(/go to next page/i))
    await waitFor(() => screen.getByText('User 21'))

    const prevLink = screen.getByLabelText(/go to previous page/i)
    expect(prevLink).not.toHaveAttribute('aria-disabled', 'true')
  })
})
