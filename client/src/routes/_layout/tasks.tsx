import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
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
  userName: string
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
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('userName')}
              >
                <div className="flex items-center">
                  User
                  <SortIcon column="userName" />
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
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.estimatedTime}</TableCell>
                  <TableCell>{formatDateTime(task.createdAt)}</TableCell>
                  <TableCell>{task.userName}</TableCell>
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
    </div>
  )
}
