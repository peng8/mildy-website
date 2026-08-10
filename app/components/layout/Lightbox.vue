<script setup lang="ts">
// 全局图片弹窗预览：配合 useLightbox 单例
// 唯一挂载点：在此处理路由关闭、卸载清理、body 滚动锁与焦点管理，
// 避免 useLightbox() 在每个调用组件重复注册钩子导致互相干扰。
const { isOpen, current, close, next, prev, images } = useLightbox()
const { isZh } = useLocale()
const { lock, unlock } = useScrollLock()

const panelEl = ref<HTMLElement | null>(null)
let lastFocused: HTMLElement | null = null

const onKey = (e: KeyboardEvent) => {
  if (!isOpen.value) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowRight') next()
  if (e.key === 'ArrowLeft') prev()
  // 焦点陷阱：Tab 在弹窗内循环
  if (e.key === 'Tab') {
    const panel = panelEl.value
    if (!panel) return
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

// Body scroll lock（引用计数，与其他弹窗共存）
watch(isOpen, (open) => {
  if (open) {
    lock()
    // 焦点管理：记录触发元素，打开后聚焦面板（便于 ESC 立即生效）
    lastFocused = (document.activeElement as HTMLElement) ?? null
    nextTick(() => panelEl.value?.focus())
  } else {
    unlock()
    // 关闭后恢复焦点到触发元素
    if (lastFocused) {
      lastFocused.focus?.()
      lastFocused = null
    }
  }
})

// 路由变化时关闭弹窗（SPA 导航）
const route = useRoute()
watch(() => route.fullPath, () => close())

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (isOpen.value) unlock()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="lb">
      <div
        v-if="isOpen"
        ref="panelEl"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/90 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        :aria-label="isZh ? '图片查看器' : 'Image viewer'"
        @click.self="close"
      >
        <!-- 关闭 -->
        <button
          class="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
          :aria-label="isZh ? '关闭' : 'Close'"
          @click="close"
        >
          <UiAppIcon name="close" :size="22" />
        </button>

        <!-- 上一张 -->
        <button
          v-if="images.length > 1"
          class="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 md:left-6"
          :aria-label="isZh ? '上一张' : 'Previous'"
          @click="prev"
        >
          <UiAppIcon name="chevron-right" :size="24" class="rotate-180" />
        </button>

        <!-- 图片 -->
        <figure class="max-h-[88vh] max-w-[92vw] text-center" @click.stop>
          <img
            v-if="current"
            :src="current.src"
            :alt="current.alt || ''"
            class="mx-auto max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
          />
          <figcaption
            v-if="current?.caption"
            class="mt-4 text-sm text-white/75"
          >
            {{ current.caption }}
          </figcaption>
        </figure>

        <!-- 下一张 -->
        <button
          v-if="images.length > 1"
          class="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 md:right-6"
          :aria-label="isZh ? '下一张' : 'Next'"
          @click="next"
        >
          <UiAppIcon name="chevron-right" :size="24" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lb-enter-active,
.lb-leave-active {
  transition: opacity 0.25s ease;
}
.lb-enter-from,
.lb-leave-to {
  opacity: 0;
}
</style>
