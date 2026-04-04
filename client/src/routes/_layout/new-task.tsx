import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense, useState } from 'react'

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
            <ChatPanel onGeneratingChange={setIsGenerating} />
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
            <TaskPreviewPanel isGenerating={isGenerating} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
