import { type Ref, ref } from 'vue'

/** 距底部小于此像素则视为「贴在底部」，新日志才自动滚动 */
const STICK_THRESHOLD_PX = 88

/**
 * 控制台自动滚到底部：仅在用户未向上翻阅时跟随（避免与鼠标滚轮/拖拽冲突）。
 */
export function useConsoleAutoScroll(scroller: Ref<HTMLElement | null>) {
  const stickToBottom = ref(true)

  function onScroll() {
    const el = scroller.value
    if (!el) return
    const gap = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottom.value = gap <= STICK_THRESHOLD_PX
  }

  /** 新内容到达后调用：仅当仍贴在底部时才滚到底 */
  function scrollToBottomIfStuck() {
    if (!stickToBottom.value) return
    requestAnimationFrame(() => {
      const el = scroller.value
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  /** 新会话/清空后恢复跟随到底部 */
  function forceStickToBottom() {
    stickToBottom.value = true
  }

  return {
    stickToBottom,
    onScroll,
    scrollToBottomIfStuck,
    forceStickToBottom,
  }
}
