<script setup lang="ts">
import { site } from '~/data/site'
import { trackEvent } from '~/composables/useAnalytics'

const { t, isZh } = useLocale()

const benefits = computed(() =>
  isZh.value
    ? [
        '免费配方咨询',
        '7–15 天提供样品',
        '专属出口对接人',
        '无义务报价'
      ]
    : [
        'Free formulation consultation',
        'Samples within 7–15 days',
        'Dedicated export coordinator',
        'No-obligation quotation'
      ]
)
</script>

<template>
  <section class="section relative overflow-hidden bg-navy-900">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 opacity-30">
      <NuxtImg
        :src="'/images/hero/global-export.jpeg'"
        alt=""
        class="h-full w-full object-cover"
        loading="lazy"
        format="webp"
        quality="80"
        sizes="xs:100vw sm:100vw md:100vw lg:100vw xl:100vw xxl:100vw"
      />
      <div class="absolute inset-0 hero-overlay" />
    </div>

    <div class="wrap relative grid items-center gap-10 lg:grid-cols-2">
      <!-- 左：文案 -->
      <div class="reveal text-white">
        <span class="eyebrow text-gold-light">
          <span class="h-px w-6 bg-gold" />
          {{ isZh ? '准备开始了吗?' : 'Ready to Start?' }}
        </span>
        <h2 class="mt-4 text-3xl font-bold leading-tight md:text-4xl">
          {{ isZh ? '立即获取定制报价' : 'Get Your Custom Quote Today' }}
        </h2>
        <p class="mt-4 max-w-md text-white/75">
          {{ isZh ? '告诉我们您的产品想法,我们的团队将在 24 小时内回复配方方案、起订量和报价。' : 'Tell us about your product idea and our team will respond within 24 hours with formulation options, MOQ and pricing.' }}
        </p>
        <ul class="mt-7 grid gap-3 sm:grid-cols-2">
          <li v-for="b in benefits" :key="b" class="flex items-center gap-2.5 text-sm text-white/90">
            <UiAppIcon name="check" :size="16" class="text-gold" />
            {{ b }}
          </li>
        </ul>

        <!-- 备用联系方式 -->
        <div class="mt-8 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
          <a :href="`mailto:${site.contact.email}`" class="flex items-center gap-2 text-sm text-white/80 hover:text-gold-light">
            <UiAppIcon name="mail" :size="18" class="text-gold" /> {{ site.contact.email }}
          </a>
          <a :href="site.contact.whatsappHref" target="_blank" rel="noopener" class="flex items-center gap-2 text-sm text-white/80 hover:text-gold-light" @click="trackEvent('whatsapp_click', { placement: 'home' })">
            <UiAppIcon name="whatsapp" :size="18" class="text-gold" /> WhatsApp
          </a>
        </div>
      </div>

      <!-- 右：询价表单 -->
      <div class="reveal" :style="`transition-delay: 120ms`">
        <QuoteForm variant="light" />
      </div>
    </div>
  </section>
</template>
