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
}
