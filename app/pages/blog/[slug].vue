<script setup lang="ts">
// 博客文章详情页 —— 正文渲染 + 内嵌询价表单 CTA + 相关文章
// 文章由 @nuxt/content 读取（content/blog/*.md），中文页复用同一份英文正文，
// 仅在外层 UI 语言与 meta（titleZh/descriptionZh，无则回退英文）上区分。
import type { BlogPost } from '~/data/blog'
import { getBlogCategoryName } from '~/data/blog'
import { SITE_URL, site } from '~/data/site'

const route = useRoute()
const { isZh, localePath } = useLocale()

// 去掉 /zh 前缀得到裸路径（英文为裸路径无前缀），与 TheHeader 的 stripLocale 逻辑一致
// trailingSlash 开启后 route.path 以 / 结尾，需一并去掉以匹配内容库的裸路径（/blog/<slug>）
const stripLocale = (p: string) => p.replace(/^\/zh(?=\/|$)/, '').replace(/\/+$/, '') || '/'

// 取文章：按 path 精确匹配（/blog/<slug>），中文页请求的是同一个 path
const articlePath = computed(() => stripLocale(route.path))

const { data: article, pending } = await useAsyncData<BlogPost | null>(
  `blog-article-${articlePath.value}`,
  () => queryCollection<BlogPost>('blog').where('path', '=', articlePath.value).first().then((a) => a ?? null),
  { watch: [articlePath], default: () => null }
)

// 同分类相关文章（排除当前篇，最多 3 篇）
const { data: allPosts } = await useAsyncData(
  'blog-posts-related',
  () => queryCollection<BlogPost>('blog').order('date', 'DESC').all(),
  { default: () => [] }
)
const relatedPosts = computed(() => {
  const current = article.value
  if (!current) return []
  return allPosts.value.filter((p) => p.path !== current.path && p.category === current.category).slice(0, 3)
})

// CTA 卖点列表（中英）—— 内嵌询盘表单旁的信任点
const ctaPoints = [
  'Low MOQ white-label gummies from 500 bottles',
  'Free formulation consultation with our R&D team',
  'FDA-registered, GMP-certified manufacturing',
  'Sea-freight export and compliance documentation handled in-house'
]
const ctaPointsZh = [
  '白标软糖最低 500 瓶起订',
  '研发团队免费配方咨询',
  'FDA 注册 + GMP 认证工厂',
  '海运出口与合规文件一站式处理'
]

// 找不到文章 → 抛 404。客户端在文章间跳转时 setup 重新执行，数据有空窗（pending=true、article=null），
// 不能在此同步 throw，否则导航瞬间误判 404 卡住页面。必须用 watch 等取数结束后再判。
watch([article, pending], ([a, isPending]) => {
  if (!isPending && !a) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
  }
}, { immediate: true })

// 标题/描述按 locale 取
const title = computed(() => {
  const a = article.value
  if (!a) return ''
  return isZh.value ? a.titleZh ?? a.title : a.title
})
const description = computed(() => {
  const a = article.value
  if (!a) return ''
  return isZh.value ? a.descriptionZh ?? a.description : a.description
})
const categoryName = computed(() => (article.value ? getBlogCategoryName(article.value.category, isZh.value) : ''))
const dateLabel = computed(() => article.value?.date.slice(0, 10) ?? '')

// 动态 SEO
const seoTitle = computed(() => title.value)
useSeoMeta({
  title: seoTitle,
  description,
  ogTitle: seoTitle,
  ogDescription: description,
  ogType: 'article',
  ogImage: () => article.value?.cover ?? `${SITE_URL}/images/ogImage.jpeg`,
  ogImageAlt: title,
  twitterCard: 'summary_large_image',
  twitterImage: () => article.value?.cover ?? `${SITE_URL}/images/ogImage.jpeg`
})

