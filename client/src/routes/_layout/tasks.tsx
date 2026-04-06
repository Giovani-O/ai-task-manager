import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import type { TaskPreview } from '@/components/task-preview-panel'
import { TaskPreviewPanel } from '@/components/task-preview-panel'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/format-date'

export type Task = {
  id: string
  title: string
  estimatedTime: string
  createdAt: Date
}

export type TaskDetail = {
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

export async function fetchTask(id: string): Promise<TaskDetail> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${id}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch task')
  }
  const data = (await response.json()) as { task: TaskDetail }
  return data.task
}

type SortColumn = 'title' | 'estimatedTime' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const PAGE_SIZE = 20

async function fetchTasks(
  page: number,
  pageSize: number,
  sortBy: SortColumn,
  sortDirection: SortDirection,
) {
  const url = new URL(`${import.meta.env.VITE_API_URL}/tasks`)
  url.searchParams.set('page', String(page))
  url.searchParams.set('pageSize', String(pageSize))
  url.searchParams.set('sortBy', sortBy)
  url.searchParams.set('sortDirection', sortDirection)

  const response = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }
  return response.json() as Promise<{
    tasks: Task[]
    page: number
    pageSize: number
  }>
}

export const Route = createFileRoute('/_layout/tasks')({
  beforeLoad: () => ({
    title: 'Tasks',
  }),
  component: TasksPage,
})

export function TasksPage() {
  const [page, setPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', page, sortColumn, sortDirection],
    queryFn: () => fetchTasks(page, PAGE_SIZE, sortColumn, sortDirection),
  })

  const tasks = data?.tasks ?? []
  const isFirstPage = page === 1
  const hasNextPage = tasks.length === PAGE_SIZE

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <span className="ml-1 opacity-0 group-hover:opacity-50">⇅</span>
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <Suspense
        fallback={
          <div className="p-4 w-full h-full flex items-center justify-center">
            Loading tasks...
          </div>
        }
      >
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    Title
                    <SortIcon column="title" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('estimatedTime')}
                >
                  <div className="flex items-center">
                    Estimated time
                    <SortIcon column="estimatedTime" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Creation date
                    <SortIcon column="createdAt" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No tasks found.
                  </TableCell>
                </TableRow>
              ) : (
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
              )}
            </TableBody>
          </Table>
        </div>
        {(page > 1 || hasNextPage) && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-disabled={isFirstPage}
                  className={
                    isFirstPage
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                </PaginationPrevious>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => p + 1)}
                  aria-disabled={!hasNextPage}
                  className={
                    !hasNextPage
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </Suspense>
      <TaskDetailSheet
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  )
}

type TaskDetailSheetProps = {
  taskId: string | null
  onClose: () => void
}

function TaskDetailSheet({ taskId, onClose }: TaskDetailSheetProps) {
  const {
    data: task,
    isLoading,
    isError,
  } = useQuery({
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
    <Sheet
      modal={false}
      open={!!taskId}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetTitle className="sr-only">Task Details</SheetTitle>
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
