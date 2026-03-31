# Project Initialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the `ai-task-manager` monorepo with a fully configured frontend (`client/`) and backend (`api/`), all dependencies installed, no features implemented.

**Architecture:** pnpm workspaces at the root tie together two workspace packages (`client/` and `api/`). Biome is installed globally at the root and extended by each workspace. The frontend uses Vite + React with Tanstack Router and Query; the backend uses Fastify with TypeScript via tsx.

**Tech Stack:** pnpm workspaces, Biome 2.4.9, Node.js 22, Vite, React, Tanstack Router, Tanstack Query, Shadcn/ui, Hugeicons, Fastify, Drizzle ORM, pg, Zod, tsx, Vitest, Docker (postgres:17)

---

## File Map

### Root
- Create: `.nvmrc`
- Create: `.gitignore`
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `biome.json`

### `api/`
- Create: `api/package.json`
- Create: `api/tsconfig.json`
- Create: `api/biome.json`
- Create: `api/docker-compose.yml`
- Create: `api/.env.example`
- Create: `api/drizzle.config.ts`
- Create: `api/src/index.ts`
- Create: `api/src/db/schema.ts`

### `client/`
- Scaffold: `client/` via `pnpm create vite@latest`
- Modify: `client/vite.config.ts` — add path alias + Tanstack Router plugin
- Modify: `client/tsconfig.app.json` — add path alias
- Create: `client/biome.json`
- Create: `client/.env.example`
- Create: `client/vitest.config.ts`
- Create: `client/src/test/setup.ts`
- Replace: `client/src/main.tsx` — add Router + QueryClient providers
- Create: `client/src/routes/__root.tsx`
- Create: `client/src/routes/index.tsx`

---

## Task 1: Root Monorepo Scaffold

**Files:**
- Create: `.nvmrc`
- Create: `.gitignore`
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `biome.json`

- [ ] **Step 1: Create `.nvmrc`**

  ```
  22
  ```

- [ ] **Step 2: Create `.gitignore`**

  ```
  node_modules/
  dist/
  .env
  !.env.example
  .DS_Store
  *.local
  ```

- [ ] **Step 3: Create `pnpm-workspace.yaml`**

  ```yaml
  packages:
    - 'client'
    - 'api'
  ```

- [ ] **Step 4: Create root `package.json`**

  ```json
  {
    "name": "ai-task-manager",
    "private": true,
    "engines": {
      "node": ">=22"
    },
    "scripts": {
      "lint": "biome lint ./client/src ./api/src",
      "format": "biome format --write ./client/src ./api/src",
      "check": "biome check --write ./client/src ./api/src"
    },
    "devDependencies": {
      "@biomejs/biome": "2.4.9"
    }
  }
  ```

- [ ] **Step 5: Create root `biome.json`**

  ```json
  {
    "$schema": "https://biomejs.dev/schemas/2.4.9/schema.json",
    "formatter": {
      "enabled": true,
      "indentStyle": "space",
      "indentWidth": 2,
      "lineWidth": 80
    },
    "javascript": {
      "formatter": {
        "quoteStyle": "single",
        "semicolons": "asNeeded"
      }
    }
  }
  ```

- [ ] **Step 6: Install root dependencies**

  Run from repo root:
  ```bash
  pnpm install
  ```

  Expected: `node_modules/` created at root, `@biomejs/biome` installed.

- [ ] **Step 7: Commit**

  ```bash
  git add .nvmrc .gitignore pnpm-workspace.yaml package.json biome.json pnpm-lock.yaml
  git commit -m "chore: initialize monorepo with pnpm workspaces and Biome"
  ```

---

## Task 2: Backend Project Setup

**Files:**
- Create: `api/package.json`
- Create: `api/tsconfig.json`
- Create: `api/biome.json`
- Create: `api/docker-compose.yml`
- Create: `api/.env.example`

