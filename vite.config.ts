import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    {
      name: 'create-nojekyll',
      closeBundle() {
        
        // 在打包完成后，在 dist 目录下创建一个空的 .nojekyll 文件
        fs.writeFileSync('dist/.nojekyll', '')
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
