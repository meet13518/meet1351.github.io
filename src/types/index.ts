export interface DeviceInfo {
  model: string
  networkType: '4G' | '5G'
  /** 信号强度（dBm），界面与日志仅展示整数 */
  signalDbm: number
  operator: string
  connectedDevices: number
  totalTrafficGB: number
  remainingHighspeedGB: number
  /** 商家流量虚标比例（%），非虚标场景为 0 */
  virtualRatioPercent: number
  /** 是否检测到限速程序 */
  limitProgramDetected: boolean
  /** 检测阶段输出的限速状态（四选一） */
  limitedStatus: 'normal' | 'signal_weak' | 'operator_limit' | 'vendor_virtual_limit'
}

export interface SpeedTestResult {
  downloadMbps: number
  uploadMbps: number
  latencyMs: number
  jitterMs: number
}

export interface Diagnosis {
  conclusion: string
  severity: 'info' | 'warning' | 'error'
  suggestion: string
  /** 是否建议执行去除限速（与结论文案解耦，便于多语言） */
  eligibleForRemoveLimit: boolean
  /** 控制台英文行（界面仍以 conclusion/suggestion 为主） */
  conclusionEn: string
  suggestionEn: string
}

export interface RemoveLimitRecord {
  timestamp: string
  method: 'api' | 'guide'
  success: boolean
  message: string
}

export interface ConsoleLogEntry {
  id: string
  time: string
  level: 'info' | 'warning' | 'error'
  message: string
  /** 去控控制台：阶段开始行；table_line 为等宽表格打印行 */
  entryType?: 'log' | 'phase_header' | 'table_line'
  /** 与 removeLimitPhase 一致，0～3 */
  phaseIndex?: number
}
