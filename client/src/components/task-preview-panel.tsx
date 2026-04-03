import {
  Clock01Icon,
  PlayIcon,
  SaveIcon,
  Settings04Icon,
  TextIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

type TaskPreview = {
  title: string
  description: string
  steps: string[]
  estimatedTime: string
  implementationSuggestion: string
  acceptanceCriteria: string[]
  suggestedTests: string[]
  content: string
}

const mockTask: TaskPreview = {
  title: 'User Authentication System',
  description:
    'Implement a secure user authentication system with login, logout, and session management using JWT tokens.',
  steps: [
    'Set up database schema for users table with encrypted password field',
    'Create registration endpoint with password validation',
    'Implement login endpoint with JWT token generation',
    'Add authentication middleware to protect routes',
    'Implement session refresh mechanism',
  ],
  estimatedTime: '4-6 hours',
  implementationSuggestion:
    'Use bcrypt for password hashing with salt rounds of 12. Store JWT refresh tokens in httpOnly cookies. Implement rate limiting on login attempts to prevent brute force attacks.',
  acceptanceCriteria: [
    'Users can register with email and password',
    'Users can log in and receive JWT tokens',
    'Protected routes require valid JWT',
    'Passwords are hashed with bcrypt',
    'Login attempts are rate-limited',
  ],
  suggestedTests: [
    'Test user registration with valid/invalid inputs',
    'Test login with correct and incorrect credentials',
    'Test JWT token validation on protected routes',
    'Test rate limiting on failed login attempts',
  ],
  content: 'Full-stack authentication with JWT and bcrypt',
}

interface TaskPreviewPanelProps {
  task?: TaskPreview
}

export function TaskPreviewPanel({ task }: TaskPreviewPanelProps) {
  const displayTask = task ?? mockTask

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <HugeiconsIcon icon={TextIcon} size={20} strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Task Preview</h2>
          <p className="text-sm text-muted-foreground">
            {task ? 'Structured task from AI agent' : 'Using mock data'}
          </p>
        </div>
      </header>

      <ScrollArea className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <OverviewCard task={displayTask} />
          <StepsCard steps={displayTask.steps} />
          <ImplementationCard
            suggestion={displayTask.implementationSuggestion}
          />
          <TestingCard
            acceptanceCriteria={displayTask.acceptanceCriteria}
            suggestedTests={displayTask.suggestedTests}
          />
        </div>
      </ScrollArea>

      {/* Save Button Panel */}
      <div className="border-t p-4">
        <Button
          className="h-[49px] w-full rounded-xl text-base cursor-pointer"
          size="default"
        >
          <HugeiconsIcon icon={SaveIcon} size={20} strokeWidth={1.5} />
          <span className="ml-2">Save Task</span>
        </Button>
      </div>
    </div>
  )
}

function OverviewCard({ task }: { task: TaskPreview }) {
  return (
    <Card>
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
    <Card>
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
    <Card>
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
    <Card>
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
