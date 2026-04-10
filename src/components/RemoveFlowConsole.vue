<script setup lang="ts">
import { DocumentCopy } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { ConsoleLogEntry } from '@/types'
import type { ConsoleOutputLocale } from '@/types/settings'
import { useConsoleAutoScroll } from '@/composables/useConsoleAutoScroll'
import { cui } from '@/utils/consoleI18n'

interface PhaseSection {
  header: ConsoleLogEntry
  body: ConsoleLogEntry[]
}

const props = withDefaults(
  defineProps<{
    logs: ConsoleLogEntry[]
    overallPercent: number
    phaseProgress: [number, number, number, number]
    loading?: boolean
    /** 与 store.removeLimitPhase 一致：仅当前阶段进度条显示流动动画 */
    activePhase?: number
    /** 与「应用配置」中的控制台语言一致 */
    consoleLocale?: ConsoleOutputLocale
  }>(),
  { consoleLocale: 'zh' },
)

const ui = computed(() => cui(props.consoleLocale))

const BAR_WIDTH = 20

function printBar(percent: number, width = BAR_WIDTH): string {
  const p = Math.min(100, Math.max(0, percent))
  const filled = Math.round((p / 100) * width)
  const empty = Math.max(0, width - filled)
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`
}

const overallPrinted = computed(() => {
  const p = Math.min(100, Math.max(0, props.overallPercent))
  return `${ui.value.overallPrefix}  ${printBar(p)}  ${String(p).padStart(3)}%`
})

const activePhaseSafe = computed(() =>
  typeof props.activePhase === 'number' ? props.activePhase : -1,
)

function phasePercent(phaseIndex: number): number {
  return Math.min(100, Math.max(0, props.phaseProgress[phaseIndex] ?? 0))
}

/** 阶段头 + 该阶段内日志，便于进度条区域 sticky 吸顶 */
const groupedView = computed(() => {
  const prefix: ConsoleLogEntry[] = []
  const sections: PhaseSection[] = []
  let current: PhaseSection | null = null
  for (const line of props.logs) {
    if (line.entryType === 'phase_header') {
      if (current) sections.push(current)
      current = { header: line, body: [] }
    } else if (current) {
      current.body.push(line)
    } else {
      prefix.push(line)
    }
  }
  if (current) sections.push(current)
  return { prefix, sections }
})

const scroller = ref<HTMLElement | null>(null)
const { onScroll, scrollToBottomIfStuck, forceStickToBottom } = useConsoleAutoScroll(scroller)

watch(
  () => props.logs.length,
  (n) => {
    if (n === 0) forceStickToBottom()
  },
)

watch(
  () => [props.logs.length, props.overallPercent, props.phaseProgress.join(',')] as const,
  scrollToBottomIfStuck,
  { flush: 'post' },
)

watch(
  () => props.loading,
  (v) => {
    if (v) {
      forceStickToBottom()
      scrollToBottomIfStuck()
    }
  },
  { flush: 'post' },
)

function levelClass(level: ConsoleLogEntry['level']) {
  return `log-row--${level}`
}

function isTableLine(line: ConsoleLogEntry): boolean {
  return line.entryType === 'table_line'
}

async function copyLine(line: ConsoleLogEntry) {
  let text: string
  if (line.entryType === 'phase_header') {
    const n = (line.phaseIndex ?? 0) + 1
    text = `[${line.time}] ${ui.value.phaseLine(n, line.message)}`
  } else {
    text = `[${line.time}] ${line.message}`
  }
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(ui.value.copyOk)
  } catch {
    ElMessage.error(ui.value.copyFail)
  }
}
</script>

<template>
  <div class="flow-console">
    <div class="console-head">
      <div class="head-left">
        <span class="traffic" aria-hidden="true" />
        <span class="console-title">{{ ui.removeTitle }}</span>
        <span class="head-sub">{{ ui.removeSub }}</span>
      </div>
    </div>
    <div
      ref="scroller"
      class="console-body terminal-scroll"
      role="log"
      aria-live="polite"
      :aria-label="ui.ariaRemove"
      @scroll.passive="onScroll"
    >
      <div v-if="!logs.length && !loading" class="empty">
        <span class="empty-prompt">&gt;</span>
        <span>{{ ui.waitRemove }}</span>
      </div>
      <template v-else>
        <div v-if="loading" class="console-overall">
          <span class="log-prompt" aria-hidden="true">&gt;</span>
          <pre class="console-overall__pre" :class="{ 'is-busy': loading }">{{ overallPrinted }}{{ loading ? ' ▌' : '' }}</pre>
        </div>
        <template v-for="line in groupedView.prefix" :key="line.id">
          <div
            v-if="isTableLine(line)"
            class="table-block"
          >
            <pre class="table-block__pre">{{ line.message }}</pre>
          </div>
          <div
            v-else
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
        </template>
        <div
          v-for="sec in groupedView.sections"
          :key="sec.header.id"
          class="phase-section"
        >
          <div class="phase-section__sticky">
            <div class="phase-block">
              <div class="phase-block__head">
                <span class="log-prompt" aria-hidden="true">&gt;</span>
                <div class="phase-block__meta">
                  <time class="log-time" :datetime="sec.header.time">{{ sec.header.time }}</time>
                  <span class="phase-block__title">{{ ui.phaseLine((sec.header.phaseIndex ?? 0) + 1, sec.header.message) }}</span>
                </div>
                <el-button
                  class="log-copy"
                  :icon="DocumentCopy"
                  text
                  size="small"
                  aria-label="复制本阶段标题"
                  @click="copyLine(sec.header)"
                />
              </div>
              <div class="phase-block__bar">
                <el-progress
                  :percentage="phasePercent(sec.header.phaseIndex ?? 0)"
                  :stroke-width="10"
                  striped
                  :striped-flow="!!loading && activePhaseSafe === sec.header.phaseIndex"
                  class="phase-block__progress"
                />
              </div>
            </div>
          </div>
          <div class="phase-section__body">
            <template v-for="line in sec.body" :key="line.id">
              <div
                v-if="isTableLine(line)"
                class="table-block"
              >
                <pre class="table-block__pre">{{ line.message }}</pre>
              </div>
              <div
                v-else
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
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.flow-console {
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-sizing: border-box;
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
  height: min(720px, 78vh);
  min-height: 420px;
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

.console-body {
  --console-scroll-pad-top: 10px;
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: var(--console-scroll-pad-top) 0 12px 10px;
  font-family: ui-monospace, 'Cascadia Mono', 'SF Mono', Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
  color: var(--term-fg);
  background: var(--term-bg);
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.console-overall {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 8px 10px 4px;
  margin-bottom: 4px;
  border-bottom: 1px dashed var(--term-border);
}
.console-overall__pre {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 11px;
  line-height: 1.45;
  white-space: pre-wrap;
  color: #b5e0b8;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.console-overall__pre.is-busy {
  animation: printed-dim 1.1s ease-in-out infinite;
}

.phase-section {
  margin-bottom: 4px;
}
.phase-section__sticky {
  /* 与 .console-body 上内边距抵消，吸顶时贴齐滚动区顶边不留缝 */
  position: sticky;
  top: calc(-1 * var(--console-scroll-pad-top));
  z-index: 5;
  padding: calc(var(--console-scroll-pad-top) + 6px) 0 8px;
  margin: calc(-1 * (var(--console-scroll-pad-top) + 6px)) 0 0;
  background: var(--term-bg);
  box-shadow: 0 8px 12px -4px rgba(0, 0, 0, 0.65);
}
.phase-section__sticky .phase-block {
  margin-bottom: 0;
}
.phase-section__body {
  padding-top: 2px;
}

.phase-block {
  padding: 8px 8px 12px 4px;
  margin-bottom: 6px;
  border-left: 2px solid var(--el-color-primary);
  padding-left: 10px;
  margin-left: 2px;
  background: rgba(64, 158, 255, 0.06);
  border-radius: 0 6px 6px 0;
}
.phase-block__head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 6px 8px;
  align-items: start;
  margin-bottom: 8px;
}
.phase-block__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.phase-block__title {
  font-size: 12px;
  font-weight: 600;
  color: #7fd0be;
  word-break: break-word;
}
.phase-block__bar {
  padding-left: 0;
}
.phase-block__progress :deep(.el-progress-bar__outer) {
  background-color: #2a2a2a;
}

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
.terminal-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--term-scroll-thumb) var(--term-scroll-track);
}

.table-block {
  margin: 6px 4px 10px 2px;
  padding: 10px 10px 12px;
  border-radius: 6px;
  border: 1px solid rgba(78, 201, 176, 0.22);
  background: rgba(0, 0, 0, 0.45);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.table-block__pre {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  white-space: pre;
  overflow-x: auto;
  color: #9cdcfe;
  font-variant-numeric: tabular-nums;
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
.log-row:hover .log-copy,
.phase-block__head:hover .log-copy {
  opacity: 0.95;
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
@keyframes printed-dim {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.82;
  }
}
</style>
