# New Task Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `/new-task` route as a two-panel layout — a mocked chatbot on the left and a placeholder panel on the right.

**Architecture:** The route file owns only the layout (two panels inside a shared bordered container). `ChatPanel` manages its own message state and mock agent responses. `TaskPreviewPanel` is a stateless placeholder. Each component has its own test file.

**Tech Stack:** React 19, TanStack Router, shadcn/ui (ScrollArea, Avatar, Button), Hugeicons (`AiMagicIcon`, user icon), Tailwind CSS, Vitest + Testing Library.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `client/src/components/ui/scroll-area.tsx` | Create (via shadcn CLI) | Scrollable region primitive |
| `client/src/components/ui/avatar.tsx` | Create (via shadcn CLI) | Avatar primitive |
| `client/src/components/chat-panel.tsx` | Create | Chatbot UI + mock state |
| `client/src/components/task-preview-panel.tsx` | Create | Stateless right panel placeholder |
| `client/src/routes/_layout/new-task.tsx` | Modify | Two-panel page layout |
| `client/src/routes/_layout/__tests__/new-task-chat-panel.test.tsx` | Create | ChatPanel tests |
| `client/src/routes/_layout/__tests__/new-task-preview-panel.test.tsx` | Create | TaskPreviewPanel tests |

---

## Task 1: Install shadcn dependencies

**Files:**
- Create: `client/src/components/ui/scroll-area.tsx`
- Create: `client/src/components/ui/avatar.tsx`

- [ ] **Step 1: Install ScrollArea and Avatar shadcn components**

Run from the repo root:
```bash
pnpm dlx shadcn add scroll-area --preset b6rG9zk5C6
pnpm dlx shadcn add avatar --preset b6rG9zk5C6
```

Expected: Two new files appear — `client/src/components/ui/scroll-area.tsx` and `client/src/components/ui/avatar.tsx`. No errors.

- [ ] **Step 2: Verify the files exist**

Run:
```bash
ls client/src/components/ui/scroll-area.tsx client/src/components/ui/avatar.tsx
```

Expected: Both paths printed without error.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ui/scroll-area.tsx client/src/components/ui/avatar.tsx
git commit -m "chore: add ScrollArea and Avatar shadcn components"
```

---

## Task 2: TaskPreviewPanel — test first

**Files:**
- Create: `client/src/components/task-preview-panel.tsx`
- Create: `client/src/routes/_layout/__tests__/new-task-preview-panel.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/routes/_layout/__tests__/new-task-preview-panel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { TaskPreviewPanel } from '@/components/task-preview-panel'

