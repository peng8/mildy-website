<script setup lang="ts">
// 视频弹窗：配合 useVideoLightbox 单例
// 唯一挂载点：在此处理路由关闭、ESC 关闭、body 滚动锁与焦点管理，
// 避免 useVideoLightbox() 在每个调用组件重复注册钩子导致互相干扰。
// 交互参考 layout/Lightbox.vue（图片弹窗），但内容为 <video controls>
const { isOpen, current, close, next, prev, videos } = useVideoLightbox()
const { isZh } = useLocale()
const { lock, unlock } = useScrollLock()

const panelEl = ref<HTMLElement | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
let lastFocused: HTMLElement | null = null

// 视频缓冲状态：打开/切换后到能播放前显示加载圈
const buffering = ref(true)
const onWaiting = () => { buffering.value = true }
const onCanPlay = () => { buffering.value = false }

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
    if (lastFocused) {
      lastFocused.focus?.()
      lastFocused = null
    }
  }
})

// 切换到下一个/上一个时，video src 随 current 变化，重置缓冲态并重载、自动播放
watch(current, () => {
  buffering.value = true
  nextTick(() => {
    const v = videoEl.value
    if (!v) return
    v.load()
    v.play().catch(() => {
      // 自动播放被拒（如浏览器策略）→ 保留控件，用户手动点播放
    })
  })
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
    <Transition name="vlb">
      <div
        v-if="isOpen"
        ref="panelEl"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/90 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        :aria-label="isZh ? '视频播放器' : 'Video player'"
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

        <!-- 上一个 -->
        <button
          v-if="videos.length > 1"
          class="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 md:left-6"
          :aria-label="isZh ? '上一个' : 'Previous'"
          @click="prev"
        >
          <UiAppIcon name="chevron-right" :size="24" class="rotate-180" />
        </button>

        <!-- 视频 -->
        <figure class="relative max-h-[88vh] max-w-[92vw] text-center" @click.stop>
          <video
            v-if="current"
            ref="videoEl"
            :src="current.src"
            :title="current.title || ''"
            class="mx-auto max-h-[80vh] w-auto max-w-full rounded-lg shadow-2xl"
            controls
            autoplay
            playsinline
            preload="auto"
            @waiting="onWaiting"
            @canplay="onCanPlay"
            @playing="onCanPlay"
          />
          <!-- 缓冲加载圈 -->
          <div
            v-if="buffering"
            class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <span class="block h-12 w-12 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
          <figcaption
            v-if="current?.title"
            class="mt-4 text-sm text-white/75"
          >
            {{ current.title }}
          </figcaption>
        </figure>

        <!-- 下一个 -->
        <button
          v-if="videos.length > 1"
          class="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 md:right-6"
          :aria-label="isZh ? '下一个' : 'Next'"
          @click="next"
        >
          <UiAppIcon name="chevron-right" :size="24" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.vlb-enter-active,
.vlb-leave-active {
  transition: opacity 0.25s ease;
}
.vlb-enter-from,
.vlb-leave-to {
  opacity: 0;
}
</style>
