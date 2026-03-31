# Layout Route Extraction Design

**Date:** 2026-03-31  
**Status:** Approved  

## Problem

The dashboard page (`client/src/routes/index.tsx`) contains the full application shell (sidebar, header, content area) mixed with page-specific content. This structure needs to be extracted into a reusable layout so other pages can share the same shell while providing their own content and page titles.

## Requirements

1. **Reusable layout shell** — Sidebar, header, and content container extracted from the index route
2. **Dynamic page titles** — Each page provides its own title displayed in the header
3. **Sidebar state persistence** — Sidebar open/closed state persists across navigation and browser sessions via localStorage

## Solution: TanStack Router Layout Route

Use TanStack Router's layout route pattern with a `_layout.tsx` file that wraps all routes requiring the application shell.

### File Structure

```
client/src/routes/
├── __root.tsx         # (unchanged) root outlet
├── _layout.tsx        # NEW: layout shell with sidebar/header
└── _layout/
    └── index.tsx      # MOVED: dashboard page content
```

### Layout Route (`_layout.tsx`)

The layout route provides:
- `<AppSidebar>` with inset variant
- `<SidebarInset>` wrapper
- `<SiteHeader>` with dynamic title from route context
- Content outlet for child routes

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

### Page Route (`_layout/index.tsx`)

Dashboard page provides its title via the `beforeLoad` hook:

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

### SiteHeader Component Update

Modify `SiteHeader` to accept `title` as a prop instead of hardcoding "Documents":

```tsx
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

### Sidebar Persistence

The shadcn Sidebar component already supports localStorage persistence via the `storageKey` prop. Ensure `AppSidebar` uses:

```tsx
<Sidebar collapsible="offcanvas" storageKey="sidebar-state" {...props}>
```

This makes the sidebar open/closed state persist across sessions using the key `sidebar-state`.

## Implementation Tasks

1. Create `client/src/routes/_layout.tsx` with layout shell
2. Create `client/src/routes/_layout/` directory
3. Move `client/src/routes/index.tsx` to `client/src/routes/_layout/index.tsx`
4. Update `_layout/index.tsx` to use `beforeLoad` for title and remove shell markup
5. Update `SiteHeader` component to accept `title` prop
6. Verify `AppSidebar` has `storageKey="sidebar-state"` for persistence
7. Run `pnpm --filter client dev` to regenerate route tree and test
