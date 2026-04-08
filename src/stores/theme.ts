import { ref } from 'vue'
import { defineStore } from 'pinia'

export type AppTheme = 'default' | 'hacker'

const STORAGE_KEY = 'mifi-theme-v1'

export function readStoredTheme(): AppTheme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'hacker' || v === 'default') return v
  } catch {
    /* ignore */
  }
  return 'default'
}

/** 与 Element Plus 约定：default=浅色；hacker=dark + 自定义 hacker 类 */
export function applyThemeClass(theme: AppTheme): void {
  const root = document.documentElement
  root.classList.remove('dark', 'hacker')
  if (theme === 'hacker') {
    root.classList.add('dark', 'hacker')
  }
}

/** 在 createApp / mount 之前调用，减少首屏闪烁 */
export function bootstrapTheme(): void {
  applyThemeClass(readStoredTheme())
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<AppTheme>(readStoredTheme())

  function setTheme(next: AppTheme) {
    theme.value = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    applyThemeClass(next)
  }

  return {
    theme,
    setTheme,
  }
})
