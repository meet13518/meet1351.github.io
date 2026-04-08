<script setup lang="ts">
import { DocumentCopy } from '@element-plus/icons-vue'
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { ConsoleLogEntry } from '@/types'
import { REMOVE_LIMIT_PHASES } from '@/utils/removeLimitPhases'

const props = defineProps<{
  logs: ConsoleLogEntry[]
  overallPercent: number
  phaseProgress: [number, number, number, number]
  loading?: boolean
}>()

const phaseTitles = computed(() => REMOVE_LIMIT_PHASES.map((p) => p.title))

const BAR_WIDTH = 20

/** 文本「打印」式进度条，如 [████████░░░░░░░░░░░░] */
function printBar(percent: number, width = BAR_WIDTH): string {
  const p = Math.min(100, Math.max(0, percent))
  const filled = Math.round((p / 100) * width)
  const empty = Math.max(0, width - filled)
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`
}

const overallPrinted = computed(() => {
  const p = Math.min(100, Math.max(0, props.overallPercent))
  return `总进度  ${printBar(p)}  ${String(p).padStart(3)}%`
})

const phasePrintedLines = computed(() => {
  return phaseTitles.value.map((title, i) => {
    const p = Math.min(100, Math.max(0, props.phaseProgress[i] ?? 0))
    const idx = String(i + 1).padStart(2, '0')
    return `[${idx}] ${title}  ${printBar(p)}  ${String(p).padStart(3)}%`
  })
})

const scroller = ref<HTMLElement | null>(null)

watch(
  () => props.logs.length,
  async () => {
    await nextTick()
    const el = scroller.value
    if (el) el.scrollTop = el.scrollHeight
  },
)

function levelClass(level: ConsoleLogEntry['level']) {
  return `log-row--${level}`
}

async function copyLine(line: ConsoleLogEntry) {
  const text = `[${line.time}] ${line.message}`
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}
</script>

<template>
  <div class="flow-console">
    <div class="console-head">
      <div class="head-left">
        <span class="traffic" aria-hidden="true" />
        <span class="console-title">去控控制台</span>
        <span class="head-sub">日志流 · GTP / PFCP / PCC</span>
      </div>
    </div>
    <div class="progress-panel" aria-label="文本进度输出">
      <div class="progress-banner"># 进度输出（文本条）</div>
      <pre class="printed-line printed-line--total" :class="{ 'is-busy': loading }">{{ overallPrinted }}{{ loading ? ' ▌' : '' }}</pre>
      <pre
        v-for="(line, i) in phasePrintedLines"
        :key="i"
        class="printed-line printed-line--phase"
        :class="{ 'is-busy': loading && (phaseProgress[i] ?? 0) > 0 && (phaseProgress[i] ?? 0) < 100 }"
      >{{ line }}</pre>
    </div>
    <div ref="scroller" class="console-body terminal-scroll" role="log" aria-live="polite" aria-label="去控过程输出">
      <div v-if="!logs.length" class="empty">
        <span class="empty-prompt">&gt;</span>
        <span>等待指令…</span>
      </div>
      <div
        v-for="line in logs"
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
.flow-console {
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
  height: min(720px, 78vh);
  min-height: 420px;
  border: 1px solid var(--term-border);
  border-radius: 8px;
  background: var(--term-bg);
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

/* 进度区：与终端同壳，深色底，位于标题栏与日志之间 */
.progress-panel {
  flex-shrink: 0;
  padding: 10px 12px 12px;
  background: #121212;
  border-bottom: 1px solid var(--term-border);
  font-family: ui-monospace, 'Cascadia Mono', 'SF Mono', Menlo, Consolas, monospace;
}
.progress-banner {
  font-size: 11px;
  color: #6a9955;
  margin-bottom: 6px;
  user-select: none;
}
.printed-line {
  margin: 0 0 3px;
  padding: 0;
  font-size: 11px;
  line-height: 1.45;
  white-space: pre;
  overflow-x: auto;
  color: #4ec9b0;
  font-variant-numeric: tabular-nums;
  tab-size: 4;
}
.printed-line--total {
  color: #b5e0b8;
  font-weight: 600;
  margin-bottom: 6px;
}
.printed-line--phase {
  color: #7fd0be;
}
.printed-line.is-busy {
  animation: printed-dim 1.1s ease-in-out infinite;
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
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: scroll;
  padding: 10px 0 12px 10px;
  font-family: ui-monospace, 'Cascadia Mono', 'SF Mono', Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--term-fg);
  background: var(--term-bg);
  scrollbar-gutter: stable;
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
.log-row:hover .log-copy {
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
</style>
