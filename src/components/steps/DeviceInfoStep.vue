<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'

const store = useAppStore()
const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

/** 信号强度仅使用整数 dBm 展示与计算 */
function signalDbmInt(dbm: number): number {
  return Math.round(dbm)
}

function signalPercent(dbm: number): number {
  const n = signalDbmInt(dbm)
  return Math.max(0, Math.min(100, ((n + 100) / 50) * 100))
}

function signalLabel(dbm: number): string {
  const n = signalDbmInt(dbm)
  if (n >= -70) return '优秀'
  if (n >= -85) return '良好'
  if (n >= -95) return '一般'
  return '较弱'
}

const detectButtonText = computed(() => (store.deviceInfo ? '重新检测' : '开始检测'))
</script>

<template>
  <div class="device-step">
    <div v-if="!store.deviceInfo && store.deviceLoading" class="loading-wrap">
      <el-skeleton :rows="6" animated />
    </div>
    <div v-else-if="store.deviceInfo" class="device-body">
      <el-card class="plan-banner" shadow="never">
        <div class="plan-grid">
          <div class="plan-item">
            <span class="plan-label">购买套餐</span>
            <span class="plan-value">{{ settings.planName }}</span>
          </div>
          <div class="plan-item">
            <span class="plan-label">套餐内高速流量（宣传）</span>
            <span class="plan-value">{{ settings.advertisedHighspeedGB }} GB</span>
          </div>
        </div>
      </el-card>
      <div class="grid">
        <el-card class="metric-card" :style="{ animationDelay: '0s' }" shadow="hover">
          <div class="metric-title">设备型号</div>
          <div class="metric-value">
            <span class="icon" aria-hidden="true">📱</span>
            {{ store.deviceInfo.model }}
          </div>
        </el-card>
        <el-card class="metric-card" :style="{ animationDelay: '0.1s' }" shadow="hover">
          <div class="metric-title">网络制式</div>
          <el-tag type="primary" size="large">{{ store.deviceInfo.networkType }} LTE</el-tag>
        </el-card>
        <el-card class="metric-card" :style="{ animationDelay: '0.2s' }" shadow="hover">
          <div class="metric-title">信号强度</div>
          <el-progress
            type="dashboard"
            :percentage="signalPercent(store.deviceInfo.signalDbm)"
            :color="['#f56c6c', '#e6a23c', '#67c23a']"
          />
          <div class="sub">
            {{ signalDbmInt(store.deviceInfo.signalDbm) }} dBm（{{ signalLabel(store.deviceInfo.signalDbm) }}）
          </div>
        </el-card>
        <el-card class="metric-card" :style="{ animationDelay: '0.3s' }" shadow="hover">
          <div class="metric-title">运营商</div>
          <div class="metric-value">{{ store.deviceInfo.operator }}</div>
        </el-card>
        <el-card class="metric-card" :style="{ animationDelay: '0.4s' }" shadow="hover">
          <div class="metric-title">连接设备数</div>
          <div class="metric-big">{{ store.deviceInfo.connectedDevices }} 台</div>
        </el-card>
      </div>
    </div>
    <el-empty
      v-else
      description="尚未检测设备信息，请先点击开始检测。"
      :image-size="120"
      class="empty-state"
    />
    <div class="toolbar">
      <el-button :loading="store.deviceLoading" type="primary" @click="store.loadDevice">{{ detectButtonText }}</el-button>
    </div>
  </div>
</template>

<style scoped>
.device-step {
  min-height: 320px;
}
.loading-wrap {
  padding: 8px 0;
}
.device-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.plan-banner {
  border-radius: 12px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-5);
}
.plan-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 720px) {
  .plan-grid {
    grid-template-columns: 1fr;
  }
}
.plan-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.plan-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.plan-value {
  font-size: 15px;
  font-weight: 600;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
.metric-card {
  animation: card-in 0.45s ease both;
}
@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.metric-title {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}
.metric-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}
.metric-big {
  font-size: 28px;
  font-weight: 700;
}
.sub {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.toolbar {
  margin-top: 16px;
}
.empty-state {
  padding: 8px 0 2px;
}
.icon {
  font-size: 20px;
}
</style>
