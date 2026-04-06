# Task Detail Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user clicks a row in the Tasks table, a Sheet slides in from the right showing full task details using `TaskPreviewPanel`, fetched from `GET /tasks/:id`.

**Architecture:** Add `selectedTaskId` state to `TasksPage`; derive Sheet open state from it. A `TaskDetailSheet` component (co-located in `tasks.tsx`) runs `useQuery` for the detail fetch and renders `TaskPreviewPanel` in `mode="edit"`. `TaskPreviewPanel` gains a `mode` prop to toggle between Save and Edit button.

**Tech Stack:** React 19, TanStack Query, shadcn/ui Sheet, Hugeicons, TypeScript strict

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `client/src/components/task-preview-panel.tsx` | Modify | Add `mode` prop; render Edit button when `mode === 'edit'` |
| `client/src/routes/_layout/tasks.tsx` | Modify | Add `fetchTask`, `selectedTaskId` state, `TaskDetailSheet` component, row click handlers |

---

### Task 1: Add `mode` prop to `TaskPreviewPanel`

**Files:**
- Modify: `client/src/components/task-preview-panel.tsx`

- [ ] **Step 1: Update `TaskPreviewPanelProps` type to include `mode`**

In `client/src/components/task-preview-panel.tsx`, update the props type:

```typescript
type TaskPreviewPanelProps = {
  task?: TaskPreview
  isGenerating?: boolean
  onSave?: () => void
  isSaving?: boolean
  mode?: 'save' | 'edit'
}
```

- [ ] **Step 2: Destructure `mode` in the component and update the bottom button**

Update the `TaskPreviewPanel` function signature and replace the save button section:

```typescript
export function TaskPreviewPanel({
  task: propTask,
  isGenerating = false,
  onSave,
  isSaving = false,
  mode = 'save',
}: TaskPreviewPanelProps) {
```

Add `PencilEdit01Icon` to the import from `@hugeicons/core-free-icons`:

```typescript
import {
  Clock01Icon,
  PencilEdit01Icon,
  PlayIcon,
  SaveIcon,
  Settings04Icon,
  TextIcon,
} from '@hugeicons/core-free-icons'
```

Replace the save button `<div>` block (the one with `border-t p-4`) with:

```typescript
{/* Action Button Panel */}
<div className="border-t p-4">
  {mode === 'edit' ? (
    <Button
      className="h-[49px] w-full rounded-xl text-base cursor-pointer"
      size="default"
    >
      <HugeiconsIcon icon={PencilEdit01Icon} size={20} strokeWidth={1.5} />
      <span className="ml-2">Edit Task</span>
    </Button>
  ) : (
    <Button
      className="h-[49px] w-full rounded-xl text-base cursor-pointer"
      size="default"
      disabled={isGenerating || isSaving}
      onClick={onSave}
    >
      <HugeiconsIcon icon={SaveIcon} size={20} strokeWidth={1.5} />
      <span className="ml-2">{isSaving ? 'Saving...' : 'Save Task'}</span>
    </Button>
  )}
</div>
```

- [ ] **Step 3: Verify TypeScript compiles with no errors**

```bash
pnpm --filter client build
```

Expected: build succeeds with no type errors.

- [ ] **Step 4: Run lint/format check**

```bash
pnpm check
```

Expected: no lint or format errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/task-preview-panel.tsx
git commit -m "feat: add mode prop to TaskPreviewPanel for edit/save toggle"
```

---

### Task 2: Add `fetchTask` and task detail types to `tasks.tsx`

**Files:**
- Modify: `client/src/routes/_layout/tasks.tsx`

- [ ] **Step 1: Add `TaskDetail` type and `fetchTask` function**

After the existing `Task` type definition in `client/src/routes/_layout/tasks.tsx`, add:

```typescript
type TaskDetail = {
  id: string
  chatId: string
  title: string
  description: string
  steps: string[]
  estimatedTime: string
  implementationSuggestion: string
  acceptanceCriteria: string[]
  suggestedTests: string[]
  createdAt: string
  updatedAt: string
}

