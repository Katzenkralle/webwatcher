import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import svgLoader from 'vite-svg-loader'

import { version, license, repository } from './package.json'

// https://vite.dev/config/
export default defineConfig({
  server: {
  port: 8079,
  host: "0.0.0.0",
  proxy: {
      '/auth': 'http://localhost:7000',
      '/gql': 'http://localhost:7000',
    }
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'dev'
        }
      }
    }),
    vueJsx(),
    vueDevTools(),
    tailwindcss(),
    svgLoader(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_LICENSE__: JSON.stringify(license),
    __APP_REPOSETORY__: JSON.stringify(repository),
  }
})
