import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { AppSettings } from '@/types/settings'
import { defaultSettings } from '@/types/settings'

const STORAGE_KEY = 'mifi-app-settings-v1'

function loadFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultSettings }
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return { ...defaultSettings, ...parsed }
  } catch {
    return { ...defaultSettings }
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>(loadFromStorage())

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
  }

  function save(patch: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...patch }
    persist()
  }

  function replaceAll(next: AppSettings) {
    settings.value = { ...defaultSettings, ...next }
    persist()
  }

  function reset() {
    settings.value = { ...defaultSettings }
    persist()
  }

  return {
    settings,
    persist,
    save,
    replaceAll,
    reset,
  }
})
