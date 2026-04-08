import type { DeviceInfo, Diagnosis, SpeedTestResult } from '@/types'

export interface DiagnosisOptions {
  /** 信号弱阈值（dBm），低于此值优先判定为信号问题 */
  weakSignalDbm: number
  /** 商家虚标比例（%） */
  vendorVirtualPercent?: number
  /** 已成功执行去除限速后的再次测速：若指标已达标则优先判定为网络正常 */
  afterSuccessfulRemoveLimit?: boolean
}

const defaultDiagOptions: DiagnosisOptions = {
  weakSignalDbm: -95,
}

export interface SpeedThresholds {
  download: number
  upload: number
  latency: number
  jitter: number
}

/** 网络正常时下行速率区间（Mbps），与测速生成逻辑一致 */
export const NORMAL_DOWNLOAD_MBPS = { min: 60, max: 100 } as const

export function getThresholds(network: DeviceInfo['networkType']): SpeedThresholds {
  if (network === '5G') {
    return { download: 60, upload: 15, latency: 40, jitter: 20 }
  }
  return { download: 60, upload: 10, latency: 80, jitter: 30 }
}

function metricsNormal(speed: SpeedTestResult, t: SpeedThresholds): boolean {
  return (
    speed.downloadMbps >= t.download &&
    speed.uploadMbps >= t.upload &&
    speed.latencyMs <= t.latency &&
    speed.jitterMs <= t.jitter
  )
}

export function computeDiagnosis(
  device: DeviceInfo,
  speed: SpeedTestResult,
  options: DiagnosisOptions = defaultDiagOptions,
): Diagnosis {
  const t = getThresholds(device.networkType)

  if (options.afterSuccessfulRemoveLimit && metricsNormal(speed, t)) {
    return {
      conclusion: '网络正常',
      severity: 'info',
      suggestion: '去除限速后再次测速，上下行速率及延迟、抖动均已处于正常范围。',
    }
  }

  if (device.limitedStatus === 'signal_weak') {
    return {
      conclusion: '信号弱',
      severity: 'warning',
      suggestion: `当前信号低于阈值（${options.weakSignalDbm} dBm）。建议先优化摆放位置、避开遮挡后再测速。`,
    }
  }
  if (device.limitedStatus === 'operator_limit') {
    return {
      conclusion: '运营商限速',
      severity: 'error',
      suggestion: '信号正常但高速流量为 0，且检测到限速程序，符合运营商限速特征。建议执行去限速流程。',
    }
  }
  if (device.limitedStatus === 'vendor_virtual_limit') {
    const ratio = options.vendorVirtualPercent ?? device.virtualRatioPercent
    return {
      conclusion: '商家流量虚标导致提前触发运营商限速',
      severity: 'error',
      suggestion: `信号正常但高速流量为 0，检测到限速程序；当前虚标比例约 ${ratio}%。建议先执行去限速，并保留证据反馈商家。`,
    }
  }
  if (device.limitedStatus === 'normal') {
    return {
      conclusion: '网络正常',
      severity: 'info',
      suggestion: '信号处于正常范围，流量虚标 0%，且未检测到限速程序，无需执行去限速操作。',
    }
  }

  if (metricsNormal(speed, t)) {
    return {
      conclusion: '网络正常',
      severity: 'info',
      suggestion: '信号处于正常范围，流量虚标 0%，且未检测到限速程序，无需执行去限速操作。',
    }
  }

  return {
    conclusion: '网络异常',
    severity: 'warning',
    suggestion: '部分指标未达理想范围，可重新测速或检查是否处于业务高峰时段。',
  }
}

export function needsRemoveLimitAction(d: Diagnosis): boolean {
  return d.conclusion === '运营商限速' || d.conclusion === '商家流量虚标导致提前触发运营商限速'
}
