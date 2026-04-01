# Design: Users Component Test Refactor

**Date:** 2026-04-01  
**Status:** Approved  
**Scope:** `client/src/routes/_layout/users.tsx` and its test file

---

## Problem

`client/src/routes/_layout/__tests__/users.test.tsx` defines an inline `UsersTable`
component — a re-implementation of the actual `RouteComponent` in `users.tsx` — instead
of importing and testing the real component. This means:

- Bugs in the real component are invisible to the test suite
- The inline `formatDateTime` is a copy of `@/lib/format-date`, not the real utility
- The inline pagination uses plain `<button>` elements with `data-testid`, not the real
  shadcn `Pagination` component

The API test file (`api/src/tests/routes/lists-users.test.ts`) is correctly written and
is out of scope.

---

## Approach

**Approach A — Extract component with explicit props.**

Promote `RouteComponent` to a named export `UsersPage` that accepts `users: User[]` as
props. `RouteComponent` becomes a thin adapter that reads from `Route.useLoaderData()`
and passes the result down. Tests import and render `UsersPage` directly with no router
context, no fetch mocking, and no env var setup.

---

## Source Refactor (`users.tsx`)

### Exported type

Promote `User` to a named export so the test file can import the type without
duplication:

```ts
export type User = {
  id: string
  name: string
  email: string
  lastLogin: string | null
}
```

### Component signature

Rename `RouteComponent` to `UsersPage` and export it as a named export accepting
explicit props:

```ts
export function UsersPage({ users }: { users: User[] }) {
  // all existing rendering logic, unchanged
}
```

### Route wiring

`RouteComponent` becomes a one-liner adapter:

```ts
export const Route = createFileRoute('/_layout/users')({
  component: function RouteComponent() {
    const { users } = Route.useLoaderData()
    return <UsersPage users={users} />
  },
  loader: async () => {
    // unchanged
  },
})
```

The loader is unchanged. `RouteComponent` is internal to the route and not exported.

---

## Test Refactor (`users.test.tsx`)

### What is deleted

- The entire inline `UsersTable` component definition
- The local `formatDateTime` re-implementation inside the test file
- All `data-testid` queries that target the inline component's plain `<button>` elements

### What replaces it

Import `UsersPage` and `type User` from the source file:

```ts
import { UsersPage, type User } from '../users'
```

All tests call `render(<UsersPage users={mockUsers} />)` against the real component.

### Test cases

| Test | Assertion |
|---|---|
| Renders table headers | `getByRole('columnheader', { name: /name/i })` etc. |
| Displays user name and email | `getByText('John Doe')`, `getByText('john@example.com')` |
| Formats `lastLogin` via real `formatDateTime` | `getByText('01/04/2026 10:30')` |
| Null `lastLogin` renders `—` | `getAllByText('—').length > 0` |
| No pagination when ≤10 users | `queryByRole('navigation')` is null |
| Pagination renders when >10 users | `getByRole('navigation')` is present |
| Next navigates to next page | click next link → first-page users no longer visible |
| Prev navigates to previous page | click next then prev → first-page users visible again |
| Prev is disabled on first page | `getByRole('link', { name: /previous/i })` has `aria-disabled="true"` |
| Next is disabled on last page | navigate to last page → next link has `aria-disabled="true"` |
| Ellipsis appears for large page counts | render 25+ users → `getByText('More pages')` (shadcn `PaginationEllipsis` sr-only label) |

### Querying strategy

The real pagination uses shadcn `Pagination` components which render as `<a>` elements
with accessible labels. Queries use accessible roles and text content:

- `screen.getByRole('link', { name: /previous/i })`
- `screen.getByRole('link', { name: /next/i })`
- `screen.getByRole('link', { name: '2' })` for page number links

### `aria-disabled` vs `disabled`

The real `PaginationPrevious` and `PaginationNext` use `aria-disabled` + CSS
`pointer-events-none` rather than the HTML `disabled` attribute. Tests assert:

```ts
expect(prevLink).toHaveAttribute('aria-disabled', 'true')
```

Not `toBeDisabled()`.

---

## Out of Scope

- The loader (`fetch` call, `VITE_API_URL`, error path) — integration/E2E territory
- `formatDateTime` unit tests — simple function, covered implicitly through the component
- `api/src/tests/routes/lists-users.test.ts` — correctly tests the backend route, no changes needed
- Any other route files
