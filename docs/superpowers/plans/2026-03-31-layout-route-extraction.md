# Layout Route Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the application shell (sidebar, header) from the dashboard page into a reusable TanStack Router layout route.

**Architecture:** Create a `_layout.tsx` layout route that wraps child routes with AppSidebar, SidebarInset, and SiteHeader. Child routes provide their page title via route context and render only their page content.

**Tech Stack:** TanStack Router, React 19, TypeScript, shadcn/ui Sidebar

---

## File Structure

```
client/src/routes/
├── __root.tsx           # (unchanged) root outlet
├── _layout.tsx          # NEW: layout shell
└── _layout/
    └── index.tsx        # MOVED from routes/index.tsx

client/src/components/
├── site-header.tsx      # MODIFY: add title prop
└── app-sidebar.tsx      # MODIFY: add storageKey
```

---

### Task 1: Update SiteHeader Component

**Files:**
- Modify: `client/src/components/site-header.tsx`

- [ ] **Step 1: Add title prop to SiteHeader**

Update the function signature and replace the hardcoded "Documents" text:

```tsx
import { MoonIcon, SunIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function SiteHeader({ title }: { title: string }) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <HugeiconsIcon
              icon={theme === 'dark' ? MoonIcon : SunIcon}
              strokeWidth={2}
              className="size-5"
            />
          </Button>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/site-header.tsx
git commit -m "refactor(site-header): add title prop for dynamic page titles"
```

---

### Task 2: Add Sidebar Persistence

**Files:**
- Modify: `client/src/components/app-sidebar.tsx:151`

- [ ] **Step 1: Add storageKey prop to Sidebar**

Change line 151 from:

```tsx
<Sidebar collapsible="offcanvas" {...props}>
```

To:

```tsx
<Sidebar collapsible="offcanvas" storageKey="sidebar-state" {...props}>
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/app-sidebar.tsx
git commit -m "feat(sidebar): add localStorage persistence for sidebar state"
```

---

### Task 3: Create Layout Route

**Files:**
- Create: `client/src/routes/_layout.tsx`

- [ ] **Step 1: Create the layout route file**

Create `client/src/routes/_layout.tsx` with the following content:

```tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset } from '@/components/ui/sidebar'

export const Route = createFileRoute('/_layout')({
  component: LayoutComponent,
})

function LayoutComponent() {
  const { title } = Route.useRouteContext()
  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title={title} />
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </SidebarInset>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/routes/_layout.tsx
git commit -m "feat(routes): add layout route for application shell"
```

---

### Task 4: Move Dashboard Page to Layout

**Files:**
- Create: `client/src/routes/_layout/index.tsx`
- Delete: `client/src/routes/index.tsx`

- [ ] **Step 1: Create _layout directory**

```bash
mkdir -p client/src/routes/_layout
```

- [ ] **Step 2: Create the dashboard page under layout route**

Create `client/src/routes/_layout/index.tsx` with the following content:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import data from '@/app/dashboard/data.json'
import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { DataTable } from '@/components/data-table'
import { SectionCards } from '@/components/section-cards'

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
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <DataTable data={data} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Delete the old index.tsx**

```bash
rm client/src/routes/index.tsx
```

- [ ] **Step 4: Commit**

```bash
git add client/src/routes/_layout/index.tsx
git rm client/src/routes/index.tsx
git commit -m "refactor(routes): move dashboard to layout route, add dynamic title"
```

---

### Task 5: Verify and Test

- [ ] **Step 1: Start client dev server to regenerate route tree**

```bash
pnpm --filter client dev
```

Wait for the route tree to regenerate. Check that:
1. `client/src/routeTree.gen.ts` is updated with new routes
2. No TypeScript errors in terminal
3. App loads at `http://localhost:5173/` showing dashboard with sidebar

- [ ] **Step 2: Run format check**

```bash
pnpm check
```

If formatting issues, run:

```bash
pnpm format
```

- [ ] **Step 3: Verify functionality**

Manually test in browser:
1. Navigate to `/` — should show dashboard with "Dashboard" title in header
2. Toggle sidebar open/closed — state should persist on page refresh
3. Theme toggle should work in header

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add .
git commit -m "fix: address formatting and type issues from layout extraction"
```
