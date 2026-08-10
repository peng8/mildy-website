<script setup lang="ts">
import { site, navItems, navKeyMap } from '~/data/site'

const route = useRoute()
const mobileOpen = ref(false)
const scrolled = ref(false)
const searchOpen = ref(false)

// Ctrl/Cmd + K 打开搜索（仅在非可编辑元素上触发，避免在表单/搜索框内误触）
const onKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    // 跳过 input/textarea/contenteditable 等可编辑区域
    const target = e.target as HTMLElement | null
    if (target?.matches('input, textarea, [contenteditable]')) return
    e.preventDefault()
    searchOpen.value = true
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

// 滚动时给 header 加白底 + 阴影
const onScroll = () => {
  scrolled.value = window.scrollY > 24
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

// 路由变化时关闭移动菜单
watch(() => route.fullPath, () => (mobileOpen.value = false))

// 移动菜单焦点陷阱：打开时聚焦第一个导航项，关闭时恢复
const mobileMenuEl = ref<HTMLElement | null>(null)
watch(mobileOpen, async (open) => {
  if (open) {
    await nextTick()
    const firstLink = mobileMenuEl.value?.querySelector<HTMLAnchorElement>('a')
    firstLink?.focus()
  }
})

const { locale, toggle, t, isZh, localePath } = useLocale()

// 去掉路径里的 /zh 前缀（英文为裸路径无前缀），用于 isActive 比较
const stripLocale = (p: string) => p.replace(/^\/zh(?=\/|$)/, '') || '/'

const isActive = (to: string) => {
  const stripped = stripLocale(route.path)
  if (to === '/') return stripped === '/'
  return stripped.startsWith(to)
}

// 导航项：裸路径 → localePath 包装后的路由；标签统一走 i18n 字典（中英双语言都用 t()）
const navList = computed(() =>
  navItems.map((n) => ({
    to: localePath(n.to),
    label: t(navKeyMap[n.to])
  }))
)
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 transition-all duration-300"
    :class="
      scrolled || mobileOpen
        ? 'bg-white/95 shadow-card backdrop-blur'
        : 'bg-navy shadow-card'
    "
  >
    <div class="wrap flex h-16 items-center justify-between md:h-20">
      <!-- Logo -->
      <NuxtLink :to="localePath('/')" class="flex items-center gap-2.5" :aria-label="isZh ? 'MILDY 首页' : 'MILDY Home'">
        <img
          src="/logo/logo.png"
          :alt="site.brand"
          class="h-9 w-auto object-contain md:h-10"
        />
        <span class="flex flex-col leading-none">
          <span
            class="text-lg font-extrabold tracking-tight md:text-xl"
            :class="scrolled || mobileOpen ? 'text-navy' : 'text-white'"
          >
            {{ site.brand }}
          </span>
          <span
            class="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em]"
            :class="scrolled || mobileOpen ? 'text-navy/50' : 'text-white/70'"
          >
            Health Group
          </span>
        </span>
      </NuxtLink>

      <!-- 桌面导航 -->
      <nav class="hidden items-center gap-1 lg:flex">
        <NuxtLink
          v-for="item in navList"
          :key="item.to"
          :to="item.to"
          class="relative rounded-md px-3 py-2 text-sm transition-colors"
          :class="
            isActive(item.to)
              ? scrolled
                ? 'font-semibold text-navy'
                : 'font-semibold text-gold-light'
              : scrolled
                ? 'font-medium text-navy/70 hover:text-navy'
                : 'font-medium text-white/85 hover:text-white'
          "
        >
          {{ item.label }}
          <!-- 选中指示器：滚动后用金色下划线，未滚动用金色短横 -->
          <span
            v-if="isActive(item.to)"
            class="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full"
            :class="scrolled ? 'bg-gold' : 'bg-gold-light'"
          />
        </NuxtLink>
      </nav>

      <!-- 右侧操作 -->
      <div class="flex items-center gap-2 md:gap-3">
        <!-- 搜索入口（桌面端按钮 + 快捷键提示） -->
        <button
          class="hidden items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors lg:flex"
          :class="
            scrolled || mobileOpen
              ? 'border-navy/15 text-navy/60 hover:border-navy/40 hover:text-navy'
              : 'border-white/40 text-white/70 hover:border-white hover:text-white'
          "
          :aria-label="isZh ? '搜索' : 'Search'"
          @click="searchOpen = true"
        >
          <UiAppIcon name="search" :size="16" />
          <span class="hidden xl:inline">{{ isZh ? '搜索' : 'Search' }}</span>
          <kbd
            class="hidden rounded border px-1.5 py-0.5 text-[10px] font-semibold xl:inline"
            :class="scrolled || mobileOpen ? 'border-navy/15 text-navy/50' : 'border-white/30 text-white/60'"
          >⌘K</kbd>
        </button>

        <!-- 移动端搜索图标按钮 -->
        <button
          class="flex h-10 w-10 items-center justify-center rounded-md lg:hidden"
          :class="scrolled || mobileOpen ? 'text-navy' : 'text-white'"
          :aria-label="isZh ? '搜索' : 'Search'"
          @click="searchOpen = true"
        >
          <UiAppIcon name="search" :size="20" />
        </button>

        <!-- 语言切换 -->
        <button
          class="hidden items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors sm:flex"
          :class="
            scrolled || mobileOpen
              ? 'border-navy/15 text-navy hover:border-navy/40'
              : 'border-white/40 text-white hover:border-white'
          "
          :aria-label="isZh ? '切换语言' : 'Switch language'"
          @click="toggle"
        >
          <span :class="locale === 'en' ? '' : 'opacity-50'">EN</span>
          <span class="opacity-30">/</span>
          <span :class="locale === 'zh' ? '' : 'opacity-50'">中</span>
        </button>

        <UiAppButton
          :to="localePath('/contact')"
          variant="primary"
          size="sm"
          icon="send"
          class="hidden md:inline-flex"
        >
          {{ isZh ? '获取报价' : 'Get A Quote' }}
        </UiAppButton>

        <!-- 移动菜单按钮 -->
        <button
          class="flex h-10 w-10 items-center justify-center rounded-md lg:hidden"
          :class="scrolled || mobileOpen ? 'text-navy' : 'text-white'"
          :aria-label="isZh ? '菜单' : 'Menu'"
          :aria-expanded="mobileOpen"
          :aria-controls="mobile-menu"
          @click="mobileOpen = !mobileOpen"
        >
          <UiAppIcon :name="mobileOpen ? 'close' : 'menu'" :size="24" />
        </button>
      </div>
    </div>

    <!-- 移动菜单展开 -->
    <Transition name="mnav">
      <div v-if="mobileOpen" ref="mobileMenuEl" id="mobile-menu" class="lg:hidden">
        <nav class="wrap flex flex-col gap-1 pb-5 pt-2">
          <NuxtLink
            v-for="item in navList"
            :key="item.to"
            :to="item.to"
            class="rounded-md px-3 py-3 text-sm font-medium text-navy/80 transition-colors hover:bg-mist hover:text-navy"
            :class="isActive(item.to) ? 'bg-mist text-navy-500' : ''"
          >
            {{ item.label }}
          </NuxtLink>
          <div class="mt-3 flex items-center gap-3">
            <button
              class="flex items-center gap-1 rounded-md border border-navy/15 px-2.5 py-1.5 text-xs font-semibold text-navy"
              :aria-label="isZh ? '切换语言' : 'Switch language'"
              @click="toggle"
            >
              <span :class="locale === 'en' ? '' : 'opacity-50'">EN</span>
              <span class="opacity-30">/</span>
              <span :class="locale === 'zh' ? '' : 'opacity-50'">中</span>
            </button>
            <UiAppButton :to="localePath('/contact')" variant="primary" size="sm" icon="send" class="flex-1">
              {{ isZh ? '获取报价' : 'Get A Quote' }}
            </UiAppButton>
          </div>
        </nav>
      </div>
    </Transition>

    <!-- 全站搜索弹窗 -->
    <PagefindSearch v-model:open="searchOpen" />
  </header>
</template>

<style scoped>
.mnav-enter-active,
.mnav-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.mnav-enter-from,
.mnav-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
