# Project Guidelines

## Documentation Resources
-  You should use Context7 MCP to consult the relevant docs, if Context7 can't be used for some reason, then consult the links depending on your needs:
  - https://nodejs.org/docs/latest/api/
  - https://fastify.dev/docs/latest/
  - https://github.com/brianc/node-postgres
  - https://github.com/fastify/fastify-cors
  - https://github.com/fastify/fastify-swagger
  - https://scalar.com/products/docs/getting-started
  - https://zod.dev/
  - https://github.com/turkerdev/fastify-type-provider-zod
  - https://tsx.is/getting-started
  - https://orm.drizzle.team/docs/overview
  - https://react.dev/reference/react
  - https://vite.dev/guide/
  - https://tanstack.com/query/latest/docs/framework/react/overview
  - https://tanstack.com/router/latest/docs/overview
  - https://ui.shadcn.com/docs/installation
  - https://biomejs.dev/guides/getting-started/
  - https://vitest.dev/guide/

## Package Installation
-  Should be handled with pnpm, but pay attention to shadcn/ui, where you should use pnpm dlx.
-  If you need to install any additional packages, ask the user for permission first.

## Project structure
-  This is a monorepo, front end should be inside a `client` directory, and backend should be inside a `api` directory.
-  The postgres database will be in a docker container named `ai-task-manager` and should use postgres:17.
-  Biome will be set globally at the root, and then be extended in `client` and `api`.
- Global Biome settings will be:
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

## Data Loading
-  Prefer server-side data loading over client-side unless otherwise specified.
-  Data loading should always occur on route modules and never on the feature components.

## Import Statements
-  Use `@` for imports instead of relative paths.
-  Use barrel export where it makes sense

## UI Components
-  Use shadcn/ui for building the UI. Exclusively.
-  When installing shadcn/ui use the following preset: `--preset b6rG9zk5C6`
-  Use icons from Hugeicons. Exclusively.
-  Installed Shadcn UI components are located in `client/src/components/ui`.
-  If a component is missing, install it using Shadcn's CLI.
