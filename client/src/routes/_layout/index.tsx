import { createFileRoute } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/_layout/')({
  beforeLoad: () => ({
    title: 'Dashboard',
  }),
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="@container/main flex flex-1 flex-col m-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl">
            Welcome to AI Task Planner
          </CardTitle>
          <CardDescription className="text-base md:text-lg">
            Your intelligent assistant for planning and organizing tasks.
            Leverage AI to break down complex projects into manageable steps,
            prioritize work efficiently, and track your progress all in one
            place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-base md:text-lg text-muted-foreground">
            Start by creating a new task or exploring your existing task list in
            the sidebar.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
