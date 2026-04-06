# Task Detail Sheet — Design Spec

**Date:** 2026-04-06

## Overview

When a user clicks a row in the Tasks table (`/tasks`), a Sheet slides in from the right displaying the full task details in cards, reusing the existing `TaskPreviewPanel` component. The Sheet fetches the task by ID from `GET /tasks/:id`.

---

## Architecture & Data Flow

- `tasks.tsx` gains a `selectedTaskId: string | null` state (initially `null`).
- Clicking a `TableRow` sets `selectedTaskId` to that task's ID.
- A `useQuery` keyed on `['task', selectedTaskId]` fetches `GET /tasks/:id`, enabled only when `selectedTaskId !== null`.
- The Sheet's open state is derived from `selectedTaskId !== null`; closing it sets `selectedTaskId` back to `null`.
- A `fetchTask(id: string)` function is added alongside `fetchTasks`, hitting `${VITE_API_URL}/tasks/:id`.

---

## Components

### `TaskPreviewPanel` changes (`client/src/components/task-preview-panel.tsx`)

- Add a `mode` prop: `'save' | 'edit'`, defaulting to `'save'` to preserve existing behavior.
- When `mode === 'edit'`: the bottom button renders as "Edit Task" with `PencilEdit01Icon` from Hugeicons; no `onClick` handler for now.
- When `mode === 'save'`: existing behavior unchanged (`onSave`, `isSaving` props still work).
- `TaskPreviewPanelProps` type updated to include `mode?: 'save' | 'edit'`.

### `TaskDetailSheet` (new, defined in `tasks.tsx`)

- Wraps shadcn `Sheet`, `SheetContent`, and `SheetHeader`.
- Props: `taskId: string | null`, `onClose: () => void`.
- Internally runs `useQuery(['task', taskId], ...)` with `enabled: !!taskId`.
- While loading: passes `isGenerating={true}` to `TaskPreviewPanel` to show skeletons.
- On success: maps API response to `TaskPreview` shape (drops `id`, `chatId`, `createdAt`, `updatedAt`) and passes to `TaskPreviewPanel` with `mode="edit"`.
- On error: renders a simple "Failed to load task." message in place of the panel content.
- Clicking a different row while the Sheet is open replaces `selectedTaskId`; the query re-fires showing the skeleton.

---

## Data Mapping

The API `Task` shape maps to `TaskPreview` by selecting:
- `title`, `description`, `steps`, `estimatedTime`, `implementationSuggestion`, `acceptanceCriteria`, `suggestedTests`

Fields `id`, `chatId`, `createdAt`, `updatedAt` are not displayed and are dropped.

The existing minimal `Task` type in `tasks.tsx` (list shape) is unchanged.

---

## Error Handling & Edge Cases

- Non-ok API response (including 404): Sheet stays open, shows "Failed to load task." error message.
- Row clicked while Sheet is open with different task: `selectedTaskId` updates, query re-fires, skeleton shown.
- Sheet closed (built-in close button or outside click): `selectedTaskId` set to `null`, query disabled.

---

## Out of Scope

- Edit Task functionality (button is a no-op placeholder for now).
- Tests (deferred).
