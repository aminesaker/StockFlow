import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: { alias: { '@': resolve(dir) } },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
})
