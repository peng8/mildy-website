<script setup lang="ts">
import { site, navItems, navKeyMap } from '~/data/site'
import { trackEvent } from '~/composables/useAnalytics'

const { t, isZh, localePath } = useLocale()

const year = new Date().getFullYear()

const productLinks = computed(() => [
  { label: isZh.value ? '软糖' : 'Gummies', to: localePath('/products/categories/gummies') },
  { label: isZh.value ? '软胶囊' : 'Softgels', to: localePath('/products/categories/softgels') },
  { label: isZh.value ? '片剂' : 'Tablets', to: localePath('/products/categories/tablets') },
  { label: isZh.value ? '硬胶囊' : 'Hard Capsules', to: localePath('/products/categories/hard-capsules') },
  { label: isZh.value ? '粉剂' : 'Powders', to: localePath('/products/categories/powders') },
  { label: isZh.value ? '口服液' : 'Liquid Drops', to: localePath('/products/categories/liquid-drops') }
])

// 导航项标签统一走 i18n 字典（中英双语言都用 t()），与 TheHeader 写法对齐
const localizedNav = computed(() =>
  navItems.map((n) => ({
    to: localePath(n.to),
    label: t(navKeyMap[n.to])
  }))
)
</script>

<template>
  <footer class="bg-navy-900 text-white/70">
    <!-- 主体 -->
    <div class="wrap grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
      <!-- 品牌介绍 -->
      <div>
        <NuxtLink :to="localePath('/')" class="flex items-center gap-2.5">
          <img
            src="/logo/logo.png"
            :alt="site.brand"
            class="h-10 w-auto object-contain"
          />
          <span class="flex flex-col leading-none">
            <span class="text-xl font-extrabold tracking-tight text-white">{{ site.brand }}</span>
            <span class="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">{{ t('footer.tagline') }}</span>
          </span>
        </NuxtLink>
        <p class="mt-5 max-w-xs text-sm leading-relaxed">
          {{ isZh ? 'MILDY 健康是中国领先的膳食补充剂合同制造商,为全球品牌、跨境卖家和分销商提供一站式 OEM/ODM 贴牌解决方案。' : site.description }}
        </p>
        <div class="mt-6 flex items-center gap-3">
          <a
            v-for="s in site.social"
            :key="s.label"
            :href="s.href"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="s.label"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/80 transition hover:bg-gold hover:text-white"
          >
            <UiAppIcon :name="s.icon" :size="16" />
          </a>
        </div>
      </div>

      <!-- 导航 -->
      <div>
        <h4 class="text-sm font-semibold uppercase tracking-wider text-white">{{ t('footer.company') }}</h4>
        <ul class="mt-5 space-y-3 text-sm">
          <li v-for="item in localizedNav" :key="item.to">
            <NuxtLink :to="item.to" class="transition-colors hover:text-gold-light">
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- 产品 -->
      <div>
        <h4 class="text-sm font-semibold uppercase tracking-wider text-white">{{ t('footer.products') }}</h4>
        <ul class="mt-5 space-y-3 text-sm">
          <li v-for="p in productLinks" :key="p.to">
            <NuxtLink :to="p.to" class="transition-colors hover:text-gold-light">
              {{ p.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- 联系方式 -->
      <div>
        <h4 class="text-sm font-semibold uppercase tracking-wider text-white">{{ t('footer.contact') }}</h4>
        <ul class="mt-5 space-y-4 text-sm">
          <li class="flex items-start gap-3">
            <UiAppIcon name="pin" :size="18" class="mt-0.5 text-gold" />
            <span>{{ isZh ? site.contact.addressCn : site.contact.address }}</span>
          </li>
          <li>
            <a :href="`mailto:${site.contact.email}`" class="flex items-center gap-3 transition-colors hover:text-gold-light">
              <UiAppIcon name="mail" :size="18" class="text-gold" />
              {{ site.contact.email }}
            </a>
          </li>
          <li>
            <a :href="site.contact.phoneHref" class="flex items-center gap-3 transition-colors hover:text-gold-light">
              <UiAppIcon name="phone" :size="18" class="text-gold" />
              {{ site.contact.phone }}
            </a>
          </li>
          <li>
            <a :href="site.contact.whatsappHref" target="_blank" rel="noopener" class="flex items-center gap-3 transition-colors hover:text-gold-light" @click="trackEvent('whatsapp_click', { placement: 'footer' })">
              <UiAppIcon name="whatsapp" :size="18" class="text-gold" />
              {{ t('footer.whatsapp') }}
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- 版权 -->
    <div class="border-t border-white/10">
      <div class="wrap flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/50 md:flex-row">
        <p>© {{ year }} {{ site.name }} ({{ site.nameCn }}). {{ t('common.allRightsReserved') }}</p>
        <div class="flex items-center gap-5">
          <NuxtLink :to="localePath('/privacy')" class="transition-colors hover:text-gold-light">{{ t('footer.privacy') }}</NuxtLink>
          <NuxtLink :to="localePath('/terms')" class="transition-colors hover:text-gold-light">{{ t('footer.terms') }}</NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>
