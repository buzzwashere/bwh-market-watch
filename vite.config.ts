import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// `vite` does not run Vercel's /api functions, so serve the same handler in dev.
function devApi(): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/quotes', async (req, res) => {
        const module = await server.ssrLoadModule('/api/quotes.ts')
        const { default: handler } = module as typeof import('./api/quotes.ts')
        await handler(req, res)
      })
      server.middlewares.use('/api/history', async (req, res) => {
        const module = await server.ssrLoadModule('/api/history.ts')
        const { default: handler } = module as typeof import('./api/history.ts')
        await handler(req, res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), vueDevTools(), devApi()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 9010,
    strictPort: true,
  },
})