- [ ] **Step 1: Create `api/package.json`**

  ```json
  {
    "name": "api",
    "version": "1.0.0",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "tsx watch src/index.ts",
      "build": "tsc",
      "test": "vitest run",
      "test:watch": "vitest",
      "lint": "biome lint ./src",
      "format": "biome format --write ./src",
      "check": "biome check --write ./src",
      "db:generate": "drizzle-kit generate",
      "db:migrate": "drizzle-kit migrate",
      "db:studio": "drizzle-kit studio"
    },
    "dependencies": {
      "@fastify/cors": "^11.0.0",
      "@fastify/swagger": "^9.0.0",
      "@scalar/fastify-api-reference": "^1.25.0",
      "dotenv": "^16.0.0",
      "drizzle-orm": "^0.38.0",
      "fastify": "^5.0.0",
      "fastify-type-provider-zod": "^4.0.0",
      "pg": "^8.0.0",
      "zod": "^3.0.0"
    },
    "devDependencies": {
      "@biomejs/biome": "2.4.9",
      "@types/node": "^22.0.0",
      "@types/pg": "^8.0.0",
      "drizzle-kit": "^0.30.0",
      "tsx": "^4.0.0",
      "typescript": "^5.0.0",
      "vitest": "^2.0.0"
    }
  }
  ```

- [ ] **Step 2: Create `api/tsconfig.json`**

  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "Bundler",
      "lib": ["ES2022"],
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "outDir": "./dist",
      "baseUrl": ".",
      "paths": {
        "@/*": ["src/*"]
      }
    },
    "include": ["src/**/*", "drizzle.config.ts"],
    "exclude": ["node_modules", "dist"]
  }
  ```

- [ ] **Step 3: Create `api/biome.json`**

  ```json
  {
    "$schema": "https://biomejs.dev/schemas/2.4.9/schema.json",
    "extends": ["../biome.json"]
  }
  ```

- [ ] **Step 4: Create `api/docker-compose.yml`**

  ```yaml
  services:
    postgres:
      image: postgres:17
      container_name: ai-task-manager
      environment:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: ai_task_manager
      ports:
        - "5432:5432"
      volumes:
        - pgdata:/var/lib/postgresql/data

  volumes:
    pgdata:
  ```

- [ ] **Step 5: Create `api/.env.example`**

  ```
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_task_manager
  GEMINI_API_KEY=
  ```

- [ ] **Step 6: Install api dependencies**

  Run from repo root:
  ```bash
  pnpm install --filter api
  ```

  Expected: `api/node_modules/` populated with all dependencies listed above.

- [ ] **Step 7: Commit**

  ```bash
  git add api/
  git commit -m "chore: initialize api workspace with Fastify, Drizzle, and tooling"
  ```

---

## Task 3: Backend Source Files

**Files:**
- Create: `api/src/index.ts`
- Create: `api/src/db/schema.ts`
- Create: `api/drizzle.config.ts`

- [ ] **Step 1: Create `api/src/db/schema.ts`**

  ```typescript
  // Database schema — tables will be added here as features are developed
  ```

- [ ] **Step 2: Create `api/drizzle.config.ts`**

  ```typescript
  import 'dotenv/config'
  import { defineConfig } from 'drizzle-kit'

  export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
      url: process.env.DATABASE_URL!,
    },
  })
  ```

- [ ] **Step 3: Create `api/src/index.ts`**

  ```typescript
  import 'dotenv/config'
  import Fastify from 'fastify'
  import cors from '@fastify/cors'
  import swagger from '@fastify/swagger'
  import scalarApiReference from '@scalar/fastify-api-reference'
  import {
    serializerCompiler,
    validatorCompiler,
  } from 'fastify-type-provider-zod'

  const app = Fastify({ logger: true })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(cors, {
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  })

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'AI Task Manager API',
        version: '1.0.0',
      },
    },
  })

  await app.register(scalarApiReference, {
    routePrefix: '/reference',
  })

  app.get('/health', async () => ({ status: 'ok' }))

  await app.listen({ port: 3333, host: '0.0.0.0' })
  ```

- [ ] **Step 4: Verify the backend starts**

  Create a `.env` file in `api/` from the example (do not commit it):
  ```bash
  cp api/.env.example api/.env
  ```

  Run from repo root:
  ```bash
  pnpm --filter api dev
  ```

  Expected output includes:
  ```
  {"level":30,"msg":"Server listening at http://0.0.0.0:3333"}
  ```

  Visit `http://localhost:3333/health` — should return `{"status":"ok"}`.
  Visit `http://localhost:3333/reference` — should show Scalar API reference UI.

  Stop the server with `Ctrl+C`.

