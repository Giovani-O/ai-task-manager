import { AiMagicIcon, User03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { CURRENT_TASK_KEY } from './task-preview-panel'

export type GeneratedTask = {
  id: string
  authorId: string
  chatId: string
  title: string
  description: string
  steps: string[]
  estimatedTime: string
  implementationSuggestion: string
  acceptanceCriteria: string[]
  suggestedTests: string[]
  content: string
  chatHistory: unknown[]
  createdAt: string
  updatedAt: string
}

type TaskInitialData = {
  title: string
  description: string
  steps: string[]
  estimatedTime: string
  implementationSuggestion: string
  acceptanceCriteria: string[]
  suggestedTests: string[]
}

type MessageRole = 'user' | 'agent'

type Message = {
  id: string
  role: MessageRole
  text: string
}

type ChatPanelProps = {
  onGeneratingChange?: (isGenerating: boolean) => void
}

export function ChatPanel({ onGeneratingChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((data: { chatId: string }) => setChatId(data.chatId))
      .catch(() => {
        // chat creation failed — messages will fail gracefully
      })
  }, [])

  const mutation = useMutation({
    mutationKey: ['send-message'],
    mutationFn: async (message: string) => {
      if (!chatId) throw new Error('Chat session not ready')
      const currentTask =
        queryClient.getQueryData<GeneratedTask>(CURRENT_TASK_KEY)
      const taskBody: TaskInitialData | undefined = currentTask
        ? {
            title: currentTask.title,
            description: currentTask.description,
            steps: currentTask.steps,
            estimatedTime: currentTask.estimatedTime,
            implementationSuggestion: currentTask.implementationSuggestion,
            acceptanceCriteria: currentTask.acceptanceCriteria,
            suggestedTests: currentTask.suggestedTests,
          }
        : undefined
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/chats/${chatId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, task: taskBody }),
        },
      )
      if (!response.ok) throw new Error('Failed to send message')
      return response.json() as Promise<{ task: GeneratedTask; reply: string }>
    },
    onMutate: () => {
      onGeneratingChange?.(true)
    },
    onSuccess: (data) => {
      const agentMessage: Message = {
        id: crypto.randomUUID(),
        role: 'agent',
        text: data.reply,
      }
      setMessages((prev) => [...prev, agentMessage])
      queryClient.setQueryData(CURRENT_TASK_KEY, data.task)
      onGeneratingChange?.(false)
    },
    onError: () => {
      onGeneratingChange?.(false)
    },
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: messages is used as a trigger to scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        '[data-slot="scroll-area-viewport"]',
      )
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [messages])

  // biome-ignore lint/correctness/useExhaustiveDependencies: input is used as a trigger to resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || mutation.isPending) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    mutation.mutate(trimmed)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <HugeiconsIcon icon={AiMagicIcon} size={20} strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Task Agent</h2>
          <p className="text-sm text-muted-foreground">
            {mutation.isPending ? 'Thinking...' : 'Ready to help'}
          </p>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={AiMagicIcon} size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">
                Describe your task
              </h3>
              <p className="mt-2 max-w-md text-muted-foreground">
                Tell me what you need built and I&apos;ll help you refine it
                into a structured task.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {mutation.isPending &&
            messages.length > 0 &&
            messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-4">
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <HugeiconsIcon
                      icon={AiMagicIcon}
                      size={16}
                      strokeWidth={1.5}
                    />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-3">
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50" />
                </div>
              </div>
            )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your task..."
              disabled={mutation.isPending}
              rows={1}
              className={cn(
                'w-full resize-none rounded-xl border bg-card px-4 py-3 text-base shadow-sm transition-all',
                'placeholder:text-muted-foreground',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                'disabled:cursor-not-allowed disabled:opacity-50 scrollbar-hide',
              )}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || mutation.isPending}
            className="size-12 shrink-0 rounded-xl cursor-pointer"
            aria-label="Send message"
          >
            <HugeiconsIcon icon={AiMagicIcon} size={20} strokeWidth={1.5} />
          </Button>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex w-full gap-4', isUser && 'flex-row-reverse')}>
      <Avatar className="size-9 shrink-0">
        <AvatarFallback
          className={cn(
            isUser
              ? 'bg-secondary text-secondary-foreground'
              : 'bg-primary text-primary-foreground',
          )}
        >
          {isUser ? (
            <HugeiconsIcon icon={User03Icon} size={16} strokeWidth={1.5} />
          ) : (
            <HugeiconsIcon icon={AiMagicIcon} size={16} strokeWidth={1.5} />
          )}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'min-w-0 max-w-[85%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground',
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">
          {message.text}
        </p>
      </div>
    </div>
  )
}
