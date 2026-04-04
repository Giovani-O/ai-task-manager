import 'dotenv/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      provider: 'v8',
    },
    environment: 'node',
    globalSetup: './src/tests/setup/global-setup.ts',
    pool: 'forks',
    maxWorkers: 1,
    isolate: false,
    poolOptions: {
      forks: {
        maxForks: 1,
        minForks: 1,
      },
    },
    include: ['src/tests/**/*.test.ts'],
  },
})
