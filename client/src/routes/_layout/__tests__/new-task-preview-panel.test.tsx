import { render, screen } from '@testing-library/react'
import { TaskPreviewPanel } from '@/components/task-preview-panel'

describe('TaskPreviewPanel', () => {
  it('renders the placeholder text', () => {
    render(<TaskPreviewPanel />)
    expect(
      screen.getByText('Start a new task by describing it to our agent.'),
    ).toBeInTheDocument()
  })
})
