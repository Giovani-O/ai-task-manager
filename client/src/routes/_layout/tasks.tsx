import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
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

const PAGE_SIZE = 20

const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Implement user authentication',
    estimatedTime: '4h',
    createdAt: new Date('2025-01-15T10:00:00'),
    userName: 'Alice Johnson',
  },
  {
    id: '2',
    title: 'Design database schema',
    estimatedTime: '2h',
    createdAt: new Date('2025-01-14T14:30:00'),
    userName: 'Bob Smith',
  },
  {
    id: '3',
    title: 'Create API endpoints',
    estimatedTime: '6h',
    createdAt: new Date('2025-01-13T09:15:00'),
    userName: 'Alice Johnson',
  },
  {
    id: '4',
    title: 'Write unit tests',
    estimatedTime: '3h',
    createdAt: new Date('2025-01-12T16:45:00'),
    userName: 'Charlie Brown',
  },
  {
    id: '5',
    title: 'Setup CI/CD pipeline',
    estimatedTime: '5h',
    createdAt: new Date('2025-01-11T11:20:00'),
    userName: 'Bob Smith',
  },
  {
    id: '6',
    title: 'Implement dark mode',
    estimatedTime: '2h',
    createdAt: new Date('2025-01-10T13:00:00'),
    userName: 'Diana Lee',
  },
  {
    id: '7',
    title: 'Fix navigation bug',
    estimatedTime: '1h',
    createdAt: new Date('2025-01-09T15:30:00'),
    userName: 'Alice Johnson',
  },
  {
    id: '8',
    title: 'Update documentation',
    estimatedTime: '2h',
    createdAt: new Date('2025-01-08T10:00:00'),
    userName: 'Charlie Brown',
  },
  {
    id: '9',
    title: 'Refactor legacy code',
    estimatedTime: '8h',
    createdAt: new Date('2025-01-07T09:00:00'),
    userName: 'Bob Smith',
  },
  {
    id: '10',
    title: 'Add analytics tracking',
    estimatedTime: '3h',
    createdAt: new Date('2025-01-06T14:00:00'),
    userName: 'Diana Lee',
  },
  {
    id: '11',
    title: 'Build mobile responsive layout',
    estimatedTime: '4h',
    createdAt: new Date('2025-01-05T11:00:00'),
    userName: 'Alice Johnson',
  },
  {
    id: '12',
    title: 'Implement search functionality',
    estimatedTime: '6h',
    createdAt: new Date('2025-01-04T09:30:00'),
    userName: 'Bob Smith',
  },
  {
    id: '13',
    title: 'Setup error logging',
    estimatedTime: '2h',
    createdAt: new Date('2025-01-03T14:15:00'),
    userName: 'Charlie Brown',
  },
  {
    id: '14',
    title: 'Create onboarding flow',
    estimatedTime: '5h',
    createdAt: new Date('2025-01-02T10:45:00'),
    userName: 'Diana Lee',
  },
  {
    id: '15',
    title: 'Optimize bundle size',
    estimatedTime: '3h',
    createdAt: new Date('2025-01-01T16:00:00'),
    userName: 'Alice Johnson',
  },
  {
    id: '16',
    title: 'Implement rate limiting',
    estimatedTime: '2h',
    createdAt: new Date('2024-12-31T11:30:00'),
    userName: 'Bob Smith',
  },
  {
    id: '17',
    title: 'Add email notifications',
    estimatedTime: '4h',
    createdAt: new Date('2024-12-30T09:00:00'),
    userName: 'Charlie Brown',
  },
  {
    id: '18',
    title: 'Create admin dashboard',
    estimatedTime: '8h',
    createdAt: new Date('2024-12-29T14:20:00'),
    userName: 'Diana Lee',
  },
  {
    id: '19',
    title: 'Setup monitoring alerts',
    estimatedTime: '3h',
    createdAt: new Date('2024-12-28T10:15:00'),
    userName: 'Alice Johnson',
  },
  {
    id: '20',
    title: 'Implement caching layer',
    estimatedTime: '5h',
    createdAt: new Date('2024-12-27T15:45:00'),
    userName: 'Bob Smith',
  },
  {
    id: '21',
    title: 'Add two-factor authentication',
    estimatedTime: '6h',
    createdAt: new Date('2024-12-26T11:00:00'),
    userName: 'Charlie Brown',
  },
  {
    id: '22',
    title: 'Design landing page',
    estimatedTime: '4h',
    createdAt: new Date('2024-12-25T09:30:00'),
    userName: 'Diana Lee',
  },
  {
    id: '23',
    title: 'Fix memory leaks',
    estimatedTime: '3h',
    createdAt: new Date('2024-12-24T14:00:00'),
    userName: 'Alice Johnson',
  },
  {
    id: '24',
    title: 'Implement webhooks',
    estimatedTime: '5h',
    createdAt: new Date('2024-12-23T10:30:00'),
    userName: 'Bob Smith',
  },
  {
    id: '25',
    title: 'Create API documentation',
    estimatedTime: '4h',
    createdAt: new Date('2024-12-22T16:15:00'),
    userName: 'Charlie Brown',
  },
  {
    id: '26',
    title: 'Setup staging environment',
    estimatedTime: '2h',
    createdAt: new Date('2024-12-21T11:45:00'),
    userName: 'Diana Lee',
  },
  {
    id: '27',
    title: 'Implement data export',
    estimatedTime: '6h',
    createdAt: new Date('2024-12-20T09:00:00'),
    userName: 'Alice Johnson',
  },
  {
    id: '28',
    title: 'Add keyboard shortcuts',
    estimatedTime: '3h',
    createdAt: new Date('2024-12-19T14:30:00'),
    userName: 'Bob Smith',
  },
  {
    id: '29',
    title: 'Optimize database queries',
    estimatedTime: '5h',
    createdAt: new Date('2024-12-18T10:00:00'),
    userName: 'Charlie Brown',
  },
  {
    id: '30',
    title: 'Create backup strategy',
    estimatedTime: '4h',
    createdAt: new Date('2024-12-17T15:20:00'),
    userName: 'Diana Lee',
  },
]

type SortColumn = 'title' | 'estimatedTime' | 'createdAt' | 'userName'
type SortDirection = 'asc' | 'desc'

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

  const sortedTasks = [...MOCK_TASKS].sort((a, b) => {
    let aValue: string | number | Date = a[sortColumn]
    let bValue: string | number | Date = b[sortColumn]

    if (sortColumn === 'createdAt') {
      aValue = aValue instanceof Date ? aValue.getTime() : aValue
      bValue = bValue instanceof Date ? bValue.getTime() : bValue
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue)
      return sortDirection === 'asc' ? comparison : -comparison
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      const comparison = aValue.getTime() - bValue.getTime()
      return sortDirection === 'asc' ? comparison : -comparison
    }

    return 0
  })

  const startIndex = (page - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const paginatedTasks = sortedTasks.slice(startIndex, endIndex)

  const isFirstPage = page === 1
  const hasNextPage = endIndex < sortedTasks.length

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
            {paginatedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTasks.map((task) => (
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
