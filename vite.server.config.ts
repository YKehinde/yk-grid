import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'server/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'server.mjs' : 'server.cjs',
    },
  },
})

