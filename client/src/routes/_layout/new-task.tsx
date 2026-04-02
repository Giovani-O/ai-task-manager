import { createFileRoute } from '@tanstack/react-router'
import { ChatPanel } from '@/components/chat-panel'
import { TaskPreviewPanel } from '@/components/task-preview-panel'

export const Route = createFileRoute('/_layout/new-task')({
  beforeLoad: () => ({
    title: 'New Task',
  }),
  component: NewTaskPage,
})

function NewTaskPage() {
  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6">
      <div className="flex h-full min-h-0 flex-1 overflow-hidden rounded-lg border">
        <div className="w-1/2 border-r">
          <ChatPanel />
        </div>
        <div className="w-1/2">
          <TaskPreviewPanel />
        </div>
      </div>
    </div>
  )
}
