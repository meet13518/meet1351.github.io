<script setup lang="ts">
import { DocumentCopy } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { getThresholds } from '@/utils/diagnosis'
import RemoveFlowConsole from '@/components/RemoveFlowConsole.vue'

const store = useAppStore()
const guideVisible = ref(false)
/** 一键去控：弹窗内展示去控控制台日志 */
const removeConsoleVisible = ref(false)

const guideText = `1. 重启随身 WiFi 与终端，等待 2 分钟后再测速。\n2. 拨打运营商客服：说明「疑似后台限速」，要求刷新套餐策略。\n3. 若仍异常，保留测速截图并向设备购买渠道反馈。`

const disableRemove = computed(
  () => !store.canUseRemoveLimit || store.removeLimitSucceeded || store.removeLoading,
)

const buttonText = computed(() => {
  if (!store.diagnosis) return '请先完成网速诊断'
  if (store.removeLimitSucceeded) return '已完成去控，请验证测速'
  if (!store.canUseRemoveLimit) return '无需操作'
  return '一键去除限速'
})

const removeDisabledHint = computed(() => {
  if (store.removeLoading) return '去控进行中，请稍候…'
  if (store.removeLimitSucceeded) return '请先查看上方诊断数据并前往验证测速'
  return '当前诊断无需执行去限速'
})

/** 去控进行中：当前步骤（0～3 对应四个阶段） */
const removeStepActive = computed(() => {
  const p = store.removeLimitPhase
  if (p < 0) return 0
  return Math.min(p, 3)
})

async function onRemoveLimitClick() {
  removeConsoleVisible.value = true
  await store.runRemoveLimit()
}

