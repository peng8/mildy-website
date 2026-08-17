<script setup lang="ts">
import { site } from '~/data/site'
import { trackEvent } from '~/composables/useAnalytics'

const { isZh } = useLocale()
const showTop = ref(false)
const onScroll = () => {
  showTop.value = window.scrollY > 600
}
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
</script>

<template>
  <div class="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 md:bottom-8 md:right-8">
    <!-- 返回顶部 -->
    <Transition name="fab">
      <button
        v-if="showTop"
        class="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-white shadow-lg transition hover:bg-navy-700"
        :aria-label="isZh ? '返回顶部' : 'Back to top'"
        @click="toTop"
      >
        <UiAppIcon name="arrow-up" :size="20" />
      </button>
    </Transition>

    <!-- WhatsApp 在线咨询 -->
    <a
      :href="site.contact.whatsappHref"
      target="_blank"
      rel="noopener noreferrer"
      class="group flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-105"
      :aria-label="isZh ? 'WhatsApp 在线咨询' : 'Chat on WhatsApp'"
      @click="trackEvent('whatsapp_click', { placement: 'floating' })"
    >
      <UiAppIcon name="whatsapp" :size="28" />
      <span class="absolute right-full mr-3 hidden whitespace-nowrap rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:block">
        {{ isZh ? '在线咨询' : 'Chat with us' }}
      </span>
    </a>
  </div>
</template>

<style scoped>
.fab-enter-active,
.fab-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
