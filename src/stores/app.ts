import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchDeviceInfo, postRemoveLimit, postSpeedtest } from '@/api/mock'
import { STEP } from '@/flow/steps'
import { useSettingsStore } from '@/stores/settings'
import type { ConsoleLogEntry, DeviceInfo, Diagnosis, RemoveLimitRecord, SpeedTestResult } from '@/types'
import { computeDiagnosis, needsRemoveLimitAction } from '@/utils/diagnosis'
import { cs, diagnosisConsoleLine } from '@/utils/consoleI18n'
import { buildConnectionChannelThrottleTableLines } from '@/utils/removeLimitConnectionTable'
import { getRemoveLimitPhases } from '@/utils/removeLimitPhases'

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
      entryType: 'log',
    }
    const next = [...removeFlowLogs.value, entry]
    removeFlowLogs.value =
      next.length > MAX_REMOVE_FLOW_LOGS ? next.slice(-MAX_REMOVE_FLOW_LOGS) : next
  }

  /** 连接通道收尾：等宽表格行（不打时间戳列，由组件整行展示） */
  function pushRemoveFlowTableLine(message: string) {
    const entry: ConsoleLogEntry = {
      id: logId(),
      time: nowTime(),
      level: 'info',
      message,
      entryType: 'table_line',
    }
    const next = [...removeFlowLogs.value, entry]
    removeFlowLogs.value =
      next.length > MAX_REMOVE_FLOW_LOGS ? next.slice(-MAX_REMOVE_FLOW_LOGS) : next
  }

  /** 进入某阶段时插入：控制台内仅此时显示该阶段进度条 */
  function pushRemoveFlowPhaseHeader(phaseIndex: number, title: string) {
    const entry: ConsoleLogEntry = {
      id: logId(),
      time: nowTime(),
      level: 'info',
      message: title,
      entryType: 'phase_header',
      phaseIndex,
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
    const loc = useSettingsStore().settings.consoleOutputLocale
    pushLog('info', cs(loc).welcome)
  }

  function clearLogs() {
    consoleLogs.value = []
    const loc = useSettingsStore().settings.consoleOutputLocale
    pushLog('info', cs(loc).logCleared)
  }

  function clearSpeedDiagnosisState() {
    diagnosis.value = null
    speedResult.value = null
    speedTestProgress.value = 0
  }

  async function loadDevice() {
    deviceLoading.value = true
    const settings = useSettingsStore()
    const loc = settings.settings.consoleOutputLocale
    pushLog('info', cs(loc).deviceDetectStart)
    try {
      const raw = await fetchDeviceInfo(settings.settings)
      const data = { ...raw, signalDbm: Math.round(raw.signalDbm) }
      deviceInfo.value = data
      removeLimitSucceeded.value = false
      clearSpeedDiagnosisState()
      pushLog(
        'info',
        cs(loc).deviceDetectDone({
          model: data.model,
          networkType: data.networkType,
          operator: data.operator,
          signalDbm: data.signalDbm,
          connectedDevices: data.connectedDevices,
        }),
      )
      pushLog(
        'info',
        cs(loc).planLine(settings.settings.planName, settings.settings.advertisedHighspeedGB),
      )
    } catch {
      pushLog('error', cs(loc).deviceFetchError)
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
    const settings = useSettingsStore()
    const loc = settings.settings.consoleOutputLocale
    pushLog('info', cs(loc).speedTestStart)

    const start = Date.now()
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - start
      speedTestProgress.value = Math.min(100, (elapsed / 5000) * 100)
    }, 40)

    try {
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
      pushLog('info', cs(loc).speedTestDone(result.downloadMbps, result.uploadMbps))
      pushLog(
        diag.severity === 'error' ? 'error' : diag.severity === 'warning' ? 'warning' : 'info',
        diagnosisConsoleLine(diag, loc),
      )
    } catch {
      pushLog('error', cs(loc).speedTestError)
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
    const loc = useSettingsStore().settings.consoleOutputLocale
    pushLog('info', cs(loc).removeSuccessNavigate)
  }

  async function runRemoveLimit() {
    if (!canUseRemoveLimit.value || removeLoading.value) return
    const settings = useSettingsStore()
    const loc = settings.settings.consoleOutputLocale
    if (speedResult.value) speedBeforeRemove.value = { ...speedResult.value }
    removeFlowLogs.value = []
    removeOverallPercent.value = 0
    removePhaseProgress.value = [0, 0, 0, 0]
    removeLoading.value = true
    removeLimitPhase.value = 0
    pushLog('info', cs(loc).removeFlowStart)
    pushRemoveFlowLog('info', cs(loc).removeFlowStart)

    const apiPromise = postRemoveLimit(loc)
    /** 主日志行间隔；表格行略快于主行，略放慢便于阅读 */
    const PACE_MS = 300
    const TABLE_PACE_MS = 220
    const phases = getRemoveLimitPhases(loc)
    const dev = deviceInfo.value
    const connectionTableLines = dev ? buildConnectionChannelThrottleTableLines(dev, loc) : []
    const totalLines = phases.reduce((n, p) => n + p.lines.length, 0) + connectionTableLines.length

    function patchPhaseProgress(phaseIdx: 0 | 1 | 2 | 3, lineIdx: number, lineCount: number) {
      const next: [number, number, number, number] = [0, 0, 0, 0]
      for (let i = 0; i < phaseIdx; i++) next[i] = 100
      next[phaseIdx] = Math.round(((lineIdx + 1) / lineCount) * 100)
      removePhaseProgress.value = next
    }

    try {
      let globalLine = 0
      for (let pi = 0; pi < phases.length; pi++) {
        const phase = phases[pi]!
        removeLimitPhase.value = pi as 0 | 1 | 2 | 3
        pushRemoveFlowPhaseHeader(pi, phase.title)
        const lines = phase.lines
        for (let li = 0; li < lines.length; li++) {
          pushRemoveFlowLog('info', lines[li]!)
          await delay(PACE_MS)
          globalLine++
          patchPhaseProgress(pi as 0 | 1 | 2 | 3, li, lines.length)
          removeOverallPercent.value = Math.min(97, Math.round((globalLine / totalLines) * 97))
        }
        if (pi === 0 && connectionTableLines.length) {
          for (const row of connectionTableLines) {
            pushRemoveFlowTableLine(row)
            await delay(TABLE_PACE_MS)
            globalLine++
            removeOverallPercent.value = Math.min(97, Math.round((globalLine / totalLines) * 97))
          }
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
        pushRemoveFlowLog('info', cs(loc).removeApiDone(res.message))
        pushLog('info', cs(loc).removeMainSuccess(res.message))
      } else {
        removeOverallPercent.value = 100
        pushRemoveFlowLog('warning', cs(loc).removeApiFail(res.message))
        pushLog('warning', cs(loc).removeMainFail(res.message))
        removeLimitPhase.value = -1
      }
    } catch {
      removeOverallPercent.value = 100
      pushRemoveFlowLog('error', cs(loc).removeHandshakeError)
      pushLog('error', cs(loc).removeGenericError)
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
    const loc = useSettingsStore().settings.consoleOutputLocale
    pushLog('info', cs(loc).guideRecorded)
  }

  function goStep(index: 0 | 1 | 2) {
    if (index < 0 || index > 2 || index === currentStep.value) return
    if (index >= 1 && !step0Done.value) return
    if (index === STEP.REMOVE && !step1Done.value) return
    currentStep.value = index
    const loc = useSettingsStore().settings.consoleOutputLocale
    pushLog('info', cs(loc).goStep(index + 1))
  }

  function nextStep() {
    if (currentStep.value === STEP.DEVICE && step0Done.value) goStep(STEP.SPEED)
    else if (currentStep.value === STEP.SPEED && step1Done.value) goStep(STEP.REMOVE)
  }

  function prevStep() {
    if (currentStep.value > STEP.DEVICE) {
      currentStep.value = (currentStep.value - 1) as 0 | 1 | 2
      const loc = useSettingsStore().settings.consoleOutputLocale
      pushLog('info', cs(loc).prevStep(currentStep.value + 1))
    }
  }

  /** 步骤三内「重新诊断」：仅回到步骤二并清空测速结论，不标记去限速成功 */
  function resetDiagnosisForRetest() {
    clearSpeedDiagnosisState()
    currentStep.value = STEP.SPEED
    const loc = useSettingsStore().settings.consoleOutputLocale
    pushLog('info', cs(loc).resetDiagnosis)
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