- [ ] **Step 5: Commit**

  ```bash
  git add api/src/ api/drizzle.config.ts
  git commit -m "chore: add Fastify entry point and Drizzle config scaffold"
  ```

---

## Task 4: Frontend Scaffold and Configuration

**Files:**
- Scaffold: `client/` via Vite
- Modify: `client/vite.config.ts`
- Modify: `client/tsconfig.app.json`
- Create: `client/biome.json`
- Create: `client/.env.example`

- [ ] **Step 1: Scaffold the frontend with Vite**

  Run from repo root:
  ```bash
  pnpm create vite@latest client -- --template react-ts
  ```

  Expected: `client/` directory is created with a Vite + React + TypeScript scaffold.

- [ ] **Step 2: Install additional frontend dependencies**

  Run from repo root:
  ```bash
  pnpm --filter client add @tanstack/react-router @tanstack/react-query @hugeicons/react
  pnpm --filter client add -D @tanstack/router-plugin vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @types/node
  ```

  Expected: dependencies appear in `client/package.json`.

- [ ] **Step 3: Update `client/vite.config.ts`**

  Replace the entire file with:
  ```typescript
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react-swc'
  import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
  import path from 'path'

  export default defineConfig({
    plugins: [TanStackRouterVite(), react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  })
  ```

  Note: `TanStackRouterVite()` must be listed **before** `react()`.