// 结构化数据：Article + BreadcrumbList（仿产品详情页写法）
useHead({
  script: computed(() => {
    const a = article.value
    if (!a) return []
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title.value,
      description: description.value,
      image: a.cover,
      datePublished: a.date,
      dateModified: a.date,
      author: {
        '@type': 'Organization',
        name: site.name,
        url: SITE_URL
      },
      publisher: {
        '@type': 'Organization',
        name: site.name,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/logo/logo.png`
        }
      },
      mainEntityOfPage: `${SITE_URL}${localePath(a.path)}`
    }
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: isZh.value ? '首页' : 'Home', item: `${SITE_URL}${localePath('/')}` },
        { '@type': 'ListItem', position: 2, name: isZh.value ? '资源中心' : 'Blog', item: `${SITE_URL}${localePath('/blog')}` },
        { '@type': 'ListItem', position: 3, name: title.value, item: `${SITE_URL}${localePath(a.path)}` }
      ]
    }
    return [
      { type: 'application/ld+json', innerHTML: JSON.stringify(articleSchema) },
      { type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumbSchema) }
    ]
  })
})
</script>

<template>
  <div v-if="article">
    <PageHero
      :eyebrow="categoryName"
      :title="title"
      :subtitle="description"
      :image="article.cover"
      :breadcrumb="[
        { label: isZh ? '首页' : 'Home', to: localePath('/') },
        { label: isZh ? '资源中心' : 'Blog', to: localePath('/blog') },
        { label: title }
      ]"
    />

    <!-- 正文 -->
    <article class="section bg-white">
      <div class="wrap max-w-3xl">
        <!-- 元信息行 -->
        <div class="flex flex-wrap items-center gap-4 text-xs text-navy/50">
          <time>{{ dateLabel }}</time>
          <span class="h-1 w-1 rounded-full bg-navy/30" />
          <span>{{ categoryName }}</span>
          <span v-if="article.tags.length" class="h-1 w-1 rounded-full bg-navy/30" />
          <div v-if="article.tags.length" class="flex flex-wrap gap-2">
            <span
              v-for="tag in article.tags"
              :key="tag"
              class="rounded-full bg-mist px-2.5 py-1 text-[11px] font-medium text-navy/60"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Markdown 正文（@nuxt/content 渲染器） -->
        <div class="prose-navy blog-content mt-8">
          <ContentRenderer :value="article" />
        </div>

        <!-- 返回列表 -->
        <div class="mt-10">
          <NuxtLink :to="localePath('/blog')" class="link-underline">
            <UiAppIcon name="arrow-right" :size="16" class="rotate-180" />
            {{ isZh ? '返回资源中心' : 'Back to Blog' }}
          </NuxtLink>
        </div>
      </div>
    </article>

    <!-- 询盘 CTA（转化点：引流 → 询盘闭环） -->
    <section class="section bg-mist">
      <div class="wrap grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <div class="reveal lg:sticky lg:top-28">
          <span class="eyebrow"><span class="h-px w-6 bg-gold" />{{ isZh ? '开始您的项目' : 'Start Your Project' }}</span>
          <h2 class="mt-3 text-3xl font-bold text-navy md:text-4xl">
            {{ isZh ? '把这篇指南变成您的产品' : 'Turn This Guide Into Your Product' }}
          </h2>
          <p class="mt-5 leading-relaxed text-navy/70">
            {{ isZh ? '无论您是第一次做白标，还是准备开发独家配方，我们的团队都能帮您落地。免费配方咨询，24 小时内回复。' : 'Whether you are launching your first white-label product or developing an exclusive formula, our team can help you make it real. Free formulation consultation, reply within 24 hours.' }}
          </p>
          <ul class="mt-6 space-y-3">
            <li v-for="(point, i) in (isZh ? ctaPointsZh : ctaPoints)" :key="i" class="flex items-start gap-2.5 text-sm text-navy/80">
              <UiAppIcon name="check" :size="16" class="mt-0.5 shrink-0 text-leaf" />
              {{ point }}
            </li>
          </ul>
        </div>
        <div class="reveal" :style="{ transitionDelay: '120ms' }">
          <QuoteForm />
        </div>
      </div>
    </section>

    <!-- 相关文章 -->
    <section v-if="relatedPosts.length" class="section bg-white">
      <div class="wrap">
        <UiSectionHeading
          :eyebrow="isZh ? '继续阅读' : 'Keep Reading'"
          :title="isZh ? '相关指南' : 'Related Guides'"
          align="left"
        />
        <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BlogArticleCard
            v-for="(post, i) in relatedPosts"
            :key="post.path"
            :post="post"
            :index="i"
            variant="mini"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 文章正文排版：@nuxt/content 渲染出的 h2/h3/p/ul/table 等样式 */
.blog-content :deep(h2) {
  @apply mt-10 text-2xl font-bold text-navy;
}
.blog-content :deep(h3) {
  @apply mt-8 text-xl font-bold text-navy;
}
.blog-content :deep(h4) {
  @apply mt-6 text-lg font-semibold text-navy;
}
.blog-content :deep(p) {
  @apply mt-4 leading-relaxed text-navy/75;
}
.blog-content :deep(ul) {
  @apply mt-4 list-disc space-y-2 pl-5 text-navy/75;
}
.blog-content :deep(ol) {
  @apply mt-4 list-decimal space-y-2 pl-5 text-navy/75;
}
.blog-content :deep(li) {
  @apply leading-relaxed;
}
.blog-content :deep(strong) {
  @apply font-semibold text-navy;
}
.blog-content :deep(a) {
  @apply font-medium text-gold-dark underline decoration-gold/40 underline-offset-2 hover:decoration-gold-dark;
}
.blog-content :deep(table) {
  @apply mt-6 w-full border-collapse overflow-hidden rounded-xl text-sm;
}
.blog-content :deep(th) {
  @apply bg-navy px-4 py-3 text-left font-semibold text-white;
}
.blog-content :deep(td) {
  @apply border-b border-mist-border px-4 py-3 text-navy/75;
}
.blog-content :deep(tr:nth-child(even) td) {
  @apply bg-mist/40;
}
.blog-content :deep(blockquote) {
  @apply mt-6 border-l-4 border-gold bg-mist/40 px-5 py-4 text-navy/75 italic;
}
</style>
