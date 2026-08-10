<script setup lang="ts">
import type { MessageKey } from '~/i18n/messages'
import { site } from '~/data/site'

const { t, localePath, isZh } = useLocale()

const facilityStats = computed(() => [
  { value: '20,000', label: t('fs.stat1'), icon: 'box' },
  { value: '8', label: t('fs.stat2'), icon: 'gear' },
  { value: '8', label: t('fs.stat4'), icon: 'shield-check' }
])

const highlights = computed(() => [
  { icon: 'gear', title: t('fs.highlight.1.title'), desc: t('fs.highlight.1.desc') },
  { icon: 'shield-check', title: t('fs.highlight.2.title'), desc: t('fs.highlight.2.desc') },
  { icon: 'flask', title: t('fs.highlight.3.title'), desc: t('fs.highlight.3.desc') }
])

const { openOne } = useLightbox()
const mainImg = '/images/banner-frames/frame-02s.jpg'
// alt/caption 随语言本地化（中文用户看到中文描述，而非硬编码英文）
const mainLabel = computed(() => (isZh.value ? 'MILDY 工厂全景' : 'MILDY factory overview'))
const mainCaption = computed(() => (isZh.value ? 'MILDY 主要生产车间' : 'MILDY main manufacturing facility'))
const midImages = computed(() => [
  { src: '/images/banner-frames/frame-08s.jpg', alt: isZh.value ? '生产线细节' : 'Production line detail' },
  { src: '/images/banner-frames/frame-13s.jpg', alt: isZh.value ? '车间内部' : 'Facility interior' }
])
</script>

<template>
  <section class="section bg-navy text-white">
    <div class="wrap grid items-center gap-12 lg:grid-cols-2">
      <!-- 左：图文 -->
      <div>
        <UiSectionHeading
          :eyebrow="t('fs.eyebrow')"
          :title="t('fs.title')"
          :subtitle="t('fs.subtitle')"
          align="left"
          light
          class="md:max-w-xl"
        />

        <!-- 数据 -->
        <div class="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3">
          <div v-for="(s, i) in facilityStats" :key="s.label" class="reveal" :style="`transition-delay: ${i * 80}ms`">
            <UiAppIcon :name="s.icon" :size="22" class="text-gold" />
            <UiStatCounter :value="s.value" light class="mt-2 !text-3xl" />
            <p class="mt-1 text-xs text-white/55">{{ s.label }}</p>
          </div>
        </div>

        <!-- 工艺亮点 -->
        <ul class="mt-8 grid gap-3">
          <li
            v-for="(h, i) in highlights"
            :key="h.title"
            class="reveal flex items-start gap-3 rounded-lg bg-white/[0.04] px-4 py-3 ring-1 ring-white/10"
            :style="`transition-delay: ${i * 80}ms`"
          >
            <UiAppIcon :name="h.icon" :size="18" class="mt-0.5 shrink-0 text-gold" />
            <div>
              <p class="text-sm font-semibold text-white">{{ h.title }}</p>
              <p class="mt-0.5 text-xs leading-relaxed text-white/55">{{ h.desc }}</p>
            </div>
          </li>
        </ul>

        <UiAppButton :to="localePath('/manufacturing')" variant="primary" icon-right="arrow-right" class="mt-9">
          {{ t('fs.tour') }}
        </UiAppButton>
      </div>

      <!-- 右:Bento 图片画廊 -->
      <div class="reveal grid grid-cols-2 gap-4">
        <button
          class="group col-span-2 overflow-hidden rounded-xl"
          @click="openOne({ src: mainImg, alt: mainLabel, caption: mainCaption })"
        >
          <UiLazyImage
            :src="mainImg"
            :alt="mainLabel"
            ratio="aspect-[16/9]"
            class="transition-transform duration-700 group-hover:scale-105"
          />
        </button>
        <button
          v-for="(m, i) in midImages"
          :key="i"
          class="group overflow-hidden rounded-xl"
          @click="openOne({ src: m.src, alt: m.alt })"
        >
          <UiLazyImage
            :src="m.src"
            :alt="m.alt"
            ratio="aspect-[4/3]"
            class="h-full transition-transform duration-700 group-hover:scale-105"
          />
        </button>
      </div>
    </div>
  </section>
</template>
