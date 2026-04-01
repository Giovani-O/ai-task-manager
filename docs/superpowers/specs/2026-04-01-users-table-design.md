# Users Table with Pagination - Design Spec

## Overview

Implement a read-only users table with client-side pagination in the client application. The table will display user data (name, email, lastLogin) fetched from the API endpoint. UI tests will be introduced for the first time.

## API Changes

### Endpoint: `GET /users`

**File:** `api/src/routes/list-users.ts`

**Changes:**
- Replace `createdAt` with `lastLogin` in the select query and response schema
- `lastLogin` is nullable in the database, so the response must reflect `Date | null`

**Updated response schema:**
```ts
response: {
  200: z.object({
    users: z.array(
      createSelectSchema(users).pick({
        id: true,
        name: true,
        email: true,
        lastLogin: true,
      })
    ),
    page: z.number(),
    pageSize: z.number(),
  }),
}
```

**Updated select query:**
```ts
const result = await app.db
  .select({
    id: users.id,
    name: users.name,
    email: users.email,
    lastLogin: users.lastLogin,
  })
  .from(users)
  .orderBy(desc(users.id))
  .limit(pageSize)
  .offset(offset)
```

### Test Updates

**File:** `api/src/tests/routes/lists-users.test.ts`

**Changes:**
- Update response assertions to check for `lastLogin` field instead of `createdAt`
- Add test case for user with `null` `lastLogin` value

## Client Implementation

### Users Route

**File:** `client/src/routes/_layout/users.tsx`

**Data Loading:**
- Use TanStack Router's `loader` to fetch users from the API endpoint
- Loader returns the full response: `{ users: User[], page: number, pageSize: number }`

**Component Structure:**

1. **Table Component:**
   - Use shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` components
   - Three columns: Name, Email, Last Login
   - Last Login formatted as `DD/MM/YYYY HH:MM`

2. **Pagination Component:**
   - Use shadcn `Pagination` component (already installed at `client/src/components/ui/pagination.tsx`)
   - Client-side pagination: all users loaded at once
   - State: `currentPage` (number), `pageSize` (number, default: 10)
   - Calculate: `totalPages = Math.ceil(users.length / pageSize)`
   - Slice users for current page: `users.slice((currentPage - 1) * pageSize, currentPage * pageSize)`

3. **Date Formatting Helper:**
   - Create a utility function to format dates as `DD/MM/YYYY HH:MM`
   - Handle `null` values gracefully (display "—" or similar)

**Type Definition:**
```ts
type User = {
  id: string
  name: string
  email: string
  lastLogin: Date | null
}
```

### Date Formatting Utility

**File:** `client/src/lib/format-date.ts`

**Dependency:** `date-fns` for date formatting

Install with:
```bash
pnpm --filter client add date-fns
```

**Function:**
```ts
import { format } from 'date-fns'

export function formatDateTime(date: Date | null): string {
  if (!date) return '—'
  return format(date, 'dd/MM/yyyy HH:mm')
}
```

## UI Testing Setup

### Test Dependencies

The following dependencies are needed for UI testing:
- `@testing-library/react` - React testing utilities
- `@testing-library/user-event` - User interaction simulation

Install with:
```bash
pnpm --filter client add -D @testing-library/react @testing-library/user-event
```

Note: `vitest` and `@testing-library/jest-dom` are already installed.

### Test File Structure

**File:** `client/src/routes/_layout/users.test.tsx`

Tests will be co-located with the component file.

### Test Cases

1. **Renders table headers correctly**
   - Verify "Name", "Email", "Last Login" column headers are displayed

2. **Displays user data correctly**
   - Render table with mock user data
   - Verify user name and email appear in the table

3. **Formats lastLogin correctly**
   - Render table with user having a valid `lastLogin` date
   - Verify date is formatted as `DD/MM/YYYY HH:MM`
   - Render table with user having `null` `lastLogin`
   - Verify placeholder ("—") is displayed

4. **Pagination controls work**
   - Render table with more users than fit on one page
   - Verify pagination shows correct page count
   - Click "Next" button, verify page changes
   - Click "Previous" button, verify page changes

### Test Setup Pattern

Tests will use a simple render helper that provides mock data:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UsersTable } from './users'

const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', lastLogin: new Date('2026-04-01T10:30:00') },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', lastLogin: null },
]

describe('UsersTable', () => {
  it('renders table headers', () => {
    render(<UsersTable users={mockUsers} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Last Login')).toBeInTheDocument()
  })
})
```

## Implementation Order

1. Update API endpoint to return `lastLogin` instead of `createdAt`
2. Update API tests to reflect the change
3. Install `date-fns` in client workspace
4. Create date formatting utility in `client/src/lib/format-date.ts`
5. Implement users table component with pagination in `client/src/routes/_layout/users.tsx`
6. Install UI testing dependencies
7. Write UI tests for the users table component
8. Run all tests to verify implementation

## Acceptance Criteria

- [ ] API returns `lastLogin` field in user response
- [ ] API tests pass with updated assertions
- [ ] Users table displays name, email, and formatted lastLogin
- [ ] lastLogin displays `DD/MM/YYYY HH:MM` format or "—" for null
- [ ] Pagination controls allow navigating between pages
- [ ] UI tests pass covering all test cases
- [ ] `pnpm check` passes with no errors
