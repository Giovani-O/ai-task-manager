import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    lastLogin: '2026-04-01T10:30:00Z',
  },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', lastLogin: null },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    lastLogin: '2026-03-15T08:00:00Z',
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    lastLogin: '2026-02-20T14:45:00Z',
  },
  {
    id: '5',
    name: 'Charlie Davis',
    email: 'charlie@example.com',
    lastLogin: null,
  },
  {
    id: '6',
    name: 'Diana Evans',
    email: 'diana@example.com',
    lastLogin: '2026-01-10T09:15:00Z',
  },
  {
    id: '7',
    name: 'Frank Garcia',
    email: 'frank@example.com',
    lastLogin: '2026-04-02T16:20:00Z',
  },
  { id: '8', name: 'Grace Hall', email: 'grace@example.com', lastLogin: null },
  {
    id: '9',
    name: 'Henry Irving',
    email: 'henry@example.com',
    lastLogin: '2026-03-28T11:55:00Z',
  },
  {
    id: '10',
    name: 'Ivy Johnson',
    email: 'ivy@example.com',
    lastLogin: '2026-04-01T07:30:00Z',
  },
  {
    id: '11',
    name: 'Jack King',
    email: 'jack@example.com',
    lastLogin: '2026-02-14T13:00:00Z',
  },
]

function UsersTable({ users }: { users: typeof mockUsers }) {
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
          {paginatedUsers.map((user) => (
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
            type="button"
            data-testid="prev"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span data-testid="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            data-testid="next"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
    expect(screen.getByText('01/04/2026 07:30')).toBeInTheDocument()
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
