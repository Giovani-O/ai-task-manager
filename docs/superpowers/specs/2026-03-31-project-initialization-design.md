# Project Initialization Design

**Date:** 2026-03-31  
**Scope:** Initialize monorepo with frontend (`client/`) and backend (`api/`) projects, all dependencies installed, no features implemented.

---

## Monorepo Approach

pnpm workspaces (Option A). Root holds shared tooling; `client/` and `api/` are workspace packages. No additional orchestration tool (e.g., Turborepo) at this stage.

---

## Repository Structure

```
ai-task-manager/
├── .nvmrc                     # Node 22 LTS
├── .gitignore
├── pnpm-workspace.yaml        # Declares client/ and api/ as workspaces
├── package.json               # Root: lint/format/check scripts only
├── biome.json                 # Global Biome config
├── client/
│   ├── package.json
│   ├── biome.json             # Extends root
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       └── routes/            # Tanstack Router file-based routes
└── api/
    ├── package.json
    ├── biome.json             # Extends root
    ├── tsconfig.json
    ├── docker-compose.yml
    ├── drizzle.config.ts
    ├── .env.example
    └── src/
        └── index.ts           # Fastify entry point
```

---

## Global Biome Configuration

Placed at root `biome.json`, extended by `client/biome.json` and `api/biome.json`.

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

---

## Frontend (`client/`)

**Scaffold:** Vite `react-ts` template.

**Runtime dependencies:**
- `react`, `react-dom`
- `@tanstack/react-router` — file-based routing
- `@tanstack/router-vite-plugin` — Vite plugin for route generation
- `@tanstack/react-query` — server state management
- `@hugeicons/react` — icons (exclusively, per SDD)

**Dev dependencies:**
- `vite`, `typescript`, `@vitejs/plugin-react`
- `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`
- `biome`

**Shadcn/ui:** Installed via `pnpm dlx shadcn@latest init --preset b6rG9zk5C6`.  
Installed components live in `client/src/components/ui/`.

**Path alias:** `@` → `src/` configured in `vite.config.ts` and `tsconfig.json`.

**Environment:** `client/.env.example`:
```
VITE_API_URL=http://localhost:3333
```

---

## Backend (`api/`)

**Runtime:** `tsx` (TypeScript execution without compilation step in dev), Node.js v22.

**Runtime dependencies:**
- `fastify` — core framework
- `@fastify/cors` — CORS support
- `@fastify/swagger` — OpenAPI spec generation
- `@scalar/fastify-api-reference` — Scalar API docs UI
- `zod` — schema validation
- `fastify-type-provider-zod` — Fastify type provider integration
- `drizzle-orm`, `pg` — ORM and Postgres driver
- `dotenv` — environment variable loading

**Dev dependencies:**
- `tsx`, `typescript`
- `drizzle-kit` — migration CLI
- `vitest`
- `@types/node`, `@types/pg`
- `biome`

**TypeScript:** Strict mode enabled. Path alias `@` → `src/`.

**Drizzle:** `drizzle.config.ts` pointing to `src/db/schema.ts` (empty schema placeholder).

**Environment:** `api/.env.example`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_task_manager
GEMINI_API_KEY=
```

---

## Docker (`api/docker-compose.yml`)

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

---

## Node.js Version

`.nvmrc` at root pins Node.js `22`. Root `package.json` includes `"engines": { "node": ">=22" }`.

---

## Root Scripts

Root `package.json` provides workspace-wide scripts:
- `lint` — `biome lint ./client/src ./api/src`
- `format` — `biome format ./client/src ./api/src`
- `check` — `biome check ./client/src ./api/src`

---

## Out of Scope

- No feature implementation (routes, DB schema, AI integration)
- No pgvector setup (vector storage is a future phase per PRD)
- No CI/CD configuration
- No shared `packages/` directory (can be added when type sharing is needed)