- [ ] **Step 4: Update `client/tsconfig.app.json` to add path alias**

  Open `client/tsconfig.app.json` and add `baseUrl` and `paths` inside `compilerOptions`:
  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }
  ```
  Keep all other existing fields — only add these two properties.

- [ ] **Step 5: Create `client/biome.json`**

  ```json
  {
    "$schema": "https://biomejs.dev/schemas/2.4.9/schema.json",
    "extends": ["../biome.json"]
  }
  ```

- [ ] **Step 6: Create `client/.env.example`**

  ```
  VITE_API_URL=http://localhost:3333
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add client/
  git commit -m "chore: scaffold Vite React frontend with Tanstack dependencies and Biome"
  ```

---

## Task 5: Vitest Setup

**Files:**
- Create: `client/vitest.config.ts`
- Create: `client/src/test/setup.ts`

- [ ] **Step 1: Create `client/vitest.config.ts`**

  ```typescript
  import { defineConfig } from 'vitest/config'
  import react from '@vitejs/plugin-react-swc'
  import path from 'path'

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  })
  ```

- [ ] **Step 2: Create `client/src/test/setup.ts`**

  ```typescript
  import '@testing-library/jest-dom'
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add client/vitest.config.ts client/src/test/
  git commit -m "chore: configure Vitest with jsdom and Testing Library for client"
  ```

---

## Task 6: Tanstack Router File-Based Routing

**Files:**
- Create: `client/src/routes/__root.tsx`
- Create: `client/src/routes/index.tsx`
- Replace: `client/src/main.tsx`

- [ ] **Step 1: Create `client/src/routes/__root.tsx`**

  ```tsx
  import { createRootRoute, Outlet } from '@tanstack/react-router'

  export const Route = createRootRoute({
    component: () => <Outlet />,
  })
  ```

- [ ] **Step 2: Create `client/src/routes/index.tsx`**

  ```tsx
  import { createFileRoute } from '@tanstack/react-router'

  export const Route = createFileRoute('/')({
    component: () => <div>AI Task Manager</div>,
  })
  ```

- [ ] **Step 3: Generate the route tree**

  Run from repo root:
  ```bash
  pnpm --filter client dev
  ```

  The Tanstack Router Vite plugin auto-generates `client/src/routeTree.gen.ts` on startup.
  Stop the server with `Ctrl+C` once you see the dev server is running.

- [ ] **Step 4: Replace `client/src/main.tsx`**

  ```tsx
  import { StrictMode } from 'react'
  import { createRoot } from 'react-dom/client'
  import { RouterProvider, createRouter } from '@tanstack/react-router'
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
  import { routeTree } from './routeTree.gen'

  const queryClient = new QueryClient()

  const router = createRouter({ routeTree })

  declare module '@tanstack/react-router' {
    interface Register {
      router: typeof router
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
  ```

- [ ] **Step 5: Delete the Vite scaffold's `App.tsx` and `App.css`**

  These are no longer needed:
  ```bash
  rm client/src/App.tsx client/src/App.css
  ```

- [ ] **Step 6: Verify the frontend starts**

  ```bash
  pnpm --filter client dev
  ```

  Expected: Vite dev server starts at `http://localhost:5173`.
  Browser should show "AI Task Manager" text.
  No console errors.

  Stop with `Ctrl+C`.

- [ ] **Step 7: Commit**

  ```bash
  git add client/src/
  git commit -m "chore: set up Tanstack Router file-based routing and QueryClient"
  ```

---

## Task 7: Shadcn/ui Initialization

**Files:**
- Modified by shadcn CLI: `client/` (components, globals.css, tailwind config, etc.)

- [ ] **Step 1: Run shadcn init from inside `client/`**

  Navigate into the `client/` directory and run:
  ```bash
  pnpm dlx shadcn@latest init --preset b6rG9zk5C6
  ```

  Follow any prompts from the CLI. The preset `b6rG9zk5C6` configures shadcn with predefined style/color choices, so minimal manual input should be required.

  Expected: `client/src/components/ui/` is created, `tailwind.config.js` (or equivalent), and `client/src/index.css` is updated with CSS variables.

- [ ] **Step 2: Verify the frontend still starts after shadcn init**

  ```bash
  pnpm --filter client dev
  ```

  Expected: dev server starts at `http://localhost:5173` without errors.
  Stop with `Ctrl+C`.

- [ ] **Step 3: Commit**

  ```bash
  git add client/
  git commit -m "chore: initialize Shadcn/ui with preset b6rG9zk5C6"
  ```

---

## Task 8: Final Verification

- [ ] **Step 1: Install all workspace dependencies from root**

  ```bash
  pnpm install
  ```

  Expected: all `node_modules/` up to date with no errors.

- [ ] **Step 2: Run Biome check across the entire codebase**

  ```bash
  pnpm check
  ```

  Expected: no errors or formatting issues. If issues appear, run `pnpm format` then re-check.

- [ ] **Step 3: Verify the backend starts**

  ```bash
  pnpm --filter api dev
  ```

  Expected:
  - Server listening at `http://0.0.0.0:3333`
  - `http://localhost:3333/health` → `{"status":"ok"}`
  - `http://localhost:3333/reference` → Scalar UI

  Stop with `Ctrl+C`.

- [ ] **Step 4: Verify the frontend builds**

  ```bash
  pnpm --filter client build
  ```

  Expected: `client/dist/` created with no TypeScript or build errors.

- [ ] **Step 5: Commit**

  ```bash
  git add .
  git commit -m "chore: final verification — monorepo fully initialized"
  ```
