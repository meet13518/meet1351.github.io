import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
// 仓库为 meet13518/meet1351.github.io → Pages 在子路径 /meet1351.github.io/，不能用 '/'
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/meet1351.github.io/' : '/',
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
}))
