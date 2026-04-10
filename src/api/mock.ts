import type { DeviceInfo, SpeedTestResult } from '@/types'
import type { AppSettings } from '@/types/settings'
import { getThresholds, NORMAL_DOWNLOAD_MBPS } from '@/utils/diagnosis'

/** 达量余量：与「正常/信号弱」场景下剩余流量下限相关（原配置项已内收） */
const DATA_CAP_TRIGGER_GB = 5

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function pickLimitedStatus(cfg: AppSettings): DeviceInfo['limitedStatus'] {
  return cfg.limitCause
}

/** 异常场景测速：上下行压到 0~3 Mbps，延迟与抖动偏高 */
function buildAbnormalSpeedResult(): SpeedTestResult {
  const downloadMbps = Math.round(randomBetween(0, 3) * 10) / 10
  const uploadMbps = Math.round(randomBetween(0, 3) * 10) / 10
  const latencyMs = Math.round(randomBetween(80, 220))
  const jitterMs = Math.round(randomBetween(25, 65))
  return { downloadMbps, uploadMbps, latencyMs, jitterMs }
}

/** 去除限速成功后再次测速：下行落在正常区间，上下行及延迟、抖动落在阈值内 */
function buildNormalSpeedResult(device: DeviceInfo): SpeedTestResult {
  const t = getThresholds(device.networkType)
  const downloadMbps = Math.round(randomBetween(NORMAL_DOWNLOAD_MBPS.min, NORMAL_DOWNLOAD_MBPS.max) * 10) / 10
  const uploadMbps = Math.round(randomBetween(t.upload, t.upload * 1.15) * 10) / 10
  const latencyMs = Math.round(randomBetween(5, Math.max(6, t.latency - 1)))
  const jitterMs = Math.round(randomBetween(4, Math.max(5, t.jitter - 1)))
  return {
    downloadMbps: Math.max(downloadMbps, t.download),
    uploadMbps: Math.max(uploadMbps, t.upload),
    latencyMs: Math.min(latencyMs, t.latency),
    jitterMs: Math.min(jitterMs, t.jitter),
  }
}

/** 与设备状态一致的测速结果；`actualHighspeedGB` 用于归一化剩余流量影响 */
export function buildSpeedTestResult(
  device: DeviceInfo,
  actualHighspeedGB: number,
  opts?: { forceNormal?: boolean },
): SpeedTestResult {
  if (opts?.forceNormal) {
    return buildNormalSpeedResult(device)
  }
  if (device.limitedStatus !== 'normal') {
    return buildAbnormalSpeedResult()
  }
  const t = getThresholds(device.networkType)
  const signalFactor = Math.max(0, Math.min(1, (device.signalDbm + 100) / 50))

  if (device.limitedStatus === 'normal') {
    const downloadMbps = Math.round(randomBetween(NORMAL_DOWNLOAD_MBPS.min, NORMAL_DOWNLOAD_MBPS.max) * 10) / 10
    let uploadMbps = Math.round(randomBetween(t.upload, t.upload * 1.2) * 10) / 10
    uploadMbps = Math.max(uploadMbps, t.upload)
    const latencyMs = Math.round((1.15 - signalFactor * 0.35) * (device.networkType === '5G' ? 28 : 55))
    const jitterMs = Math.round(randomBetween(8, 28) * (1.4 - signalFactor))
    return {
      downloadMbps,
      uploadMbps,
      latencyMs: Math.min(latencyMs, t.latency),
      jitterMs: Math.min(jitterMs, t.jitter),
    }
  }

  const cap = Math.max(0.1, actualHighspeedGB)
  let dataFactor = Math.min(1, device.remainingHighspeedGB / cap + 0.15)
  let noise = 0.88 + Math.random() * 0.14

  if (device.limitedStatus === 'operator_limit') {
    dataFactor = Math.min(dataFactor, 0.35)
    noise = 0.72 + Math.random() * 0.1
  } else if (device.limitedStatus === 'vendor_virtual_limit') {
    dataFactor = Math.min(dataFactor, 0.3)
    noise = 0.7 + Math.random() * 0.12
  }

  let downloadMbps = t.download * signalFactor * dataFactor * noise
  let uploadMbps = t.upload * signalFactor * dataFactor * (0.85 + Math.random() * 0.12)
  const latencyMs = Math.round((1.15 - signalFactor * 0.35) * (device.networkType === '5G' ? 28 : 55))
  const jitterMs = Math.round(randomBetween(8, 28) * (1.4 - signalFactor))

  downloadMbps = Math.round(downloadMbps * 10) / 10
  uploadMbps = Math.round(uploadMbps * 10) / 10

  return { downloadMbps, uploadMbps, latencyMs, jitterMs }
}

