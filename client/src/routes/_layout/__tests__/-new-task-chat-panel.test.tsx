import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatPanel } from '@/components/chat-panel'

describe('ChatPanel — header', () => {
  it('renders the title "Task Agent"', () => {
    render(<ChatPanel />)
    expect(screen.getByText('Task Agent')).toBeInTheDocument()
  })

  it('renders status "Ready to help" when not loading', () => {
    render(<ChatPanel />)
    expect(screen.getByText('Ready to help')).toBeInTheDocument()
  })
})

describe('ChatPanel — empty state', () => {
  it('renders the empty state heading "Describe your task"', () => {
    render(<ChatPanel />)
    expect(screen.getByText('Describe your task')).toBeInTheDocument()
  })

  it('renders the empty state subtitle', () => {
    render(<ChatPanel />)
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
    render(<ChatPanel />)
    const textarea = screen.getByPlaceholderText('Describe your task...')
    await user.type(textarea, 'build a login form')
    expect(textarea).toHaveValue('build a login form')
  })

  it('submit button is disabled when textarea is empty', () => {
    render(<ChatPanel />)
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled()
  })

  it('submit button is enabled when textarea has content', async () => {
    const user = userEvent.setup()
    render(<ChatPanel />)
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
    render(<ChatPanel />)
    const textarea = screen.getByPlaceholderText('Describe your task...')
    await user.type(textarea, 'build a login form')
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(textarea).toHaveValue('')
  })

  it('Enter key submits the form', async () => {
    const user = userEvent.setup()
    render(<ChatPanel />)
    const textarea = screen.getByPlaceholderText('Describe your task...')
    await user.type(textarea, 'build a login form')
    await user.keyboard('{Enter}')
    expect(textarea).toHaveValue('')
  })

  it('Shift+Enter does not submit the form', async () => {
    const user = userEvent.setup()
    render(<ChatPanel />)
    const textarea = screen.getByPlaceholderText('Describe your task...')
    await user.type(textarea, 'build a login form')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    expect(textarea).toHaveValue('build a login form\n')
  })
})

describe('ChatPanel — message flow', () => {
  it('submitting adds a user message to the list', async () => {
    const user = userEvent.setup()
    render(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(screen.getByText('build a login form')).toBeInTheDocument()
  })

  it('empty state disappears after first message is sent', async () => {
    const user = userEvent.setup()
    render(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(screen.queryByText('Describe your task')).not.toBeInTheDocument()
  })

  it('loading indicator appears after submit', async () => {
    const user = userEvent.setup()
    render(<ChatPanel />)
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
    render(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(screen.getByText('Thinking...')).toBeInTheDocument()
  })
})

describe('ChatPanel — mock agent response', () => {
  it('agent reply appears after 1 second', async () => {
    const user = userEvent.setup()
    render(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    await waitFor(
      () =>
        expect(
          screen.getByText(
            /You said: "build a login form" — \(This is a mock response/,
          ),
        ).toBeInTheDocument(),
      { timeout: 2000 },
    )
  })

  it('agent reply text contains the echoed user message', async () => {
    const user = userEvent.setup()
    render(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'add pagination to users',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    await waitFor(
      () =>
        expect(
          screen.getByText(/You said: "add pagination to users"/),
        ).toBeInTheDocument(),
      { timeout: 2000 },
    )
  })

  it('loading indicator disappears after agent reply', async () => {
    const user = userEvent.setup()
    render(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    await waitFor(
      () => expect(document.querySelectorAll('.animate-bounce').length).toBe(0),
      { timeout: 2000 },
    )
  })

  it('status returns to "Ready to help" after agent reply', async () => {
    const user = userEvent.setup()
    render(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    await waitFor(
      () => expect(screen.getByText('Ready to help')).toBeInTheDocument(),
      { timeout: 2000 },
    )
  })
})
