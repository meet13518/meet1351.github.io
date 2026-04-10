import type { DeviceInfo } from '@/types'
import type { ConsoleOutputLocale } from '@/types/settings'

const COL = 24
const COL2 = 34

function padRow(a: string, b: string): string {
  const left = a.length > COL ? `${a.slice(0, COL - 1)}…` : a.padEnd(COL)
  const right = b.length > COL2 ? `${b.slice(0, COL2 - 1)}…` : b.padEnd(COL2)
  return `  │ ${left} │ ${right} │`
}

function isThrottleActive(d: DeviceInfo): boolean {
  return (
    d.limitedStatus === 'operator_limit' ||
    d.limitedStatus === 'vendor_virtual_limit' ||
    d.limitProgramDetected
  )
}

/**
 * 连接通道收尾：PCC/OCS 侧专业指标表，用于明示当前是否处于限速策略下。
 * 每行一条日志，等宽字符画表格。
 */
export function buildConnectionChannelThrottleTableLines(
  d: DeviceInfo,
  locale: ConsoleOutputLocale,
): string[] {
  const th = isThrottleActive(d)
  const rat = d.networkType === '5G' ? 'NR (5GC)' : 'LTE (EPC)'
  const rsrp = `${d.signalDbm} dBm`
  const rem = `${d.remainingHighspeedGB} GB`
  const dpi = d.limitProgramDetected
    ? locale === 'en'
      ? 'MATCH (throttle sig.)'
      : '命中（限速指纹）'
    : locale === 'en'
      ? 'none'
      : '未命中'
  const pcc = th
    ? locale === 'en'
      ? 'PCC_RULE_THROTTLE'
      : 'PCC 限速策略命中'
    : locale === 'en'
      ? 'NOMINAL'
      : '业务类策略正常'
  const ambr = th
    ? locale === 'en'
      ? '≤1 Mbps DL (shaped)'
      : '下行≤1 Mbps（整形）'
    : locale === 'en'
      ? 'profile max'
      : '按签约最大速率'
  const ocs =
    d.remainingHighspeedGB <= 0 && th
      ? locale === 'en'
        ? 'HS bucket: 0 (exhausted)'
        : '高速桶: 0（用尽）'
      : locale === 'en'
        ? `HS bucket: ${rem}`
        : `高速余量(OCS): ${rem}`
  const lim =
    d.limitedStatus === 'operator_limit'
      ? locale === 'en'
        ? 'operator throttle'
        : '运营商限速'
      : d.limitedStatus === 'vendor_virtual_limit'
        ? locale === 'en'
          ? 'vendor quota + op.'
          : '商家虚标+运营商'
        : d.limitedStatus === 'signal_weak'
          ? locale === 'en'
            ? 'RF limited (weak)'
            : '射频受限(弱信号)'
          : locale === 'en'
            ? 'policy nominal'
            : '策略面未见限速'

  const banner =
    locale === 'en'
      ? '# --- Link phase · PCC/OCS evidence (rate limit) ---'
      : '# --- 连接通道收尾 · PCC/OCS 侧证（限速判定）---'
  const verdict = th
    ? locale === 'en'
      ? '>>> NETWORK THROTTLE: ACTIVE <<<'
      : '>>> 当前网络：已处于限速策略下 <<<'
    : locale === 'en'
      ? '>>> throttle policy: not indicated <<<'
      : '>>> 未检出典型限速策略命中（仍执行去控）<<<'

  if (locale === 'en') {
    return [
      banner,
      `  ┌${'─'.repeat(COL + 2)}┬${'─'.repeat(COL2 + 2)}┐`,
      padRow('Metric', 'Value / state'),
      `  ├${'─'.repeat(COL + 2)}┼${'─'.repeat(COL2 + 2)}┤`,
      padRow('RAT / attach', rat),
      padRow('SS-RSRP / RSRP', rsrp),
      padRow('DPI throttle', dpi),
      padRow('PCC / ANDSF', pcc),
      padRow('Session-AMBR DL', ambr),
      padRow('OCS HS bucket', ocs),
      padRow('Limited cause', lim),
      padRow('Virt. label %', `${d.virtualRatioPercent}%`),
      `  └${'─'.repeat(COL + 2)}┴${'─'.repeat(COL2 + 2)}┘`,
      verdict,
    ]
  }

  return [
    banner,
    `  ┌${'─'.repeat(COL + 2)}┬${'─'.repeat(COL2 + 2)}┐`,
    padRow('指标', '读数 / 状态'),
    `  ├${'─'.repeat(COL + 2)}┼${'─'.repeat(COL2 + 2)}┤`,
    padRow('RAT / 附着', rat),
    padRow('SS-RSRP / RSRP', rsrp),
    padRow('DPI 限速指纹', dpi),
    padRow('PCC / 策略命中', pcc),
    padRow('Session-AMBR 下行', ambr),
    padRow('OCS 高速桶', ocs),
    padRow('限速成因(检测)', lim),
    padRow('虚标比例(商家)', `${d.virtualRatioPercent}%`),
    `  └${'─'.repeat(COL + 2)}┴${'─'.repeat(COL2 + 2)}┘`,
    verdict,
  ]
}
