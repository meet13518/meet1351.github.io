/** 主流程步骤索引（与 StepProgress / HomeView 一致） */
export const STEP = {
  /** 信息检测 */
  DEVICE: 0,
  /** 网速诊断 */
  SPEED: 1,
  /** 去除限速 */
  REMOVE: 2,
} as const

export type StepIndex = (typeof STEP)[keyof typeof STEP]
