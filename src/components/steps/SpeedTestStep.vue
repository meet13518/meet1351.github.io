<script setup lang="ts">
import * as echarts from 'echarts'
import type { EChartsType } from 'echarts'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { getThresholds, NORMAL_DOWNLOAD_MBPS } from '@/utils/diagnosis'

const store = useAppStore()
const chartRef = ref<HTMLDivElement | null>(null)
let chart: EChartsType | null = null

function renderGauge() {
  const box = chartRef.value
  const sp = store.speedResult
  const dev = store.deviceInfo
  if (!box || !sp || !dev) return
  const max = NORMAL_DOWNLOAD_MBPS.max
  const value = Math.min(sp.downloadMbps, max)
  if (!chart) chart = echarts.init(box)
  chart.setOption({
    animationDuration: 900,
    series: [
      {
        type: 'gauge',
        min: 0,
        max,
        splitNumber: 5,
        progress: {
          show: true,
          width: 12,
          itemStyle: { color: '#67c23a' },
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [[1, '#e4e7ed']],
          },
        },
        title: { offsetCenter: [0, '72%'], color: '#909399' },
        pointer: { itemStyle: { color: 'auto' } },
        axisTick: { distance: -12 },
        splitLine: { distance: -16, length: 14 },
        axisLabel: { distance: 18, fontSize: 10 },
        detail: { valueAnimation: true, formatter: '{value} Mbps', fontSize: 16 },
        data: [{ value: Math.round(value * 10) / 10, name: '下行' }],
      },
    ],
  })
}

function disposeChart() {
  chart?.dispose()
  chart = null
}

watch(
  () => store.speedResult,
  () => {
    nextTick(() => {
      // 等 DOM 与过渡完成后再渲染，避免刷新后容器尺寸未就绪导致不显示
      requestAnimationFrame(() => renderGauge())
    })
  },
)

watch(
  () => store.currentStep,
  (s) => {
    if (s !== 1) disposeChart()
    else {
      nextTick(() => {
        requestAnimationFrame(() => renderGauge())
      })
    }
  },
)

watch(
  () => chartRef.value,
  (el) => {
    if (!el || store.currentStep !== 1 || !store.speedResult || !store.deviceInfo) return
    nextTick(() => {
      requestAnimationFrame(() => renderGauge())
    })
  },
)

function onResize() {
  chart?.resize()
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  nextTick(() => renderGauge())
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  disposeChart()
})

function alertType(): 'success' | 'warning' | 'info' | 'error' {
  const d = store.diagnosis
  if (!d) return 'info'
  if (d.severity === 'error') return 'error'
  if (d.severity === 'warning') return 'warning'
  return 'info'
}
</script>

<template>
  <div class="speed-step">
    <div class="actions">
      <el-button
        type="primary"
        :loading="store.speedTestRunning"
        :disabled="!store.deviceInfo || store.speedTestRunning"
        @click="store.runSpeedTestFlow"
      >
        开始诊断
      </el-button>
    </div>

    <div v-if="store.speedTestRunning" class="progress-wrap">
      <el-progress :percentage="Math.round(store.speedTestProgress)" :stroke-width="16" striped striped-flow />
      <p class="hint">测速进行中，约 5 秒…</p>
    </div>

    <div v-if="store.speedResult && store.deviceInfo" class="result">
      <div ref="chartRef" class="chart" role="img" aria-label="下行速度仪表盘" />
      <div class="cards">
        <el-card shadow="never" class="mini">
          <div class="mini-label">上行</div>
          <div class="mini-val">{{ store.speedResult.uploadMbps }} Mbps</div>
          <div class="mini-sub">阈值 ≥ {{ getThresholds(store.deviceInfo.networkType).upload }} Mbps</div>
        </el-card>
        <el-card shadow="never" class="mini">
          <div class="mini-label">延迟</div>
          <div class="mini-val">{{ store.speedResult.latencyMs }} ms</div>
          <div class="mini-sub">阈值 ≤ {{ getThresholds(store.deviceInfo.networkType).latency }} ms</div>
        </el-card>
        <el-card shadow="never" class="mini">
          <div class="mini-label">抖动</div>
          <div class="mini-val">{{ store.speedResult.jitterMs }} ms</div>
          <div class="mini-sub">阈值 ≤ {{ getThresholds(store.deviceInfo.networkType).jitter }} ms</div>
        </el-card>
      </div>
    </div>

    <transition name="pulse">
      <el-alert
        v-if="store.diagnosis"
        class="diag"
        :title="store.diagnosis.conclusion"
        :type="alertType()"
        :description="store.diagnosis.suggestion"
        show-icon
        :closable="false"
      />
    </transition>
  </div>
</template>

<style scoped>
.speed-step {
  min-height: 280px;
}
.actions {
  margin-bottom: 12px;
}
.progress-wrap {
  margin-bottom: 16px;
}
.hint {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.result {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 900px) {
  .result {
    grid-template-columns: 1fr;
  }
}
.chart {
  height: 260px;
  width: 100%;
}
.cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mini-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.mini-val {
  font-size: 22px;
  font-weight: 700;
  margin: 4px 0;
}
.mini-sub {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.diag {
  margin-top: 16px;
  animation: diag-pulse 1.2s ease 1;
}
@keyframes diag-pulse {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.06);
  }
}
.pulse-enter-active,
.pulse-leave-active {
  transition: opacity 0.35s ease;
}
.pulse-enter-from,
.pulse-leave-to {
  opacity: 0;
}
</style>