export async function fetchDeviceInfo(cfg: AppSettings): Promise<DeviceInfo> {
  await delay(500)
  const networkType = cfg.networkType
  const cause = pickLimitedStatus(cfg)
  let signalDbm = Math.round(randomBetween(cfg.signalMin, cfg.signalMax))
  const cap = Math.max(0.1, cfg.actualHighspeedGB)
  const virtualRatioPercent = cause === 'vendor_virtual_limit' ? Math.max(0, cfg.vendorVirtualPercent) : 0
  const limitProgramDetected = cause === 'operator_limit' || cause === 'vendor_virtual_limit'
  let remainingHighspeedGB: number
  if (cause === 'operator_limit') {
    remainingHighspeedGB = 0
  } else if (cause === 'vendor_virtual_limit') {
    remainingHighspeedGB = 0
  } else {
    remainingHighspeedGB = Math.round(randomBetween(0, cap) * 10) / 10
  }
  const totalTrafficGB = Math.max(
    0,
    Math.round((cfg.advertisedHighspeedGB - remainingHighspeedGB + randomBetween(-1.5, 1.5)) * 10) / 10,
  )
  const connectedDevices = Math.floor(
    randomBetween(cfg.connectedDevicesMin, Math.max(cfg.connectedDevicesMin, cfg.connectedDevicesMax) + 0.99),
  )

  if (cause === 'signal_weak') {
    signalDbm = Math.min(signalDbm, cfg.weakSignalDbm - 2)
    remainingHighspeedGB = Math.max(remainingHighspeedGB, Math.min(cap, DATA_CAP_TRIGGER_GB + 3))
  } else if (cause === 'operator_limit' || cause === 'vendor_virtual_limit') {
    signalDbm = Math.max(signalDbm, cfg.weakSignalDbm + 10)
  } else if (cause === 'normal') {
    signalDbm = Math.max(signalDbm, cfg.weakSignalDbm + 12)
    remainingHighspeedGB = Math.max(remainingHighspeedGB, Math.min(cap, DATA_CAP_TRIGGER_GB + 3))
  }

  return {
    model: cfg.deviceModel,
    networkType,
    signalDbm,
    operator: cfg.operator,
    connectedDevices,
    totalTrafficGB,
    remainingHighspeedGB,
    virtualRatioPercent,
    limitProgramDetected,
    limitedStatus: cause,
  }
}

export async function postSpeedtest(
  device: DeviceInfo,
  cfg: AppSettings,
  opts?: { forceNormal?: boolean },
): Promise<SpeedTestResult> {
  await delay(2000)
  return buildSpeedTestResult(device, cfg.actualHighspeedGB, opts)
}

export async function postRemoveLimit(
  locale: 'zh' | 'en' = 'zh',
): Promise<{ success: boolean; message: string }> {
  await delay(1000)
  /** 固定成功，保证「去限速 → 回诊断 → 再测速」流程可完整走通 */
  return {
    success: true,
    message: locale === 'en' ? 'Rate-limit removal request accepted' : '解除限速请求已受理',
  }
}
