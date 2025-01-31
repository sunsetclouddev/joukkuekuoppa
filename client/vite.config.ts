import { fileURLToPath, URL } from 'node:url'

import { defineConfig, createLogger } from 'vite'
import vue from '@vitejs/plugin-vue'

const logger = createLogger();

logger.error = (msg, options) => {
  // From https://github.com/vitejs/vite/blob/main/packages/vite/src/node/server/middlewares/proxy.ts,
  // it seems that the proxy middleware just pushes messages to logger.
  // Ignore them in the logger, and handle them through proxy error listener configuration.
  // (@note: this is not entirely safe as in theory something else could cause similar messages in the logger)
  if (msg.includes('http proxy error'))
    return;
};

// https://vitejs.dev/config/
export default defineConfig({
  customLogger: logger,
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            // @note: intentionally ignore proxy errors for now
          });
        }
      }
    }
  }
})
