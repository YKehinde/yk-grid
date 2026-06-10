import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/components/DataGrid/index.ts',
      name: 'YkGrid',
      fileName: (format) => `yk-grid.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'zod'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          zod: 'Zod',
        },
      },
    },
  },
})
