<script setup lang="ts">
// 博客列表页 —— 文章横向行列表（左封面 + 右介绍）+ 分类文本筛选
// 文章由服务端 API 读取（server/api/blog/index.get.ts 内部走 @nuxt/content 的
// queryCollection → Nitro 服务端 DB），客户端仅 $fetch 静态 JSON / SSG payload，
// 避免 SPA 导航时加载 sqlite-wasm 运行时（详见 blog/[slug].vue 注释）。
import type { BlogPost } from '~/data/blog'
import { blogCategories } from '~/data/blog'
import { SITE_URL } from '~/data/site'

const { t, isZh, localePath } = useLocale()

// 全部文章按日期倒序（最新在前）
const { data: posts } = await useAsyncData(
  'blog-posts',
  () => $fetch<BlogPost[]>('/api/blog'),
  { default: () => [] }
)

// 分类筛选：'all' = 全部
const activeCat = ref('all')
const filteredPosts = computed(() => {
  if (activeCat.value === 'all') return posts.value
  return posts.value.filter((p) => p.category === activeCat.value)
})

// 筛选项：全部 + 分类列表（无图标纯文本，横向分隔排列，与产品页胶囊 Tab 区分）
const filters = computed(() => [
  { slug: 'all', name: isZh.value ? '全部' : 'All', count: posts.value.length },
  ...blogCategories.map((c) => ({
    slug: c.slug,
    name: isZh.value ? c.nameZh : c.name,
    count: posts.value.filter((p) => p.category === c.slug).length
  }))
])

// 面包屑
const breadcrumb = computed(() => [
  { label: isZh.value ? '首页' : 'Home', to: localePath('/') },
  { label: isZh.value ? '资源中心' : 'Blog' }
])

// 动态 SEO
const seoTitle = computed(() =>
  isZh.value ? '资源中心 — 补充剂品牌创办指南' : 'Blog — Private Label Supplement Insights'
)
const seoDescription = computed(() =>
  isZh.value
    ? '从私标软糖到 FDA 合规、从成本拆解到工厂筛选 —— 为自有品牌创办者准备的补充剂代工实战指南。'
    : 'Step-by-step guides for launching and scaling a private-label supplement brand — formulation, MOQ, costs, FDA compliance, and choosing a manufacturer.'
)
useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogType: 'website'
})

// 结构化数据：Blog + ItemList（全部文章条目，利于 Google 理解站点内容结构）
useHead({
  script: computed(() => {
    const scripts = [
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: seoTitle.value,
        description: seoDescription.value,
        url: `${SITE_URL}${localePath('/blog')}`
      }
    ]
    if (posts.value.length) {
      scripts.push({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: seoTitle.value,
        itemListElement: posts.value.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: isZh.value ? p.titleZh ?? p.title : p.title,
          url: `${SITE_URL}${localePath(p.path)}`
        }))
      })
    }
    return scripts.map((s) => ({ type: 'application/ld+json', innerHTML: JSON.stringify(s) }))
  })
})

// 筛选变化后重新观察 .reveal 行，避免新增行停在 opacity:0
const { observeAll } = useReveal()
watch(filteredPosts, () => {
  if (import.meta.client) nextTick(() => observeAll())
})
</script>

<template>
  <div>
    <PageHero
      :eyebrow="isZh ? '资源中心' : 'Resource Hub'"
      :title="isZh ? '从想法到产品上市' : 'From Idea to Shelf'"
      :subtitle="isZh ? '为补充剂品牌创办者准备的实战指南 —— 配方、成本、合规与工厂选择。' : 'Practical guides for building a private-label supplement brand — formulation, costs, compliance and choosing a manufacturer.'"
      image="/images/hero/quality-rd.jpeg"
      :breadcrumb="breadcrumb"
    />

    <!-- 分类筛选：横向文本链接 + 文章计数，与产品页胶囊 Tab 区分 -->
    <section class="sticky top-16 z-30 border-b border-mist-border bg-white/95 backdrop-blur md:top-20">
      <div class="wrap flex items-center gap-1 overflow-x-auto py-3 md:gap-2">
        <button
          v-for="f in filters"
          :key="f.slug"
          type="button"
          class="group flex shrink-0 items-baseline gap-1.5 px-3 py-2 text-sm transition-colors md:px-4"
          :class="activeCat === f.slug ? 'text-navy' : 'text-navy/50 hover:text-navy'"
          :aria-pressed="activeCat === f.slug"
          @click="activeCat = f.slug"
        >
          <span
            class="border-b-2 pb-1 font-semibold transition-colors"
            :class="activeCat === f.slug ? 'border-gold text-navy' : 'border-transparent group-hover:border-mist-border'"
          >
            {{ f.name }}
          </span>
          <span class="text-xs" :class="activeCat === f.slug ? 'text-gold-dark' : 'text-navy/30'">{{ f.count }}</span>
        </button>
      </div>
    </section>

    <!-- 文章横向行列表 -->
    <section class="section bg-white">
      <div class="wrap">
        <div class="max-w-4xl">
          <div v-if="filteredPosts.length">
            <BlogArticleCard
              v-for="(post, i) in filteredPosts"
              :key="post.path"
              :post="post"
              :index="i"
            />
          </div>

          <!-- 空态 -->
          <div v-else class="rounded-xl bg-mist py-20 text-center ring-1 ring-mist-border">
            <UiAppIcon name="box" :size="40" class="mx-auto text-navy/30" />
            <p class="mt-4 text-navy/60">{{ isZh ? '该分类暂无文章' : 'No articles in this category yet' }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