async function fetchTask(id: string): Promise<TaskDetail> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/tasks/${id}`,
    {
      headers: { 'Content-Type': 'application/json' },
    },
  )
  if (!response.ok) {
    throw new Error('Failed to fetch task')
  }
  const data = await response.json() as { task: TaskDetail }
  return data.task
}
```

- [ ] **Step 2: Verify TypeScript compiles with no errors**

```bash
pnpm --filter client build
```

Expected: build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/routes/_layout/tasks.tsx
git commit -m "feat: add fetchTask function and TaskDetail type to tasks page"
```

---

### Task 3: Add `TaskDetailSheet` component to `tasks.tsx`

**Files:**
- Modify: `client/src/routes/_layout/tasks.tsx`

- [ ] **Step 1: Add Sheet and TaskPreviewPanel imports**

Add to the imports in `client/src/routes/_layout/tasks.tsx` (`useQuery` is already present — do not duplicate it):

```typescript
import { TaskPreviewPanel } from '@/components/task-preview-panel'
import type { TaskPreview } from '@/components/task-preview-panel'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
```

- [ ] **Step 2: Add `TaskDetailSheet` component at the bottom of the file**

Append this component after `TasksPage` in `client/src/routes/_layout/tasks.tsx`:

```typescript
type TaskDetailSheetProps = {
  taskId: string | null
  onClose: () => void
}

function TaskDetailSheet({ taskId, onClose }: TaskDetailSheetProps) {
  const { data: task, isLoading, isError } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTask(taskId as string),
    enabled: !!taskId,
  })

  const taskPreview: TaskPreview | undefined = task
    ? {
        title: task.title,
        description: task.description,
        steps: task.steps,
        estimatedTime: task.estimatedTime,
        implementationSuggestion: task.implementationSuggestion,
        acceptanceCriteria: task.acceptanceCriteria,
        suggestedTests: task.suggestedTests,
      }
    : undefined

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        {isError ? (
          <div className="flex h-full items-center justify-center p-6">
            <p className="text-center text-muted-foreground">
              Failed to load task.
            </p>
          </div>
        ) : (
          <TaskPreviewPanel
            task={taskPreview}
            isGenerating={isLoading}
            mode="edit"
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles with no errors**

```bash
pnpm --filter client build
```

Expected: build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/routes/_layout/tasks.tsx
git commit -m "feat: add TaskDetailSheet component to tasks page"
```

---

### Task 4: Wire up row click and Sheet state in `TasksPage`

**Files:**
- Modify: `client/src/routes/_layout/tasks.tsx`

- [ ] **Step 1: Add `selectedTaskId` state to `TasksPage`**

Inside `TasksPage`, after the existing state declarations, add:

```typescript
const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
```

- [ ] **Step 2: Add `cursor-pointer` and `onClick` to each `TableRow`**

Replace the existing task row render:

```typescript
tasks.map((task) => (
  <TableRow key={task.id}>
    <TableCell>{task.title}</TableCell>
    <TableCell>{task.estimatedTime}</TableCell>
    <TableCell>{formatDateTime(task.createdAt)}</TableCell>
  </TableRow>
))
```

With:

```typescript
tasks.map((task) => (
  <TableRow
    key={task.id}
    className="cursor-pointer"
    onClick={() => setSelectedTaskId(task.id)}
  >
    <TableCell>{task.title}</TableCell>
    <TableCell>{task.estimatedTime}</TableCell>
    <TableCell>{formatDateTime(task.createdAt)}</TableCell>
  </TableRow>
))
```

- [ ] **Step 3: Render `TaskDetailSheet` inside `TasksPage`**

At the bottom of the `TasksPage` return, just before the closing `</div>`, add:

```typescript
<TaskDetailSheet
  taskId={selectedTaskId}
  onClose={() => setSelectedTaskId(null)}
/>
```

- [ ] **Step 4: Verify TypeScript compiles with no errors**

```bash
pnpm --filter client build
```

Expected: build succeeds with no type errors.

- [ ] **Step 5: Run lint/format check**

```bash
pnpm check
```

Expected: no lint or format errors.

- [ ] **Step 6: Commit**

```bash
git add client/src/routes/_layout/tasks.tsx
git commit -m "feat: open task detail sheet on table row click"
```
