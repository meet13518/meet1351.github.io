<script setup lang="ts">
import { Delete, DocumentCopy } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import { useConsoleAutoScroll } from '@/composables/useConsoleAutoScroll'
import { cui } from '@/utils/consoleI18n'
import type { ConsoleLogEntry } from '@/types'

const store = useAppStore()
const { settings } = storeToRefs(useSettingsStore())
const ui = computed(() => cui(settings.value.consoleOutputLocale))
const scroller = ref<HTMLElement | null>(null)
const { onScroll, scrollToBottomIfStuck, forceStickToBottom } = useConsoleAutoScroll(scroller)

watch(
  () => store.consoleLogs.length,
  (n) => {
    if (n === 0) forceStickToBottom()
    scrollToBottomIfStuck()
  },
  { flush: 'post' },
)

function levelClass(level: ConsoleLogEntry['level']) {
  return `log-row--${level}`
}

async function copyLine(line: ConsoleLogEntry) {
  const text = `[${line.time}] ${line.message}`
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(ui.value.copyOk)
  } catch {
    ElMessage.error(ui.value.copyFail)
  }
}

function topSuggestion(): string | null {
  const logs = store.consoleLogs
  for (let i = logs.length - 1; i >= 0; i--) {
    const m = logs[i]?.message ?? ''
    if (m.includes('诊断结论') || m.includes('建议') || m.includes('Diagnosis:')) return m
  }
  return null
}
</script>

<template>
  <div class="console-panel">
    <div class="console-head">
      <div class="head-left">
        <span class="traffic" aria-hidden="true" />
        <span class="console-title">{{ ui.realtimeTitle }}</span>
        <span class="head-sub">{{ ui.realtimeSub }}</span>
      </div>
      <el-button class="btn-clear" :icon="Delete" size="small" text @click="store.clearLogs">{{ ui.clear }}</el-button>
    </div>
    <div v-if="topSuggestion()" class="console-hint">
      <span class="hint-prompt">#</span>
      <span class="hint-text">{{ topSuggestion() }}</span>
    </div>
    <div
      ref="scroller"
      class="console-body terminal-scroll"
      role="log"
      aria-live="polite"
      :aria-label="ui.ariaRealtime"
      @scroll.passive="onScroll"
    >
      <div v-if="!store.consoleLogs.length" class="empty">
        <span class="empty-prompt">$</span>
        <span>{{ ui.waitRealtime }}</span>
      </div>
      <div
        v-for="line in store.consoleLogs"
        :key="line.id"
        class="log-row"
        :class="levelClass(line.level)"
      >
        <span class="log-prompt" aria-hidden="true">&gt;</span>
        <div class="log-main">
          <time class="log-time" :datetime="line.time">{{ line.time }}</time>
          <span class="log-msg">{{ line.message }}</span>
        </div>
        <el-button
          class="log-copy"
          :icon="DocumentCopy"
          text
          size="small"
          aria-label="复制本条"
          @click="copyLine(line)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 终端整体：深色背景 + 等宽字体 */
.console-panel {
  --term-bg: #0c0c0c;
  --term-bg-head: #1a1a1a;
  --term-border: #2d2d2d;
  --term-fg: #b5e0b8;
  --term-dim: #6a9955;
  --term-info: #4ec9b0;
  --term-warn: #dcdcaa;
  --term-err: #f48771;
  --term-scroll-track: #141414;
  --term-scroll-thumb: #454545;
  --term-scroll-thumb-hover: #5c5c5c;

  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  /* 控制台整体最大高度；日志在 .console-body 内滚动 */
  height: clamp(260px, 72vh, 640px);
  border: 1px solid var(--term-border);
  border-radius: 8px;
  background: var(--term-bg);
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.console-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--term-border);
  background: linear-gradient(180deg, #222 0%, var(--term-bg-head) 100%);
  flex-shrink: 0;
}
.head-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.traffic {
  width: 52px;
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #ff5f56 0 33%, #ffbd2e 33% 66%, #27c93f 66% 100%);
  flex-shrink: 0;
}
.console-title {
  font-weight: 600;
  font-size: 13px;
  color: #d4d4d4;
  letter-spacing: 0.02em;
}
.head-sub {
  font-size: 11px;
  color: #6e6e6e;
  font-family: ui-monospace, 'Cascadia Mono', 'SF Mono', Menlo, Consolas, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.btn-clear {
  color: #c9a0a0 !important;
  flex-shrink: 0;
}
.btn-clear:hover {
  color: #ff9090 !important;
}

.console-hint {
  flex-shrink: 0;
  margin: 0;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--term-info);
  background: rgba(78, 201, 176, 0.08);
  border-bottom: 1px solid var(--term-border);
  font-family: ui-monospace, 'Cascadia Mono', 'SF Mono', Menlo, Consolas, monospace;
}
.hint-prompt {
  color: var(--term-dim);
  margin-right: 8px;
  user-select: none;
}
.hint-text {
  word-break: break-word;
}

/* 主输出区：占满标题栏/提示条之下的剩余高度，超出出现滚动条 */
.console-body {
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 10px 0 12px 10px;
  font-family: ui-monospace, 'Cascadia Mono', 'SF Mono', Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
  color: var(--term-fg);
  background: var(--term-bg);
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* WebKit：滚动条轨道与滑块，类系统终端风格 */
.terminal-scroll::-webkit-scrollbar {
  width: 11px;
}
.terminal-scroll::-webkit-scrollbar-track {
  background: var(--term-scroll-track);
  border-left: 1px solid #111;
  border-radius: 0 6px 6px 0;
}
.terminal-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, var(--term-scroll-thumb), #3a3a3a);
  border-radius: 5px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
.terminal-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, var(--term-scroll-thumb-hover), #666);
  border: 2px solid transparent;
  background-clip: padding-box;
}
.terminal-scroll::-webkit-scrollbar-corner {
  background: var(--term-scroll-track);
}

/* Firefox */
.terminal-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--term-scroll-thumb) var(--term-scroll-track);
}

.log-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 6px 8px;
  align-items: start;
  padding: 3px 8px 3px 4px;
  margin-bottom: 2px;
  border-radius: 2px;
}
.log-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.log-prompt {
  color: var(--term-dim);
  user-select: none;
  font-weight: 600;
  padding-top: 1px;
}
.log-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.log-time {
  font-size: 11px;
  color: var(--term-dim);
  font-variant-numeric: tabular-nums;
}
.log-msg {
  word-break: break-word;
  white-space: pre-wrap;
  color: var(--term-fg);
}

.log-row--info .log-msg {
  color: var(--term-info);
}
.log-row--warning .log-msg {
  color: var(--term-warn);
}
.log-row--error .log-msg {
  color: var(--term-err);
}

.log-copy {
  opacity: 0.45;
  color: #aaa !important;
  align-self: start;
}
.log-row:hover .log-copy {
  opacity: 0.95;
}
.log-copy:hover {
  color: #fff !important;
}

.empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  color: var(--term-dim);
  font-style: italic;
}
.empty-prompt {
  color: var(--term-dim);
  user-select: none;
  font-weight: 600;
}

/* 底部抽屉内：由外层限定高度，控制台铺满并在内部滚动 */
.console-panel.console-in-drawer {
  height: 100%;
  max-height: 100%;
  min-height: 0;
}
</style>
