import { render, screen } from '@testing-library/react'
import { TaskPreviewPanel } from '@/components/task-preview-panel'

describe('TaskPreviewPanel', () => {
  it('renders the header with mock data indicator by default', () => {
    render(<TaskPreviewPanel />)
    expect(screen.getByText('Task Preview')).toBeInTheDocument()
    expect(screen.getByText('Using mock data')).toBeInTheDocument()
  })

  it('renders overview card with task title and description', () => {
    render(<TaskPreviewPanel />)
    expect(screen.getByText('User Authentication System')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Implement a secure user authentication system with login, logout, and session management using JWT tokens.',
      ),
    ).toBeInTheDocument()
  })

  it('renders estimated time', () => {
    render(<TaskPreviewPanel />)
    expect(screen.getByText('Estimated: 4-6 hours')).toBeInTheDocument()
  })

  it('renders steps card with all steps', () => {
    render(<TaskPreviewPanel />)
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
    render(<TaskPreviewPanel />)
    expect(screen.getByText('Implementation')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Use bcrypt for password hashing with salt rounds of 12. Store JWT refresh tokens in httpOnly cookies. Implement rate limiting on login attempts to prevent brute force attacks.',
      ),
    ).toBeInTheDocument()
  })

  it('renders testing card with acceptance criteria and suggested tests', () => {
    render(<TaskPreviewPanel />)
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
    render(<TaskPreviewPanel />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Steps')).toBeInTheDocument()
    expect(screen.getByText('Implementation')).toBeInTheDocument()
    expect(screen.getByText('Testing')).toBeInTheDocument()
  })

  it('renders custom task when provided', () => {
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
    render(<TaskPreviewPanel task={customTask} />)
    expect(screen.getByText('Custom Task')).toBeInTheDocument()
    expect(screen.getByText('Custom description')).toBeInTheDocument()
    expect(screen.getByText('Estimated: 1 hour')).toBeInTheDocument()
    expect(
      screen.getByText('Structured task from AI agent'),
    ).toBeInTheDocument()
  })

  it('renders save task button', () => {
    render(<TaskPreviewPanel />)
    expect(
      screen.getByRole('button', { name: /save task/i }),
    ).toBeInTheDocument()
  })
})
