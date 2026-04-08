<script setup lang="ts">
import { ArrowDown, Check } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import type { AppTheme } from '@/stores/theme'

defineProps<{
  title?: string
}>()

const router = useRouter()
const themeStore = useThemeStore()
const { theme } = storeToRefs(themeStore)

function goHome() {
  void router.push('/')
}

function goSettings() {
  void router.push('/settings')
}

function setTheme(t: AppTheme) {
  themeStore.setTheme(t)
}
</script>

<template>
  <header class="app-header">
    <button type="button" class="brand" @click="goHome">
      <span class="logo" aria-hidden="true">📶</span>
      <span class="title">{{ title ?? '随身 WiFi 管家' }}</span>
    </button>
    <div class="actions">
      <el-dropdown trigger="click">
        <span class="help-trigger">
          <el-button text type="primary">
            帮助
            <el-icon class="caret"><ArrowDown /></el-icon>
          </el-button>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goSettings">应用配置</el-dropdown-item>
            <el-dropdown-item divided disabled class="theme-section-label">主题</el-dropdown-item>
            <el-dropdown-item @click="setTheme('default')">
              <span class="theme-item">
                <el-icon v-if="theme === 'default'" class="theme-check"><Check /></el-icon>
                <span v-else class="theme-check-placeholder" aria-hidden="true" />
                默认
              </span>
            </el-dropdown-item>
            <el-dropdown-item @click="setTheme('hacker')">
              <span class="theme-item">
                <el-icon v-if="theme === 'hacker'" class="theme-check"><Check /></el-icon>
                <span v-else class="theme-check-placeholder" aria-hidden="true" />
                黑客风
              </span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 52px;
  border-bottom: 1px solid var(--mifi-border);
  background: var(--mifi-header-bg);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
  padding: 4px 0;
  border-radius: 8px;
}
.brand:hover {
  opacity: 0.88;
}
.logo {
  font-size: 22px;
}
.title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--el-text-color-primary);
}
.help-trigger {
  outline: none;
}
.caret {
  margin-left: 4px;
  vertical-align: middle;
}
.theme-section-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: default !important;
}
.theme-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 7em;
}
.theme-check {
  color: var(--el-color-primary);
  flex-shrink: 0;
}
.theme-check-placeholder {
  display: inline-block;
  width: 1em;
  flex-shrink: 0;
}
</style>
