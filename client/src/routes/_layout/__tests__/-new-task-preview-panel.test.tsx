import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { TaskPreviewPanel } from '@/components/task-preview-panel'

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

function renderWithQuery(ui: ReactNode, queryClient = makeQueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('TaskPreviewPanel', () => {
  it('renders fallback text when no task is available', () => {
    renderWithQuery(<TaskPreviewPanel />)
    expect(screen.getByText('Task Preview')).toBeInTheDocument()
    expect(
      screen.getByText('Describe your task to the agent to start.'),
    ).toBeInTheDocument()
  })

  it('renders task data when provided via prop', () => {
    const customTask = {
      title: 'Custom Task',
      description: 'Custom description',
      steps: ['Step 1', 'Step 2'],
      estimatedTime: '1 hour',
      implementationSuggestion: 'Custom suggestion',
      acceptanceCriteria: ['Criteria 1'],
      suggestedTests: ['Test 1'],
      content: 'Custom content',
    }
    renderWithQuery(<TaskPreviewPanel task={customTask} />)
    expect(screen.getByText('Custom Task')).toBeInTheDocument()
    expect(screen.getByText('Custom description')).toBeInTheDocument()
    expect(screen.getByText('Estimated: 1 hour')).toBeInTheDocument()
    expect(
      screen.getByText('Structured task from AI agent'),
    ).toBeInTheDocument()
  })

  it('renders overview card with task title and description', () => {
    const customTask = {
      title: 'User Authentication System',
      description:
        'Implement a secure user authentication system with login, logout, and session management using JWT tokens.',
      steps: [],
      estimatedTime: '4-6 hours',
      implementationSuggestion: 'Use bcrypt',
      acceptanceCriteria: [],
      suggestedTests: [],
      content: 'Full-stack authentication',
    }
    renderWithQuery(<TaskPreviewPanel task={customTask} />)
    expect(screen.getByText('User Authentication System')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Implement a secure user authentication system with login, logout, and session management using JWT tokens.',
      ),
    ).toBeInTheDocument()
  })

  it('renders estimated time', () => {
    const customTask = {
      title: 'Task',
      description: 'Description',
      steps: [],
      estimatedTime: '4-6 hours',
      implementationSuggestion: 'Suggestion',
      acceptanceCriteria: [],
      suggestedTests: [],
      content: 'Content',
    }
    renderWithQuery(<TaskPreviewPanel task={customTask} />)
    expect(screen.getByText('Estimated: 4-6 hours')).toBeInTheDocument()
  })

  it('renders steps card with all steps', () => {
    const customTask = {
      title: 'Task',
      description: 'Description',
      steps: [
        'Set up database schema for users table with encrypted password field',
        'Implement session refresh mechanism',
      ],
      estimatedTime: '4 hours',
      implementationSuggestion: 'Suggestion',
      acceptanceCriteria: [],
      suggestedTests: [],
      content: 'Content',
    }
    renderWithQuery(<TaskPreviewPanel task={customTask} />)
    expect(screen.getByText('Steps')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Set up database schema for users table with encrypted password field',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Implement session refresh mechanism'),
    ).toBeInTheDocument()
  })

  it('renders implementation card with suggestion', () => {
    const customTask = {
      title: 'Task',
      description: 'Description',
      steps: [],
      estimatedTime: '4 hours',
      implementationSuggestion:
        'Use bcrypt for password hashing with salt rounds of 12. Store JWT refresh tokens in httpOnly cookies. Implement rate limiting on login attempts to prevent brute force attacks.',
      acceptanceCriteria: [],
      suggestedTests: [],
      content: 'Content',
    }
    renderWithQuery(<TaskPreviewPanel task={customTask} />)
    expect(screen.getByText('Implementation')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Use bcrypt for password hashing with salt rounds of 12. Store JWT refresh tokens in httpOnly cookies. Implement rate limiting on login attempts to prevent brute force attacks.',
      ),
    ).toBeInTheDocument()
  })

  it('renders testing card with acceptance criteria and suggested tests', () => {
    const customTask = {
      title: 'Task',
      description: 'Description',
      steps: [],
      estimatedTime: '4 hours',
      implementationSuggestion: 'Suggestion',
      acceptanceCriteria: ['Users can register with email and password'],
      suggestedTests: ['Test user registration with valid/invalid inputs'],
      content: 'Content',
    }
    renderWithQuery(<TaskPreviewPanel task={customTask} />)
    expect(screen.getByText('Testing')).toBeInTheDocument()
    expect(screen.getByText('Acceptance Criteria')).toBeInTheDocument()
    expect(screen.getByText('Suggested Tests')).toBeInTheDocument()
    expect(
      screen.getByText('Users can register with email and password'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Test user registration with valid/invalid inputs'),
    ).toBeInTheDocument()
  })

  it('renders all card sections', () => {
    const customTask = {
      title: 'Task',
      description: 'Description',
      steps: ['Step 1'],
      estimatedTime: '4 hours',
      implementationSuggestion: 'Suggestion',
      acceptanceCriteria: ['Criteria 1'],
      suggestedTests: ['Test 1'],
      content: 'Content',
    }
    renderWithQuery(<TaskPreviewPanel task={customTask} />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Steps')).toBeInTheDocument()
    expect(screen.getByText('Implementation')).toBeInTheDocument()
    expect(screen.getByText('Testing')).toBeInTheDocument()
  })

  it('renders save task button', () => {
    const customTask = {
      title: 'Task',
      description: 'Description',
      steps: [],
      estimatedTime: '4 hours',
      implementationSuggestion: 'Suggestion',
      acceptanceCriteria: [],
      suggestedTests: [],
      content: 'Content',
    }
    renderWithQuery(<TaskPreviewPanel task={customTask} />)
    expect(
      screen.getByRole('button', { name: /save task/i }),
    ).toBeInTheDocument()
  })

  it('renders skeletons when isGenerating is true', () => {
    renderWithQuery(<TaskPreviewPanel isGenerating={true} />)
    expect(screen.getByText('Task Preview')).toBeInTheDocument()
    expect(screen.getByText('Generating task...')).toBeInTheDocument()
    const skeletons = screen.getAllByText((_content, element) => {
      return element?.getAttribute('data-slot') === 'skeleton'
    })
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
