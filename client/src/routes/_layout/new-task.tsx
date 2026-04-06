import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { lazy, Suspense, useState } from 'react'
import { toast } from 'sonner'
import type { GeneratedTask } from '@/components/chat-panel'
import { CURRENT_TASK_KEY } from '@/components/task-preview-panel'

const ChatPanel = lazy(() =>
  import('@/components/chat-panel').then((m) => ({ default: m.ChatPanel })),
)
const TaskPreviewPanel = lazy(() =>
  import('@/components/task-preview-panel').then((m) => ({
    default: m.TaskPreviewPanel,
  })),
)

export const Route = createFileRoute('/_layout/new-task')({
  beforeLoad: () => ({
    title: 'New Task',
  }),
  component: NewTaskPage,
})

function NewTaskPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  async function handleSave() {
    const task = queryClient.getQueryData<GeneratedTask>(CURRENT_TASK_KEY)
    if (!task || !chatId) return

    setIsSaving(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          title: task.title,
          description: task.description,
          steps: task.steps,
          estimatedTime: task.estimatedTime,
          implementationSuggestion: task.implementationSuggestion,
          acceptanceCriteria: task.acceptanceCriteria,
          suggestedTests: task.suggestedTests,
        }),
      })

      if (!response.ok) throw new Error('Failed to save task')

      toast.success('Task saved successfully')
      navigate({ to: '/tasks' })
    } catch {
      toast.error('Failed to save task. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6 max-h-[calc(100vh-64px)]">
      <div className="flex h-full min-h-0 flex-1 overflow-hidden rounded-lg border ">
        <div className="w-1/2 border-r">
          <Suspense
            fallback={
              <div className="p-4 w-full h-full flex items-center justify-center">
                Loading chat...
              </div>
            }
          >
            <ChatPanel
              onGeneratingChange={setIsGenerating}
              onChatCreated={setChatId}
            />
          </Suspense>
        </div>
        <div className="w-1/2">
          <Suspense
            fallback={
              <div className="p-4 w-full h-full flex items-center justify-center">
                Loading preview...
              </div>
            }
          >
            <TaskPreviewPanel
              isGenerating={isGenerating}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