async function copyGuide() {
  try {
    await navigator.clipboard.writeText(guideText)
    store.addGuideRecord('已复制自助话术')
    ElMessage.success('话术已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}
</script>

<template>
  <div class="remove-step">
    <transition name="fade">
      <el-card v-if="store.removeLoading" shadow="never" class="process-card">
        <div class="process-title">去控进行中</div>
        <el-steps :active="removeStepActive" align-center finish-status="success">
          <el-step title="连接通道" description="与设备管理通道握手" />
          <el-step title="扫描策略" description="识别限速相关进程" />
          <el-step title="执行去控" description="下发解除与同步指令" />
          <el-step title="同步侧" description="等待运营商策略刷新" />
        </el-steps>
        <el-progress
          class="process-bar"
          :percentage="Math.min(100, Math.max(0, (removeStepActive + 1) * 25))"
          :stroke-width="12"
          striped
          striped-flow
        />
        <p class="process-hint">请稍候，去控过程约 8 秒…</p>
      </el-card>
    </transition>

    <transition name="fade">
      <el-card v-if="store.removeLimitSucceeded && store.diagnosis && store.speedResult" shadow="never" class="snapshot-card">
        <el-result icon="success" title="去控成功" sub-title="以下为去控前本次网速诊断数据，请核对后再前往验证测速。">
          <template #extra>
            <div class="snapshot-body">
              <el-descriptions :column="1" border size="small" class="snapshot-desc">
                <el-descriptions-item label="诊断结论">{{ store.diagnosis.conclusion }}</el-descriptions-item>
                <el-descriptions-item label="建议">{{ store.diagnosis.suggestion }}</el-descriptions-item>
              </el-descriptions>
              <div v-if="store.deviceInfo" class="mini-grid">
                <div class="mini">
                  <div class="mini-label">下行</div>
                  <div class="mini-val">{{ store.speedResult.downloadMbps }} Mbps</div>
                  <div class="mini-sub">阈值 ≥ {{ getThresholds(store.deviceInfo.networkType).download }} Mbps</div>
                </div>
                <div class="mini">
                  <div class="mini-label">上行</div>
                  <div class="mini-val">{{ store.speedResult.uploadMbps }} Mbps</div>
                  <div class="mini-sub">阈值 ≥ {{ getThresholds(store.deviceInfo.networkType).upload }} Mbps</div>
                </div>
                <div class="mini">
                  <div class="mini-label">延迟</div>
                  <div class="mini-val">{{ store.speedResult.latencyMs }} ms</div>
                  <div class="mini-sub">阈值 ≤ {{ getThresholds(store.deviceInfo.networkType).latency }} ms</div>
                </div>
                <div class="mini">
                  <div class="mini-label">抖动</div>
                  <div class="mini-val">{{ store.speedResult.jitterMs }} ms</div>
                  <div class="mini-sub">阈值 ≤ {{ getThresholds(store.deviceInfo.networkType).jitter }} ms</div>
                </div>
              </div>
              <el-button type="primary" size="large" class="verify-btn" @click="store.goVerifySpeedAfterRemove">
                前往网速诊断验证
              </el-button>
            </div>
          </template>
        </el-result>
      </el-card>
    </transition>

    <el-descriptions
      v-if="store.diagnosis && !store.removeLimitSucceeded"
      :column="1"
      border
      class="desc"
    >
      <el-descriptions-item label="诊断结论">{{ store.diagnosis.conclusion }}</el-descriptions-item>
      <el-descriptions-item label="建议">{{ store.diagnosis.suggestion }}</el-descriptions-item>
    </el-descriptions>

    <div class="row">
      <el-tooltip :disabled="!disableRemove" :content="removeDisabledHint" placement="top">
        <span class="wrap-btn">
          <el-button
            type="danger"
            :disabled="disableRemove"
            :loading="store.removeLoading"
            @click="onRemoveLimitClick"
          >
            {{ buttonText }}
          </el-button>
        </span>
      </el-tooltip>
      <el-button @click="guideVisible = true">自助指南</el-button>
      <el-button type="primary" plain :disabled="!store.step1Done" @click="store.resetDiagnosisForRetest">
        重新诊断
      </el-button>
    </div>

    <el-table v-if="store.removeLimitRecords.length" :data="store.removeLimitRecords" stripe class="table" size="small">
      <el-table-column prop="timestamp" label="时间" width="170" />
      <el-table-column prop="method" label="方式">
        <template #default="{ row }">
          <el-tag size="small" :type="row.method === 'api' ? 'primary' : 'success'">
            {{ row.method === 'api' ? '接口' : '自助' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="success" label="结果" width="90">
        <template #default="{ row }">
          <span :class="row.success ? 'ok' : 'fail'">{{ row.success ? '成功' : '失败' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="message" label="说明" />
    </el-table>

    <el-dialog v-model="guideVisible" title="自助指南" width="520px">
      <pre class="guide-pre">{{ guideText }}</pre>
      <template #footer>
        <el-button @click="guideVisible = false">关闭</el-button>
        <el-button type="primary" :icon="DocumentCopy" @click="copyGuide">一键复制话术</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="removeConsoleVisible"
      title="去控控制台"
      width="min(640px, 92vw)"
      class="remove-console-dialog"
      :close-on-click-modal="!store.removeLoading"
      :close-on-press-escape="!store.removeLoading"
      :show-close="!store.removeLoading"
      destroy-on-close
      append-to-body
      align-center
    >
      <RemoveFlowConsole
        :logs="store.removeFlowLogs"
        :overall-percent="store.removeOverallPercent"
        :phase-progress="store.removePhaseProgress"
        :loading="store.removeLoading"
      />
      <template #footer>
        <el-button type="primary" :disabled="store.removeLoading" @click="removeConsoleVisible = false">
          {{ store.removeLoading ? '去控进行中…' : '关闭' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.remove-step {
  min-height: 220px;
}
.process-card {
  margin-bottom: 16px;
  border-radius: 12px;
}
.process-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
}
.process-bar {
  margin-top: 20px;
}
.process-hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.snapshot-card {
  margin-bottom: 16px;
  border-radius: 12px;
}
.snapshot-body {
  max-width: 560px;
  margin: 0 auto;
  text-align: left;
}
.snapshot-desc {
  margin-bottom: 14px;
}
.mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
@media (max-width: 520px) {
  .mini-grid {
    grid-template-columns: 1fr;
  }
}
.mini {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}
.mini-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.mini-val {
  font-size: 20px;
  font-weight: 700;
  margin: 4px 0;
}
.mini-sub {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.verify-btn {
  width: 100%;
}
.desc {
  margin-bottom: 16px;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
}
.wrap-btn {
  display: inline-flex;
}
.table {
  width: 100%;
}
.ok {
  color: var(--el-color-success);
  font-weight: 600;
}
.fail {
  color: var(--el-color-danger);
  font-weight: 600;
}
.guide-pre {
  white-space: pre-wrap;
  font-family: inherit;
  line-height: 1.6;
  margin: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.remove-console-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
}
</style>
