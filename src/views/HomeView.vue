<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import StepProgress from '@/components/StepProgress.vue'
import DeviceInfoStep from '@/components/steps/DeviceInfoStep.vue'
import SpeedTestStep from '@/components/steps/SpeedTestStep.vue'
import RemoveLimitStep from '@/components/steps/RemoveLimitStep.vue'

const store = useAppStore()

const stepTitles = ['设备信息检测', '网速诊断', '一键去除限速']

onMounted(() => {
  store.welcome()
})

function primaryNextLabel(): string {
  if (store.currentStep === 0) return '下一步'
  if (store.currentStep === 1) return '下一步'
  return '完成'
}

function canNext(): boolean {
  if (store.currentStep === 0) return store.step0Done
  if (store.currentStep === 1) return store.step1Done
  return false
}
</script>

<template>
  <div class="home-view">
    <main class="main">
      <section class="flow-pane">
        <StepProgress />
        <h2 class="flow-title">{{ stepTitles[store.currentStep] }}</h2>
        <transition name="flow-fade" mode="out-in">
          <DeviceInfoStep v-if="store.currentStep === 0" key="s0" />
          <SpeedTestStep v-else-if="store.currentStep === 1" key="s1" />
          <RemoveLimitStep v-else key="s2" />
        </transition>
        <div class="flow-footer">
          <el-button :disabled="store.currentStep === 0" @click="store.prevStep">上一步</el-button>
          <el-button v-if="store.currentStep < 2" type="primary" :disabled="!canNext()" @click="store.nextStep">
            {{ primaryNextLabel() }}
          </el-button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 24px 20px 32px;
  width: 100%;
  box-sizing: border-box;
}
.flow-pane {
  width: 100%;
  max-width: 880px;
  min-width: 0;
  margin: 0 auto;
  padding: 28px 32px 24px;
  background: var(--el-bg-color);
  border: 1px solid var(--mifi-border);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow);
}
@media (max-width: 640px) {
  .flow-pane {
    padding: 20px 16px 18px;
  }
}
.flow-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
}
.flow-footer {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 8px;
  border-top: 1px solid var(--mifi-border);
}
</style>
