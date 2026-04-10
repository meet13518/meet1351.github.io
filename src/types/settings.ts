/** 控制台打印文案语言（仅影响日志输出，不切换整个应用 UI） */
export type ConsoleOutputLocale = 'zh' | 'en'

/** 应用侧可配置的套餐、设备与限速规则（用于检测与诊断） */
export interface AppSettings {
  /** WiFi / 对外套餐名称 */
  planName: string
  /** 宣传的高速流量总量（GB） */
  advertisedHighspeedGB: number
  /** 实际可用高速流量上限（GB），可小于宣传值以体现虚标；用于测速归一化 */
  actualHighspeedGB: number
  /** 设备型号（检测回填） */
  deviceModel: string
  networkType: '4G' | '5G'
  operator: string
  /** 信号强度随机范围 dBm */
  signalMin: number
  signalMax: number
  /** 连接设备数随机范围 */
  connectedDevicesMin: number
  connectedDevicesMax: number
  /** 低于该 dBm 视为「信号问题」优先于限速判断 */
  weakSignalDbm: number
  /** 商家流量虚标比例（%），仅在「商家虚标」场景下于诊断页展示 */
  vendorVirtualPercent: number
  /**
   * 检测阶段指定的限速原因：
   * - normal: 网络正常
   * - signal_weak: 信号弱
   * - operator_limit: 运营商限速
   * - vendor_virtual_limit: 商家流量虚标导致提前触发运营商限速
   */
  limitCause: 'normal' | 'signal_weak' | 'operator_limit' | 'vendor_virtual_limit'
  /**
   * 仅影响「实时控制台 / 去控控制台」内打印文案语言；界面其它文案仍为中文。
   * - zh：中文
   * - en：英文
   */
  consoleOutputLocale: ConsoleOutputLocale
}

export const defaultSettings: AppSettings = {
  planName: '畅享套餐（示例）',
  advertisedHighspeedGB: 100,
  actualHighspeedGB: 100,
  deviceModel: '华为 E8372',
  networkType: '4G',
  operator: '中国移动',
  signalMin: -98,
  signalMax: -52,
  connectedDevicesMin: 1,
  connectedDevicesMax: 8,
  weakSignalDbm: -95,
  vendorVirtualPercent: 30,
  limitCause: 'normal',
  consoleOutputLocale: 'zh',
}
