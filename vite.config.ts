import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleGridAiRequest } from './server/gridAiRoute'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
  plugins: [
    react(),
    {
      name: 'grid-ai-dev',
      configureServer(server) {
        server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.url !== '/api/grid-ai') { next(); return }
          if (req.method !== 'POST') {
            res.writeHead(405)
            res.end('Method Not Allowed')
            return
          }
          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', async () => {
            try {
              const result = await handleGridAiRequest(JSON.parse(body))
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(result))
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err)
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: message }))
            }
          })
        })
      },
    },
  ],
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
  }
  }
})
