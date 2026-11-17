import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    // Tests render with renderToStaticMarkup, which cannot wait for next/dynamic: the lazily loaded
    // components come straight from their own files instead (tests/lazyClientDirect.ts).
    alias: [{ find: /^@\/components\/lazyClient$/, replacement: fileURLToPath(new URL('./tests/lazyClientDirect.ts', import.meta.url)) }],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
  },
})
