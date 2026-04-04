import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { ChatPanel } from '@/components/chat-panel'

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

function renderWithQuery(ui: ReactNode, queryClient = makeQueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('ChatPanel — header', () => {
  it('renders the title "Task Agent"', () => {
    renderWithQuery(<ChatPanel />)
    expect(screen.getByText('Task Agent')).toBeInTheDocument()
  })
})

describe('ChatPanel — empty state', () => {
  it('renders the empty state heading "Describe your task"', () => {
    renderWithQuery(<ChatPanel />)
    expect(screen.getByText('Describe your task')).toBeInTheDocument()
  })

  it('renders the empty state subtitle', () => {
    renderWithQuery(<ChatPanel />)
    expect(
      screen.getByText(
        "Tell me what you need built and I'll help you refine it into a structured task.",
      ),
    ).toBeInTheDocument()
  })
})

describe('ChatPanel — input', () => {
  it('user can type in the textarea', async () => {
    const user = userEvent.setup()
    renderWithQuery(<ChatPanel />)
    const textarea = screen.getByPlaceholderText('Describe your task...')
    await user.type(textarea, 'build a login form')
    expect(textarea).toHaveValue('build a login form')
  })

  it('submit button is disabled when textarea is empty', () => {
    renderWithQuery(<ChatPanel />)
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled()
  })

  it('submit button is enabled when textarea has content', async () => {
    const user = userEvent.setup()
    renderWithQuery(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    expect(
      screen.getByRole('button', { name: /send message/i }),
    ).not.toBeDisabled()
  })

  it('textarea clears after submit', async () => {
    const user = userEvent.setup()
    renderWithQuery(<ChatPanel />)
    const textarea = screen.getByPlaceholderText('Describe your task...')
    await user.type(textarea, 'build a login form')
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(textarea).toHaveValue('')
  })

  it('Enter key submits the form', async () => {
    const user = userEvent.setup()
    renderWithQuery(<ChatPanel />)
    const textarea = screen.getByPlaceholderText('Describe your task...')
    await user.type(textarea, 'build a login form')
    await user.keyboard('{Enter}')
    expect(textarea).toHaveValue('')
  })

  it('Shift+Enter does not submit the form', async () => {
    const user = userEvent.setup()
    renderWithQuery(<ChatPanel />)
    const textarea = screen.getByPlaceholderText('Describe your task...')
    await user.type(textarea, 'build a login form')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    expect(textarea).toHaveValue('build a login form\n')
  })
})

describe('ChatPanel — message flow', () => {
  it('submitting adds a user message to the list', async () => {
    const user = userEvent.setup()
    renderWithQuery(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(screen.getByText('build a login form')).toBeInTheDocument()
  })

  it('empty state disappears after first message is sent', async () => {
    const user = userEvent.setup()
    renderWithQuery(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(screen.queryByText('Describe your task')).not.toBeInTheDocument()
  })

  it('loading indicator appears after submit', async () => {
    const user = userEvent.setup()
    renderWithQuery(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    // Three bouncing dots are rendered as <span> elements inside the loading bubble
    const bouncingDots = document.querySelectorAll('.animate-bounce')
    expect(bouncingDots.length).toBe(3)
  })

  it('status changes to "Thinking..." after submit', async () => {
    const user = userEvent.setup()
    renderWithQuery(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(screen.getByText('Thinking...')).toBeInTheDocument()
  })
})
