import type { Diagnosis } from '@/types'
import type { ConsoleOutputLocale } from '@/types/settings'

export function diagnosisConsoleLine(d: Diagnosis, locale: ConsoleOutputLocale): string {
  if (locale === 'en') {
    return `Diagnosis: ${d.conclusionEn} — ${d.suggestionEn}`
  }
  return `诊断结论：${d.conclusion} — ${d.suggestion}`
}

export const consoleStrings = {
  zh: {
    welcome:
      '随身 WiFi 管家已就绪。请先完成「信息检测」，或前往「帮助 → 应用配置」调整检测与诊断参数。',
    logCleared: '日志已清空',
    deviceDetectStart: '开始检测设备信息…',
    deviceDetectDone: (p: {
      model: string
      networkType: string
      operator: string
      signalDbm: number
      connectedDevices: number
    }) =>
      `检测完成：${p.model}，${p.networkType}，${p.operator}，信号 ${p.signalDbm} dBm，连接 ${p.connectedDevices} 台`,
    planLine: (planName: string, gb: number) => `套餐：${planName}，宣传高速 ${gb} GB`,
    deviceFetchError: '设备信息获取失败',
    speedTestStart: '开始网速诊断（约 5 秒）…',
    speedTestDone: (dl: number, ul: number) => `测速完成：下行 ${dl} Mbps，上行 ${ul} Mbps`,
    speedTestError: '测速过程异常',
    removeSuccessNavigate:
      '去除限速成功，已自动返回「网速诊断」。请点击「开始诊断」验证上下行是否已恢复正常。',
    removeFlowStart: '开始去控：连接设备并下发解除指令…',
    removeApiDone: (msg: string) => `[完成] 去控请求已受理：${msg}`,
    removeMainSuccess: (msg: string) =>
      `去控成功：${msg}。下方为本次诊断数据，可前往网速诊断验证恢复效果。`,
    removeApiFail: (msg: string) => `[失败] 一键解除未通过：${msg}`,
    removeMainFail: (msg: string) => `一键解除失败：${msg}`,
    removeHandshakeError: '请求异常：与设备或核心网策略通道握手超时，请稍后重试。',
    removeGenericError: '请求异常',
    guideRecorded: '已记录自助引导操作',
    goStep: (n: number) => `切换至步骤 ${n}`,
    prevStep: (n: number) => `返回步骤 ${n}`,
    resetDiagnosis: '已返回网速诊断，请点击「开始诊断」重新测速',
  },
  en: {
    welcome:
      'MiFi console ready. Complete device scan first, or open Help → App settings to tune detection and diagnosis.',
    logCleared: 'Log cleared',
    deviceDetectStart: 'Starting device discovery…',
    deviceDetectDone: (p: {
      model: string
      networkType: string
      operator: string
      signalDbm: number
      connectedDevices: number
    }) =>
      `Discovery OK: ${p.model}, ${p.networkType}, ${p.operator}, RSRP/RSRP ${p.signalDbm} dBm, ${p.connectedDevices} client(s)`,
    planLine: (planName: string, gb: number) => `Plan: ${planName}, advertised high-speed ${gb} GB`,
    deviceFetchError: 'Device info fetch failed',
    speedTestStart: 'Starting throughput diagnosis (~5 s)…',
    speedTestDone: (dl: number, ul: number) =>
      `Throughput: DL ${dl} Mbps, UL ${ul} Mbps`,
    speedTestError: 'Speed test error',
    removeSuccessNavigate:
      'Rate-limit removal succeeded; returned to throughput step. Run diagnosis again to verify DL/UL.',
    removeFlowStart: 'Removal: connecting management plane and pushing unlock…',
    removeApiDone: (msg: string) => `[OK] Removal accepted: ${msg}`,
    removeMainSuccess: (msg: string) =>
      `Removal OK: ${msg}. Use diagnosis data below; re-run speed test to verify.`,
    removeApiFail: (msg: string) => `[FAIL] Removal rejected: ${msg}`,
    removeMainFail: (msg: string) => `Removal failed: ${msg}`,
    removeHandshakeError:
      'Error: policy-plane handshake timeout (device or core). Retry later.',
    removeGenericError: 'Request error',
    guideRecorded: 'Self-service guide action recorded',
    goStep: (n: number) => `Switched to step ${n}`,
    prevStep: (n: number) => `Back to step ${n}`,
    resetDiagnosis: 'Returned to throughput diagnosis; tap Start to retest',
  },
} as const

export function cs(locale: ConsoleOutputLocale) {
  return locale === 'en' ? consoleStrings.en : consoleStrings.zh
}

/** 控制台壳层文案（标题、空状态等），与日志行语言一致 */
export const consoleUi = {
  zh: {
    realtimeTitle: '实时控制台',
    realtimeSub: '. / bash — 终端',
    removeTitle: '去控控制台',
    removeSub: '日志流 · GTP / PFCP / PCC',
    clear: '清空',
    waitRealtime: '等待输出…',
    waitRemove: '等待指令…',
    overallPrefix: '总进度',
    phaseLine: (n: number, title: string) => `# 阶段 ${n}/4 · ${title}`,
    copyOk: '已复制',
    copyFail: '复制失败',
    ariaRealtime: '终端输出，可滚动查看',
    ariaRemove: '去控过程输出',
  },
  en: {
    realtimeTitle: 'Live console',
    realtimeSub: '. / bash — tty',
    removeTitle: 'Removal console',
    removeSub: 'Log · GTP / PFCP / PCC',
    clear: 'Clear',
    waitRealtime: 'Waiting for output…',
    waitRemove: 'Idle…',
    overallPrefix: 'Total',
    phaseLine: (n: number, title: string) => `# Phase ${n}/4 · ${title}`,
    copyOk: 'Copied',
    copyFail: 'Copy failed',
    ariaRealtime: 'Terminal output, scrollable',
    ariaRemove: 'Removal procedure output',
  },
} as const

export function cui(locale: ConsoleOutputLocale) {
  return locale === 'en' ? consoleUi.en : consoleUi.zh
}