describe('TaskPreviewPanel', () => {
  it('renders the placeholder text', () => {
    render(<TaskPreviewPanel />)
    expect(
      screen.getByText(
        'Start a new task by describing it to our agent.',
      ),
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd client && pnpm vitest run src/routes/_layout/__tests__/new-task-preview-panel.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/task-preview-panel'`

- [ ] **Step 3: Implement TaskPreviewPanel**

Create `client/src/components/task-preview-panel.tsx`:

```tsx
export function TaskPreviewPanel() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <p className="text-center text-sm text-muted-foreground">
        Start a new task by describing it to our agent.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd client && pnpm vitest run src/routes/_layout/__tests__/new-task-preview-panel.test.tsx
```

Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/task-preview-panel.tsx \
        client/src/routes/_layout/__tests__/new-task-preview-panel.test.tsx
git commit -m "feat: add TaskPreviewPanel with placeholder text"
```

---

## Task 3: ChatPanel — skeleton and header tests

**Files:**
- Create: `client/src/components/chat-panel.tsx`
- Create: `client/src/routes/_layout/__tests__/new-task-chat-panel.test.tsx`

- [ ] **Step 1: Write the failing tests for header and empty state**

Create `client/src/routes/_layout/__tests__/new-task-chat-panel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
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
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
cd client && pnpm vitest run src/routes/_layout/__tests__/new-task-chat-panel.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/chat-panel'`

- [ ] **Step 3: Create the ChatPanel skeleton**

Create `client/src/components/chat-panel.tsx`:

```tsx
import { AiMagicIcon, User03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

type MessageRole = 'user' | 'agent'

type Message = {
  id: string
  role: MessageRole
  text: string
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        '[data-slot="scroll-area-viewport"]',
      )
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [messages])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    setTimeout(() => {
      const agentMessage: Message = {
        id: crypto.randomUUID(),
        role: 'agent',
        text: `You said: "${trimmed}" — (This is a mock response — LLM not connected yet)`,
      }
      setMessages((prev) => [...prev, agentMessage])
      setIsLoading(false)
    }, 1000)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <HugeiconsIcon icon={AiMagicIcon} size={20} strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Task Agent</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Thinking...' : 'Ready to help'}
          </p>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-6">
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={AiMagicIcon} size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">
                Describe your task
              </h3>
              <p className="mt-2 max-w-md text-muted-foreground">
                Tell me what you need built and I&apos;ll help you refine it
                into a structured task.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-4">
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <HugeiconsIcon
                      icon={AiMagicIcon}
                      size={16}
                      strokeWidth={1.5}
                    />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-3">
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50" />
                </div>
              </div>
            )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your task..."
              disabled={isLoading}
              rows={1}
              className={cn(
                'w-full resize-none rounded-xl border bg-card px-4 py-3 text-base shadow-sm transition-all',
                'placeholder:text-muted-foreground',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="size-12 shrink-0 rounded-xl"
            aria-label="Send message"
          >
            <HugeiconsIcon icon={AiMagicIcon} size={20} strokeWidth={1.5} />
          </Button>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-4', isUser && 'flex-row-reverse')}>
      <Avatar className="size-9 shrink-0">
        <AvatarFallback
          className={cn(
            isUser
              ? 'bg-secondary text-secondary-foreground'
              : 'bg-primary text-primary-foreground',
          )}
        >
          {isUser ? (
            <HugeiconsIcon icon={User03Icon} size={16} strokeWidth={1.5} />
          ) : (
            <HugeiconsIcon icon={AiMagicIcon} size={16} strokeWidth={1.5} />
          )}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground',
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.text}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
cd client && pnpm vitest run src/routes/_layout/__tests__/new-task-chat-panel.test.tsx
```

Expected: PASS (4 tests — header title, ready status, empty heading, empty subtitle).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/chat-panel.tsx \
        client/src/routes/_layout/__tests__/new-task-chat-panel.test.tsx
git commit -m "feat: add ChatPanel skeleton with header and empty state"
```

---

## Task 4: ChatPanel — input and submit interaction tests

**Files:**
- Modify: `client/src/routes/_layout/__tests__/new-task-chat-panel.test.tsx`

- [ ] **Step 1: Add interaction tests**

Append these `describe` blocks to `client/src/routes/_layout/__tests__/new-task-chat-panel.test.tsx`:

```tsx
import userEvent from '@testing-library/user-event'

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
```

- [ ] **Step 2: Run all ChatPanel tests**

```bash
cd client && pnpm vitest run src/routes/_layout/__tests__/new-task-chat-panel.test.tsx
```

Expected: All tests pass (10 tests total so far).

- [ ] **Step 3: Commit**

```bash
git add client/src/routes/_layout/__tests__/new-task-chat-panel.test.tsx
git commit -m "test: add ChatPanel input interaction tests"
```

---

## Task 5: ChatPanel — message flow and mock response tests

**Files:**
- Modify: `client/src/routes/_layout/__tests__/new-task-chat-panel.test.tsx`

- [ ] **Step 1: Add message flow tests**

Append these `describe` blocks to `client/src/routes/_layout/__tests__/new-task-chat-panel.test.tsx`:

```tsx
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
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    vi.useFakeTimers()
    render(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    // Three bouncing dots are rendered as <span> elements inside the loading bubble
    const bouncingDots = document
      .querySelectorAll('.animate-bounce')
    expect(bouncingDots.length).toBe(3)
    vi.useRealTimers()
  })

  it('status changes to "Thinking..." after submit', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    vi.useFakeTimers()
    render(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(screen.getByText('Thinking...')).toBeInTheDocument()
    vi.useRealTimers()
  })
})

describe('ChatPanel — mock agent response', () => {
  it('agent reply appears after 1 second', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    vi.useFakeTimers()
    render(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    await vi.advanceTimersByTimeAsync(1000)
    expect(
      screen.getByText(
        /You said: "build a login form" — \(This is a mock response/,
      ),
    ).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('agent reply text contains the echoed user message', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    vi.useFakeTimers()
    render(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'add pagination to users',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    await vi.advanceTimersByTimeAsync(1000)
    expect(
      screen.getByText(/You said: "add pagination to users"/),
    ).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('loading indicator disappears after agent reply', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    vi.useFakeTimers()
    render(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    await vi.advanceTimersByTimeAsync(1000)
    expect(document.querySelectorAll('.animate-bounce').length).toBe(0)
    vi.useRealTimers()
  })

  it('status returns to "Ready to help" after agent reply', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    vi.useFakeTimers()
    render(<ChatPanel />)
    await user.type(
      screen.getByPlaceholderText('Describe your task...'),
      'build a login form',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))
    await vi.advanceTimersByTimeAsync(1000)
    expect(screen.getByText('Ready to help')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: Run all ChatPanel tests**

```bash
cd client && pnpm vitest run src/routes/_layout/__tests__/new-task-chat-panel.test.tsx
```

Expected: All 17 tests pass.

- [ ] **Step 3: Commit**

```bash
git add client/src/routes/_layout/__tests__/new-task-chat-panel.test.tsx
git commit -m "test: add ChatPanel message flow and mock response tests"
```

---

## Task 6: New Task route — two-panel layout

**Files:**
- Modify: `client/src/routes/_layout/new-task.tsx`

- [ ] **Step 1: Replace the route stub with the two-panel layout**

Replace the entire contents of `client/src/routes/_layout/new-task.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { ChatPanel } from '@/components/chat-panel'
import { TaskPreviewPanel } from '@/components/task-preview-panel'

export const Route = createFileRoute('/_layout/new-task')({
  beforeLoad: () => ({
    title: 'New Task',
  }),
  component: NewTaskPage,
})

function NewTaskPage() {
  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6">
      <div className="flex h-full min-h-0 flex-1 overflow-hidden rounded-lg border">
        <div className="w-1/2 border-r">
          <ChatPanel />
        </div>
        <div className="w-1/2">
          <TaskPreviewPanel />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build to verify no TypeScript errors**

```bash
cd client && pnpm build
```

Expected: Build completes with no errors.

- [ ] **Step 3: Run the full client test suite**

```bash
cd client && pnpm test
```

Expected: All tests pass (17 ChatPanel + 1 TaskPreviewPanel + existing users tests).

- [ ] **Step 4: Run biome check**

```bash
pnpm check
```

Expected: No lint or format errors. If there are any, fix them and re-run.

- [ ] **Step 5: Commit**

```bash
git add client/src/routes/_layout/new-task.tsx
git commit -m "feat: implement new task page with two-panel layout"
```

---

## Task 7: Manual smoke test

- [ ] **Step 1: Start the client dev server**

```bash
cd client && pnpm dev
```

- [ ] **Step 2: Navigate to the new task page**

Open `http://localhost:5173` in a browser (or whichever port Vite reports). Click "New Task" in the sidebar.

- [ ] **Step 3: Verify the layout**

- Two panels side by side, each taking 50% width
- Thin rounded border wraps both panels
- Thin vertical border separates the panels (no gap)
- Left panel shows the "Task Agent" header with icon and "Ready to help" status
- Left panel shows the centered empty state (sparkles icon, "Describe your task" heading, subtitle)
- Right panel shows the faded centered placeholder text

- [ ] **Step 4: Verify the chatbot interaction**

- Type a message and press Enter (or click the send button)
- User message bubble appears on the right side with primary background
- Three animated bouncing dots appear on the left
- Status changes to "Thinking..."
- After ~1 second, agent reply appears with the echoed message
- Dots disappear, status returns to "Ready to help"
- Shift+Enter adds a newline instead of submitting

- [ ] **Step 5: Stop the dev server**

Press `Ctrl+C`.
