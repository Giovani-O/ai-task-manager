import {
  Clock01Icon,
  PencilEdit01Icon,
  PlayIcon,
  SaveIcon,
  Settings04Icon,
  TextIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

export type TaskPreview = {
  title: string
  description: string
  steps: string[]
  estimatedTime: string
  implementationSuggestion: string
  acceptanceCriteria: string[]
  suggestedTests: string[]
}

const CURRENT_TASK_KEY = ['currentTask'] as const

export function useCurrentTask() {
  return useQuery({
    queryKey: CURRENT_TASK_KEY,
    queryFn: () => Promise.resolve(null),
    staleTime: Infinity,
  })
}

export { CURRENT_TASK_KEY }

type TaskPreviewPanelProps = {
  task?: TaskPreview
  isGenerating?: boolean
  onSave?: () => void
  isSaving?: boolean
  mode?: 'save' | 'edit'
}

export function TaskPreviewPanel({
  task: propTask,
  isGenerating = false,
  onSave,
  isSaving = false,
  mode = 'save',
}: TaskPreviewPanelProps) {
  const { data: queryTask } = useCurrentTask()
  const task = propTask ?? queryTask ?? null

  if (isGenerating) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-3 border-b px-6 py-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HugeiconsIcon icon={TextIcon} size={20} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Task Preview
            </h2>
            <p className="text-sm text-muted-foreground">Generating task...</p>
          </div>
        </header>

        <ScrollArea className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </ScrollArea>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-3 border-b px-6 py-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HugeiconsIcon icon={TextIcon} size={20} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Task Preview
            </h2>
            <p className="text-sm text-muted-foreground">Waiting for task</p>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-center text-muted-foreground">
            Describe your task to the agent to start.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <HugeiconsIcon icon={TextIcon} size={20} strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Task Preview</h2>
          <p className="text-sm text-muted-foreground">
            Structured task from AI agent
          </p>
        </div>
      </header>

      <ScrollArea className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <OverviewCard task={task} />
          <StepsCard steps={task.steps} />
          <ImplementationCard suggestion={task.implementationSuggestion} />
          <TestingCard
            acceptanceCriteria={task.acceptanceCriteria}
            suggestedTests={task.suggestedTests}
          />
        </div>
      </ScrollArea>

      {/* Action Button Panel */}
      <div className="border-t p-4">
        {mode === 'edit' ? (
          <Button
            className="h-[49px] w-full rounded-xl text-base cursor-pointer"
            size="default"
          >
            <HugeiconsIcon
              icon={PencilEdit01Icon}
              size={20}
              strokeWidth={1.5}
            />
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
    </div>
  )
}

function OverviewCard({ task }: { task: TaskPreview }) {
  return (
    <Card className="border">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={TextIcon} size={16} strokeWidth={1.5} />
          <CardTitle>Overview</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div>
          <h3 className="font-semibold text-foreground">{task.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {task.description}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon icon={Clock01Icon} size={14} strokeWidth={1.5} />
          <span>Estimated: {task.estimatedTime}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function StepsCard({ steps }: { steps: string[] }) {
  return (
    <Card className="border ">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={PlayIcon} size={16} strokeWidth={1.5} />
          <CardTitle>Steps</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

function ImplementationCard({ suggestion }: { suggestion: string }) {
  return (
    <Card className="border">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Settings04Icon} size={16} strokeWidth={1.5} />
          <CardTitle>Implementation</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{suggestion}</p>
      </CardContent>
    </Card>
  )
}

function TestingCard({
  acceptanceCriteria,
  suggestedTests,
}: {
  acceptanceCriteria: string[]
  suggestedTests: string[]
}) {
  return (
    <Card className="border">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={PlayIcon} size={16} strokeWidth={1.5} />
          <CardTitle>Testing</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Acceptance Criteria
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {acceptanceCriteria.map((criteria) => (
              <li key={crypto.randomUUID()}>{criteria}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Suggested Tests
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {suggestedTests.map((test) => (
              <li key={crypto.randomUUID()}>{test}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  )
}
