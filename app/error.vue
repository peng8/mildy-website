<script setup lang="ts">
// 全局错误页（404 / 500 等）—— Nuxt 自动捕获 createError 后渲染此页
import type { NuxtError } from '#app'
import { productCategories } from '~/data/productCategories'

const props = defineProps<{ error: NuxtError }>()

const { t, isZh, localePath } = useLocale()
const is404 = computed(() => props.error?.statusCode === 404)

// 404 必须告诉爬虫不要索引，避免软 404 污染收录
// tab 标题随语言本地化（页面 h1 已用 t('error.404.title')，这里保持一致）
useSeoMeta({
  robots: 'noindex, nofollow',
  title: () => (is404.value ? t('error.404.title') : t('error.500.title')),
  description: () => isZh.value
    ? '您访问的页面不存在或已被移动。浏览我们的产品剂型,或返回首页。'
    : "The page you are looking for doesn't exist. Browse MILDY's supplement categories or contact us for OEM/ODM manufacturing."
})

// 返回首页：必须带当前 locale 前缀——中文用户访问 /zh/xxx 得到 404 后，
// 跳回裸 / 会落到英文首页（与原语言不一致）。localePath('/') 会保留 /zh 前缀。
const handleError = () => clearError({ redirect: localePath('/') })

// error.vue 是独立渲染（不在主 app.vue 上下文），手动补 i18n head（locale/direction + hreflang）
const localeHead = useLocaleHead()
useHead({
  htmlAttrs: () => localeHead.value.htmlAttrs,
  link: () => localeHead.value.link
})

const errorTitle = computed(() => is404.value ? t('error.404.title') : t('error.500.title'))
const errorDescription = computed(() => is404.value ? t('error.404.description') : t('error.500.description'))
</script>

<template>
  <NuxtLayout>
    <section class="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-navy-900 py-24">
      <!-- 背景装饰 -->
      <div class="absolute inset-0 opacity-20">
        <NuxtImg
          :src="'/images/hero/global-export.jpeg'"
          alt=""
          class="h-full w-full object-cover"
          loading="eager"
          format="webp"
          quality="80"
          sizes="xs:100vw sm:100vw md:100vw lg:100vw xl:100vw xxl:100vw"
        />
        <div class="absolute inset-0 hero-overlay" />
      </div>

      <div class="wrap relative text-center text-white">
        <!-- 404 大数字 -->
        <p class="text-[120px] font-extrabold leading-none text-gold md:text-[160px]">
          {{ is404 ? '404' : '⚠' }}
        </p>
        <h1 class="mt-4 text-3xl font-bold md:text-4xl">
          {{ errorTitle }}
        </h1>
        <p class="mx-auto mt-4 max-w-xl text-white/70">
          {{ errorDescription }}
        </p>

        <!-- 主 CTA -->
        <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            class="rounded-full bg-gold px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-dark"
            @click="handleError"
          >
            {{ t('error.backHome') }}
          </button>
          <NuxtLink
            :to="localePath('/products')"
            class="rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {{ t('error.browseProducts') }}
          </NuxtLink>
        </div>

        <!-- 产品分类内链（帮助用户/爬虫重新找到有效页面） -->
        <div class="mx-auto mt-12 max-w-2xl">
          <p class="text-xs uppercase tracking-wider text-white/50">{{ t('error.popularForms') }}</p>
          <div class="mt-4 flex flex-wrap justify-center gap-2">
            <NuxtLink
              v-for="cat in productCategories"
              :key="cat.slug"
              :to="localePath(`/products/categories/${cat.slug}`)"
              class="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-gold hover:text-white"
            >
              {{ isZh ? cat.nameZh : cat.name }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>
