# Spec: New Task Page

**Date:** 2026-04-02  
**Status:** Approved

---

## Overview

Implement the `/new-task` route as a two-panel layout. The left panel contains a chatbot interface ("Task Agent") that accepts user prompts and returns mocked responses. The right panel is a placeholder for future task preview output. LLM integration is out of scope — all agent responses are mocked.

---

## Page Layout

The route `/_layout/new-task` renders a full-height content area using the existing layout's `flex flex-1 flex-col` wrapper. Inside it, a `flex flex-row h-full` container holds two equal-width panels.

- The outer container has a thin rounded border (`rounded-lg border`) — matching the users table wrapper style — and sits inside a `p-4 lg:p-6` wrapper, same as `users.tsx`.
- The two panels are separated by a `border-r` on the left panel. No gap, no spacing between panels.
- Neither panel carries its own outer border; they share the container's border.
- Left panel: 50% width (`w-1/2`), full height, renders `<ChatPanel />`
- Right panel: 50% width (`w-1/2`), full height, renders `<TaskPreviewPanel />`

---

## Left Panel — `ChatPanel`

**File:** `client/src/components/chat-panel.tsx`

Self-contained component. Manages its own state: a `messages` array and an `isLoading` boolean. No props required for this phase.

### Types

```ts
type MessageRole = 'user' | 'agent'

type Message = {
  id: string
  role: MessageRole
  text: string
}
```

### State

- `messages: Message[]` — starts empty
- `isLoading: boolean` — starts false
- `input: string` — controlled textarea value

### Header

- Sparkles icon from `@hugeicons/core-free-icons` + `@hugeicons/react`, displayed in a small rounded square (`size-10 rounded-xl`) with `bg-primary text-primary-foreground`
- Title: **"Task Agent"** (`font-semibold`)
- Status line: `"Thinking..."` when `isLoading === true`, `"Ready to help"` otherwise (`text-sm text-muted-foreground`)
- Separated from the message area by `border-b`

### Message Area

- Uses shadcn `ScrollArea`, fills remaining vertical space (`flex-1`)
- Auto-scrolls to the bottom whenever `messages` changes (via `useEffect` + `scrollRef`)
- Padding: `p-6`

### Empty State

Shown when `messages.length === 0`:

- Centered vertically and horizontally (`flex flex-col items-center justify-center py-20 text-center`)
- Large sparkles icon in a rounded square (`size-16 rounded-2xl bg-primary/10 text-primary`)
- Heading: **"Describe your task"** (`text-2xl font-semibold`)
- Subtitle: `"Tell me what you need built and I'll help you refine it into a structured task."` (`text-muted-foreground max-w-md`)

### Message Bubbles

Two variants based on `message.role`:

**User messages:**
- Layout: `flex flex-row-reverse gap-4`
- Avatar: right side, `bg-secondary text-secondary-foreground`, user icon
- Bubble: `bg-primary text-primary-foreground rounded-2xl px-4 py-3 max-w-[80%]`

**Agent messages:**
- Layout: `flex flex-row gap-4`
- Avatar: left side, `bg-primary text-primary-foreground`, sparkles icon
- Bubble: `bg-muted text-foreground rounded-2xl px-4 py-3 max-w-[80%]`

### Loading Indicator

Shown when `isLoading === true` and the last message has `role === 'user'`:

- Agent avatar on the left
- Three animated bouncing dots (`animate-bounce rounded-full bg-muted-foreground/50`), staggered with `animation-delay`

### Mock Behavior

1. User submits a non-empty message
2. A `Message` with `role: 'user'` is appended to `messages`
3. `isLoading` is set to `true`; input clears
4. After a `setTimeout` of **1000ms**, append an agent `Message`:
   - Text: `You said: "<original message>" — (This is a mock response — LLM not connected yet)`
5. `isLoading` is set to `false`

IDs for messages are generated with `crypto.randomUUID()`.

### Input Area

- Separated from message area by `border-t`
- Auto-resizing `textarea` (max height 200px via `useEffect` on `input`)
- Placeholder: `"Describe your task..."`
- Disabled when `isLoading === true`
- Send button: icon-only (`size-12 rounded-xl`), disabled when `input.trim()` is empty or `isLoading`
- **Enter** submits; **Shift+Enter** inserts a newline
- Textarea clears and resets height after submit

---

## Right Panel — `TaskPreviewPanel`

**File:** `client/src/components/task-preview-panel.tsx`

Stateless component. Renders a single centered placeholder text:

> "Start a new task by describing it to our agent."

Styling: `flex h-full items-center justify-center`, text styled `text-muted-foreground text-center text-sm`.

---

## Route File

**File:** `client/src/routes/_layout/new-task.tsx`

Replaces the current stub. Imports `ChatPanel` and `TaskPreviewPanel`. Renders the two-panel container. No state of its own.

---

## Tests

### `client/src/routes/_layout/__tests__/new-task-chat-panel.test.tsx`

Tests for `ChatPanel` rendered in isolation (no router/query provider needed):

| # | Test description |
|---|-----------------|
| 1 | Renders the header with title "Task Agent" |
| 2 | Renders status "Ready to help" when not loading |
| 3 | Renders the empty state heading "Describe your task" when no messages |
| 4 | Renders the empty state subtitle text when no messages |
| 5 | User can type in the textarea |
| 6 | Submit button is disabled when textarea is empty |
| 7 | Submitting a message adds a user message bubble to the list |
| 8 | Empty state disappears after first message is sent |
| 9 | Textarea clears after submit |
| 10 | Loading indicator (animated dots) appears after submit |
| 11 | Status line changes to "Thinking..." after submit |
| 12 | Agent reply appears after 1 second (using `vi.useFakeTimers`) |
| 13 | Agent reply text contains the echoed user message |
| 14 | Loading indicator disappears after agent reply |
| 15 | Status returns to "Ready to help" after agent reply |
| 16 | Enter key submits the form |
| 17 | Shift+Enter does not submit the form |

### `client/src/routes/_layout/__tests__/new-task-preview-panel.test.tsx`

Tests for `TaskPreviewPanel`:

| # | Test description |
|---|-----------------|
| 1 | Renders the placeholder text "Start a new task by describing it to our agent." |

---

## File Checklist

| File | Action |
|------|--------|
| `client/src/components/chat-panel.tsx` | Create |
| `client/src/components/task-preview-panel.tsx` | Create |
| `client/src/routes/_layout/new-task.tsx` | Replace stub |
| `client/src/routes/_layout/__tests__/new-task-chat-panel.test.tsx` | Create |
| `client/src/routes/_layout/__tests__/new-task-preview-panel.test.tsx` | Create |

---

## Dependencies

- `ScrollArea` shadcn component — not currently installed. Must be added via `pnpm dlx shadcn add scroll-area --preset b6rG9zk5C6` before implementing `ChatPanel`.

---

## Out of Scope

- Real LLM/API integration
- Saving tasks to the database
- Right panel content beyond the placeholder text
