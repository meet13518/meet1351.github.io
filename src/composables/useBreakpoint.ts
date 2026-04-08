import { computed, onMounted, onUnmounted, ref } from 'vue'

/** 与需求一致：≥1200px 双栏；否则控制台用抽屉 */
export function useBreakpoint(wideMin = 1200) {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : wideMin)
  const isWide = computed(() => width.value >= wideMin)

  function update() {
    width.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', update)
  })
  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return { width, isWide }
}
