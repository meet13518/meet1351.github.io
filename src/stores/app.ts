import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchDeviceInfo, postRemoveLimit, postSpeedtest } from '@/api/mock'
import { STEP } from '@/flow/steps'
import { useSettingsStore } from '@/stores/settings'
import type { ConsoleLogEntry, DeviceInfo, Diagnosis, RemoveLimitRecord, SpeedTestResult } from '@/types'
import { computeDiagnosis, needsRemoveLimitAction } from '@/utils/diagnosis'
import { REMOVE_LIMIT_PHASES } from '@/utils/removeLimitPhases'

const MAX_LOGS = 200
const MAX_REMOVE_FLOW_LOGS = 220
const MAX_RECORDS = 5

function nowTime(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function logId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 流程（与产品一致）：
 * 1. 进入主页：不自动检测，仅可去配置页。
 * 2. 步骤一：用户点击「开始检测」→ loadDevice（按配置生成 deviceInfo），完成后可进入步骤二。
 * 3. 步骤二：用户点击「开始诊断」→ 测速 + computeDiagnosis，完成后可进入步骤三。
 * 4. 步骤三：若诊断为运营商/商家限速，可「一键去除限速」；成功后标记 removeLimitSucceeded，
 *    清空本次测速结论并自动回到步骤二，用户须再次「开始诊断」（此时强制正常速率）。
 * 5. 重新点击「开始检测」会重置 removeLimitSucceeded，恢复按配置的测速行为。
 */
export const useAppStore = defineStore('app', () => {
  const currentStep = ref<0 | 1 | 2>(STEP.DEVICE)
  const deviceInfo = ref<DeviceInfo | null>(null)
  const deviceLoading = ref(false)
  const speedResult = ref<SpeedTestResult | null>(null)
  const diagnosis = ref<Diagnosis | null>(null)
  const speedTestRunning = ref(false)
  const speedTestProgress = ref(0)
  const removeLoading = ref(false)
  /** 去控过程阶段 0～3 为进行中，4 为完成（仅在一次去控流程内用于展示） */
  const removeLimitPhase = ref(-1)
  const consoleLogs = ref<ConsoleLogEntry[]>([])
  /** 一键去控弹窗内专用日志（与主控制台分离） */
  const removeFlowLogs = ref<ConsoleLogEntry[]>([])
  /** 去控总进度 0～100（弹窗内进度条） */
  const removeOverallPercent = ref(0)
  /** 四个关键子流程进度（连接通道 / 扫描策略 / 执行去控 / 同步侧） */
  const removePhaseProgress = ref<[number, number, number, number]>([0, 0, 0, 0])
  const removeLimitRecords = ref<RemoveLimitRecord[]>([])
  const speedBeforeRemove = ref<SpeedTestResult | null>(null)
  /** 去除限速成功后，下一次及之后测速强制指标达标，直至重新「开始检测」 */
  const removeLimitSucceeded = ref(false)

  const step0Done = computed(() => deviceInfo.value !== null)
  const step1Done = computed(() => diagnosis.value !== null)
  const canUseRemoveLimit = computed(() => diagnosis.value !== null && needsRemoveLimitAction(diagnosis.value))

  function pushRemoveFlowLog(level: ConsoleLogEntry['level'], message: string) {
    const entry: ConsoleLogEntry = {
      id: logId(),
      time: nowTime(),
      level,
      message,
    }
    const next = [...removeFlowLogs.value, entry]
    removeFlowLogs.value =
      next.length > MAX_REMOVE_FLOW_LOGS ? next.slice(-MAX_REMOVE_FLOW_LOGS) : next
  }

  function pushLog(level: ConsoleLogEntry['level'], message: string) {
    const entry: ConsoleLogEntry = {
      id: logId(),
      time: nowTime(),
      level,
      message,
    }
    const next = [...consoleLogs.value, entry]
    consoleLogs.value = next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next
  }

  /** 首页挂载时调用一次：不写设备检测日志 */
  function welcome() {
    pushLog('info', '随身 WiFi 管家已就绪。请先完成「信息检测」，或前往「帮助 → 应用配置」调整检测与诊断参数。')
  }

  function clearLogs() {
    consoleLogs.value = []
    pushLog('info', '日志已清空')
  }

  function clearSpeedDiagnosisState() {
    diagnosis.value = null
    speedResult.value = null
    speedTestProgress.value = 0
  }

  async function loadDevice() {
    deviceLoading.value = true
    pushLog('info', '开始检测设备信息…')
    try {
      const settings = useSettingsStore()
      const raw = await fetchDeviceInfo(settings.settings)
      const data = { ...raw, signalDbm: Math.round(raw.signalDbm) }
      deviceInfo.value = data
      removeLimitSucceeded.value = false
      clearSpeedDiagnosisState()
      pushLog(
        'info',
        `检测完成：${data.model}，${data.networkType}，${data.operator}，信号 ${data.signalDbm} dBm，连接 ${data.connectedDevices} 台`,
      )
      pushLog('info', `套餐：${settings.settings.planName}，宣传高速 ${settings.settings.advertisedHighspeedGB} GB`)
    } catch {
      pushLog('error', '设备信息获取失败')
    } finally {
      deviceLoading.value = false
    }
  }

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function runSpeedTestFlow() {
    if (!deviceInfo.value || speedTestRunning.value) return
    speedTestRunning.value = true
    clearSpeedDiagnosisState()
    pushLog('info', '开始网速诊断（约 5 秒）…')

    const start = Date.now()
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - start
      speedTestProgress.value = Math.min(100, (elapsed / 5000) * 100)
    }, 40)

    try {
      const settings = useSettingsStore()
      const [result] = await Promise.all([
        postSpeedtest(deviceInfo.value, settings.settings, { forceNormal: removeLimitSucceeded.value }),
        delay(5000),
      ])
      speedResult.value = result
      const diag = computeDiagnosis(deviceInfo.value, result, {
        weakSignalDbm: settings.settings.weakSignalDbm,
        vendorVirtualPercent: settings.settings.vendorVirtualPercent,
        afterSuccessfulRemoveLimit: removeLimitSucceeded.value,
      })
      diagnosis.value = diag
      pushLog('info', `测速完成：下行 ${result.downloadMbps} Mbps，上行 ${result.uploadMbps} Mbps`)
      pushLog(
        diag.severity === 'error' ? 'error' : diag.severity === 'warning' ? 'warning' : 'info',
        `诊断结论：${diag.conclusion} — ${diag.suggestion}`,
      )
    } catch {
      pushLog('error', '测速过程异常')
    } finally {
      window.clearInterval(timer)
      speedTestProgress.value = 100
      speedTestRunning.value = false
    }
  }

  /** 去除限速成功：回到网速诊断并清空结论，引导用户再次测速验证 */
  function navigateToSpeedStepAfterRemove() {
    clearSpeedDiagnosisState()
    currentStep.value = STEP.SPEED
    pushLog(
      'info',
      '去除限速成功，已自动返回「网速诊断」。请点击「开始诊断」验证上下行是否已恢复正常。',
    )
  }

  async function runRemoveLimit() {
    if (!canUseRemoveLimit.value || removeLoading.value) return
    if (speedResult.value) speedBeforeRemove.value = { ...speedResult.value }
    removeFlowLogs.value = []
    removeOverallPercent.value = 0
    removePhaseProgress.value = [0, 0, 0, 0]
    removeLoading.value = true
    removeLimitPhase.value = 0
    pushLog('info', '开始去控：连接设备并下发解除指令…')

    const apiPromise = postRemoveLimit()
    /** 约 8s：32 行 × 250ms；与四阶段进度（文本条）同步 */
    const PACE_MS = 250
    const totalLines = REMOVE_LIMIT_PHASES.reduce((n, p) => n + p.lines.length, 0)

    function patchPhaseProgress(phaseIdx: 0 | 1 | 2 | 3, lineIdx: number, lineCount: number) {
      const next: [number, number, number, number] = [0, 0, 0, 0]
      for (let i = 0; i < phaseIdx; i++) next[i] = 100
      next[phaseIdx] = Math.round(((lineIdx + 1) / lineCount) * 100)
      removePhaseProgress.value = next
    }

    try {
      let globalLine = 0
      for (let pi = 0; pi < REMOVE_LIMIT_PHASES.length; pi++) {
        const phase = REMOVE_LIMIT_PHASES[pi]!
        removeLimitPhase.value = pi as 0 | 1 | 2 | 3
        const lines = phase.lines
        for (let li = 0; li < lines.length; li++) {
          pushRemoveFlowLog('info', lines[li]!)
          await delay(PACE_MS)
          globalLine++
          patchPhaseProgress(pi as 0 | 1 | 2 | 3, li, lines.length)
          removeOverallPercent.value = Math.min(97, Math.round((globalLine / totalLines) * 97))
        }
      }
      removeOverallPercent.value = 98
      removePhaseProgress.value = [100, 100, 100, 100]

      const res = await apiPromise

      const rec: RemoveLimitRecord = {
        timestamp: nowTime(),
        method: 'api',
        success: res.success,
        message: res.message,
      }
      removeLimitRecords.value = [rec, ...removeLimitRecords.value].slice(0, MAX_RECORDS)
      if (res.success) {
        removeLimitPhase.value = 4
        removeLimitSucceeded.value = true
        removeOverallPercent.value = 100
        pushRemoveFlowLog('info', `[完成] 去控请求已受理：${res.message}`)
        pushLog('info', `去控成功：${res.message}。下方为本次诊断数据，可前往网速诊断验证恢复效果。`)
      } else {
        removeOverallPercent.value = 100
        pushRemoveFlowLog('warning', `[失败] 一键解除未通过：${res.message}`)
        pushLog('warning', `一键解除失败：${res.message}`)
        removeLimitPhase.value = -1
      }
    } catch {
      removeOverallPercent.value = 100
      pushRemoveFlowLog('error', '请求异常：与设备或核心网策略通道握手超时，请稍后重试。')
      pushLog('error', '请求异常')
      removeLimitPhase.value = -1
    } finally {
      removeLoading.value = false
      if (removeLimitPhase.value === 4) {
        window.setTimeout(() => {
          removeLimitPhase.value = -1
        }, 400)
      }
    }
  }

  /** 去控成功后由用户点击，进入网速诊断并清空本次结论以便重新测速验证 */
  function goVerifySpeedAfterRemove() {
    navigateToSpeedStepAfterRemove()
  }

  function addGuideRecord(message: string) {
    const rec: RemoveLimitRecord = {
      timestamp: nowTime(),
      method: 'guide',
      success: true,
      message,
    }
    removeLimitRecords.value = [rec, ...removeLimitRecords.value].slice(0, MAX_RECORDS)
    pushLog('info', '已记录自助引导操作')
  }

  function goStep(index: 0 | 1 | 2) {
    if (index < 0 || index > 2 || index === currentStep.value) return
    if (index >= 1 && !step0Done.value) return
    if (index === STEP.REMOVE && !step1Done.value) return
    currentStep.value = index
    pushLog('info', `切换至步骤 ${index + 1}`)
  }

  function nextStep() {
    if (currentStep.value === STEP.DEVICE && step0Done.value) goStep(STEP.SPEED)
    else if (currentStep.value === STEP.SPEED && step1Done.value) goStep(STEP.REMOVE)
  }

  function prevStep() {
    if (currentStep.value > STEP.DEVICE) {
      currentStep.value = (currentStep.value - 1) as 0 | 1 | 2
      pushLog('info', `返回步骤 ${currentStep.value + 1}`)
    }
  }

  /** 步骤三内「重新诊断」：仅回到步骤二并清空测速结论，不标记去限速成功 */
  function resetDiagnosisForRetest() {
    clearSpeedDiagnosisState()
    currentStep.value = STEP.SPEED
    pushLog('info', '已返回网速诊断，请点击「开始诊断」重新测速')
  }

  return {
    currentStep,
    deviceInfo,
    deviceLoading,
    speedResult,
    diagnosis,
    speedTestRunning,
    speedTestProgress,
    removeLoading,
    removeLimitPhase,
    consoleLogs,
    removeFlowLogs,
    removeOverallPercent,
    removePhaseProgress,
    removeLimitRecords,
    speedBeforeRemove,
    removeLimitSucceeded,
    step0Done,
    step1Done,
    canUseRemoveLimit,
    welcome,
    pushLog,
    clearLogs,
    loadDevice,
    runSpeedTestFlow,
    runRemoveLimit,
    goVerifySpeedAfterRemove,
    addGuideRecord,
    goStep,
    nextStep,
    prevStep,
    resetDiagnosisForRetest,
  }
})
