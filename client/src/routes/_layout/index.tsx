import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/')({
  beforeLoad: () => ({
    title: 'Dashboard',
  }),
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <p>Dashboard Placeholder</p>
      </div>
    </div>
  )
}
