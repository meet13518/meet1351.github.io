<script setup lang="ts">
import { Check } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import type { StepIndex } from '@/flow/steps'

const store = useAppStore()

const labels = ['信息检测', '网速诊断', '去除限速']

function stepStatus(i: number): 'wait' | 'process' | 'finish' {
  if (i < store.currentStep) return 'finish'
  if (i === store.currentStep) return 'process'
  return 'wait'
}

function onStepClick(i: number) {
  if (i === 0) store.goStep(0)
  else if (i === 1 && store.step0Done) store.goStep(1 as StepIndex)
  else if (i === 2 && store.step1Done) store.goStep(2 as StepIndex)
}
</script>

<template>
  <div class="step-progress" role="navigation" aria-label="主流程步骤">
    <template v-for="(label, i) in labels" :key="label">
      <button
        type="button"
        class="step"
        :class="[stepStatus(i), { clickable: i === 0 || (i === 1 && store.step0Done) || (i === 2 && store.step1Done) }]"
        :disabled="!(i === 0 || (i === 1 && store.step0Done) || (i === 2 && store.step1Done))"
        @click="onStepClick(i)"
      >
        <span class="dot">
          <el-icon v-if="stepStatus(i) === 'finish'" class="check"><Check /></el-icon>
          <span v-else class="num">{{ i + 1 }}</span>
        </span>
        <span class="label">{{ label }}</span>
      </button>
      <span v-if="i < labels.length - 1" class="sep" aria-hidden="true" />
    </template>
  </div>
</template>

<style scoped>
.step-progress {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  padding: 12px 0 16px;
}
.step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  cursor: default;
  font: inherit;
  color: var(--el-text-color-secondary);
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;
}
.step.clickable:not(:disabled) {
  cursor: pointer;
}
.step.clickable:not(:disabled):hover {
  background: var(--el-fill-color-light);
}
.step.process {
  color: var(--el-color-primary);
  font-weight: 600;
}
.step.finish {
  color: var(--el-color-success);
}
.dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid currentColor;
  font-size: 13px;
}
.process .dot {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.finish .dot {
  border-color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}
.check {
  font-size: 16px;
}
.sep {
  width: 20px;
  height: 2px;
  background: var(--el-border-color);
  border-radius: 1px;
  flex-shrink: 0;
}
</style>
