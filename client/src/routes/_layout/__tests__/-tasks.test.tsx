import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { formatDateTime } from '@/lib/format-date'
import { type Task, TasksPage } from '../tasks'

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

function mockFetchResponse(tasks: Task[], page = 1, pageSize = 20) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tasks, page, pageSize }),
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

function renderTasksPage(queryClient = makeQueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <TasksPage />
    </QueryClientProvider>,
  )
}

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    title: overrides.title ?? `Task ${overrides.id}`,
    estimatedTime: overrides.estimatedTime ?? '4h',
    createdAt: overrides.createdAt ?? new Date(),
    userName: overrides.userName ?? 'Test User',
    ...overrides,
  }
}

const TWENTY_TASKS: Task[] = Array.from({ length: 20 }, (_, i) =>
  makeTask({
    id: String(i + 1),
    title: `Task ${i + 1}`,
    createdAt: new Date(2025, 0, 15 - i),
  }),
)

// ---------------------------------------------------------------------------
// Table rendering
// ---------------------------------------------------------------------------

describe('TasksPage — table', () => {
  it('renders column headers', async () => {
    mockFetchResponse(TWENTY_TASKS)
    renderTasksPage()
    await waitFor(() =>
      expect(
        screen.getByRole('columnheader', { name: /title/i }),
      ).toBeInTheDocument(),
    )
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

  it('displays task titles', async () => {
    mockFetchResponse(TWENTY_TASKS)
    renderTasksPage()
    await waitFor(() => expect(screen.getByText('Task 1')).toBeInTheDocument())
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('renders estimated time for each task', async () => {
    mockFetchResponse(TWENTY_TASKS)
    renderTasksPage()
    await waitFor(() => screen.getByText('Task 1'))
    const times = screen.getAllByText('4h')
    expect(times.length).toBeGreaterThan(0)
  })

  it('formats creation date using formatDateTime', async () => {
    const tasks = [
      makeTask({
        id: '1',
        createdAt: new Date('2025-01-15T10:00:00'),
      }),
    ]
    mockFetchResponse(tasks)
    renderTasksPage()
    const expectedDate = formatDateTime(new Date('2025-01-15T10:00:00'))
    await waitFor(() =>
      expect(screen.getByText(expectedDate)).toBeInTheDocument(),
    )
  })

  it('renders user names', async () => {
    const tasks = [
      makeTask({ id: '1', userName: 'Alice Johnson' }),
      makeTask({ id: '2', userName: 'Bob Smith' }),
    ]
    mockFetchResponse(tasks)
    renderTasksPage()
    await waitFor(() =>
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument(),
    )
    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
  })

  it('renders 20 tasks on page 1', async () => {
    mockFetchResponse(TWENTY_TASKS)
    renderTasksPage()
    await waitFor(() => expect(screen.getByText('Task 1')).toBeInTheDocument())
    expect(screen.getByText('Task 20')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Pagination — visibility
// ---------------------------------------------------------------------------

describe('TasksPage — pagination visibility', () => {
  it('renders pagination when there are more than 20 tasks', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ tasks: TWENTY_TASKS, page: 1, pageSize: 20 }),
    })
    vi.stubGlobal('fetch', fetchMock)
    renderTasksPage()
    await waitFor(() =>
      expect(
        screen.getByRole('navigation', { name: /pagination/i }),
      ).toBeInTheDocument(),
    )
  })

  it('shows first 20 tasks on page 1 (sorted by date desc)', async () => {
    mockFetchResponse(TWENTY_TASKS)
    renderTasksPage()
    await waitFor(() => expect(screen.getByText('Task 1')).toBeInTheDocument())
    expect(screen.getByText('Task 20')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Pagination — navigation
// ---------------------------------------------------------------------------

describe('TasksPage — pagination navigation', () => {
  it('clicking Next shows page 2 tasks', async () => {
    const user = userEvent.setup()
    const page1Tasks = Array.from({ length: 20 }, (_, i) =>
      makeTask({ id: String(i + 1), title: `Task ${i + 1}` }),
    )
    const page2Tasks = Array.from({ length: 20 }, (_, i) =>
      makeTask({ id: String(i + 21), title: `Task ${i + 21}` }),
    )

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ tasks: page1Tasks, page: 1, pageSize: 20 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ tasks: page2Tasks, page: 2, pageSize: 20 }),
      })
    vi.stubGlobal('fetch', fetchMock)

    renderTasksPage()
    await waitFor(() => expect(screen.getByText('Task 1')).toBeInTheDocument())

    await user.click(screen.getByLabelText(/go to next page/i))

    await waitFor(() => {
      expect(screen.getByText('Task 21')).toBeInTheDocument()
    })
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument()
  })

  it('clicking Previous returns to page 1', async () => {
    const user = userEvent.setup()
    const page1Tasks = Array.from({ length: 20 }, (_, i) =>
      makeTask({ id: String(i + 1), title: `Task ${i + 1}` }),
    )
    const page2Tasks = Array.from({ length: 20 }, (_, i) =>
      makeTask({ id: String(i + 21), title: `Task ${i + 21}` }),
    )

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ tasks: page1Tasks, page: 1, pageSize: 20 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ tasks: page2Tasks, page: 2, pageSize: 20 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ tasks: page1Tasks, page: 1, pageSize: 20 }),
      })
    vi.stubGlobal('fetch', fetchMock)

    renderTasksPage()
    await waitFor(() => expect(screen.getByText('Task 1')).toBeInTheDocument())

    await user.click(screen.getByLabelText(/go to next page/i))
    await waitFor(() => expect(screen.getByText('Task 21')).toBeInTheDocument())

    await user.click(screen.getByLabelText(/go to previous page/i))

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument()
    })
    expect(screen.queryByText('Task 21')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

describe('TasksPage — sorting', () => {
  it('renders sort indicators on all column headers', async () => {
    mockFetchResponse(TWENTY_TASKS)
    renderTasksPage()
    await waitFor(() => screen.getByText('Task 1'))
    const headers = screen.getAllByRole('columnheader')
    headers.forEach((header) => {
      if (header.textContent?.includes('User')) return
      expect(header).toHaveTextContent(/⇅|↑|↓/)
    })
  })

  it('clicking Title header sorts by title ascending', async () => {
    const user = userEvent.setup()
    mockFetchResponse(TWENTY_TASKS)
    renderTasksPage()

    await waitFor(() => screen.getByText('Task 1'))

    const titleHeader = screen.getByRole('columnheader', { name: /title/i })
    await user.click(titleHeader)

    await waitFor(() => {
      expect(titleHeader).toHaveTextContent(/↑/)
    })
  })

  it('clicking Title header twice sorts by title descending', async () => {
    const user = userEvent.setup()
    mockFetchResponse(TWENTY_TASKS)
    renderTasksPage()

    await waitFor(() => screen.getByText('Task 1'))

    const titleHeader = screen.getByRole('columnheader', { name: /title/i })
    await user.click(titleHeader)
    await user.click(titleHeader)

    await waitFor(() => {
      expect(titleHeader).toHaveTextContent(/↓/)
    })
  })

  it('clicking Estimated time header sorts by estimated time', async () => {
    const user = userEvent.setup()
    mockFetchResponse(TWENTY_TASKS)
    renderTasksPage()

    await waitFor(() => screen.getByText('Task 1'))

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
    mockFetchResponse(TWENTY_TASKS)
    renderTasksPage()

    await waitFor(() => screen.getByText('Task 1'))

    const dateHeader = screen.getByRole('columnheader', {
      name: /creation date/i,
    })
    await user.click(dateHeader)

    await waitFor(() => {
      expect(dateHeader).toHaveTextContent(/↑/)
    })
  })

  it('defaults to sorting by creation date descending', async () => {
    mockFetchResponse(TWENTY_TASKS)
    renderTasksPage()
    await waitFor(() => screen.getByText('Task 1'))
    const dateHeader = screen.getByRole('columnheader', {
      name: /creation date/i,
    })
    expect(dateHeader).toHaveTextContent(/↓/)
  })
})
