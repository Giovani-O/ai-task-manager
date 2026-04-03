import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { formatDateTime } from '@/lib/format-date'
import { TasksPage } from '../tasks'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderTasksPage() {
  return render(<TasksPage />)
}

// ---------------------------------------------------------------------------
// Table rendering
// ---------------------------------------------------------------------------

describe('TasksPage — table', () => {
  it('renders column headers', () => {
    renderTasksPage()
    expect(
      screen.getByRole('columnheader', { name: /title/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /estimated time/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /creation date/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /user/i }),
    ).toBeInTheDocument()
  })

  it('displays task titles', () => {
    renderTasksPage()
    expect(
      screen.getByText('Implement user authentication'),
    ).toBeInTheDocument()
    expect(screen.getByText('Design database schema')).toBeInTheDocument()
  })

  it('renders estimated time for each task', () => {
    renderTasksPage()
    const times = screen.getAllByText('4h')
    expect(times.length).toBeGreaterThan(0)
  })

  it('formats creation date using formatDateTime', () => {
    renderTasksPage()
    const expectedDate = formatDateTime(new Date('2025-01-15T10:00:00'))
    expect(screen.getByText(expectedDate)).toBeInTheDocument()
  })

  it('renders user names', () => {
    renderTasksPage()
    const aliceNames = screen.getAllByText('Alice Johnson')
    expect(aliceNames.length).toBeGreaterThan(0)
    const bobNames = screen.getAllByText('Bob Smith')
    expect(bobNames.length).toBeGreaterThan(0)
  })

  it('renders 20 tasks on page 1', () => {
    renderTasksPage()
    expect(
      screen.getByText('Implement user authentication'),
    ).toBeInTheDocument()
    expect(screen.getByText('Optimize bundle size')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Pagination — visibility
// ---------------------------------------------------------------------------

describe('TasksPage — pagination visibility', () => {
  it('renders pagination when there are more than 20 tasks', () => {
    renderTasksPage()
    expect(
      screen.getByRole('navigation', { name: /pagination/i }),
    ).toBeInTheDocument()
  })

  it('shows first 20 tasks on page 1 (sorted by date desc)', () => {
    renderTasksPage()
    expect(
      screen.getByText('Implement user authentication'),
    ).toBeInTheDocument()
    expect(screen.getByText('Optimize bundle size')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Pagination — navigation
// ---------------------------------------------------------------------------

describe('TasksPage — pagination navigation', () => {
  it('clicking Next shows page 2 tasks', async () => {
    const user = userEvent.setup()
    renderTasksPage()

    expect(
      screen.getByText('Implement user authentication'),
    ).toBeInTheDocument()

    await user.click(screen.getByLabelText(/go to next page/i))

    await waitFor(() => {
      expect(
        screen.getByText('Add two-factor authentication'),
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByText('Implement user authentication'),
    ).not.toBeInTheDocument()
  })

  it('clicking Previous returns to page 1', async () => {
    const user = userEvent.setup()
    renderTasksPage()

    await user.click(screen.getByLabelText(/go to next page/i))
    await waitFor(() =>
      expect(
        screen.getByText('Add two-factor authentication'),
      ).toBeInTheDocument(),
    )

    await user.click(screen.getByLabelText(/go to previous page/i))

    await waitFor(() => {
      expect(
        screen.getByText('Implement user authentication'),
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByText('Add two-factor authentication'),
    ).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

describe('TasksPage — sorting', () => {
  it('renders sort indicators on all column headers', () => {
    renderTasksPage()
    const headers = screen.getAllByRole('columnheader')
    headers.forEach((header) => {
      expect(header).toHaveTextContent(/⇅|↑|↓/)
    })
  })

  it('clicking Title header sorts by title ascending', async () => {
    const user = userEvent.setup()
    renderTasksPage()

    const titleHeader = screen.getByRole('columnheader', { name: /title/i })
    await user.click(titleHeader)

    await waitFor(() => {
      expect(titleHeader).toHaveTextContent(/↑/)
    })
  })

  it('clicking Title header twice sorts by title descending', async () => {
    const user = userEvent.setup()
    renderTasksPage()

    const titleHeader = screen.getByRole('columnheader', { name: /title/i })
    await user.click(titleHeader)
    await user.click(titleHeader)

    await waitFor(() => {
      expect(titleHeader).toHaveTextContent(/↓/)
    })
  })

  it('clicking Estimated time header sorts by estimated time', async () => {
    const user = userEvent.setup()
    renderTasksPage()

    const timeHeader = screen.getByRole('columnheader', {
      name: /estimated time/i,
    })
    await user.click(timeHeader)

    await waitFor(() => {
      expect(timeHeader).toHaveTextContent(/↑/)
    })
  })

  it('clicking Creation date header sorts by date', async () => {
    const user = userEvent.setup()
    renderTasksPage()

    const dateHeader = screen.getByRole('columnheader', {
      name: /creation date/i,
    })
    await user.click(dateHeader)

    await waitFor(() => {
      expect(dateHeader).toHaveTextContent(/↑/)
    })
  })

  it('clicking User header sorts by user name', async () => {
    const user = userEvent.setup()
    renderTasksPage()

    const userHeader = screen.getByRole('columnheader', { name: /user/i })
    await user.click(userHeader)

    await waitFor(() => {
      expect(userHeader).toHaveTextContent(/↑/)
    })
  })

  it('defaults to sorting by creation date descending', () => {
    renderTasksPage()
    const dateHeader = screen.getByRole('columnheader', {
      name: /creation date/i,
    })
    expect(dateHeader).toHaveTextContent(/↓/)
  })
})
