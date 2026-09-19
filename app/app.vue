<script setup lang="ts">
import { site, SITE_URL } from '~/data/site'
// 预加载正文关键字体（400 = body 默认字重），减少首屏字体闪烁/CLS。
// 通过 ~/assets 引用，Nuxt/Vite 会在构建期把它替换成带 hash 的 /_nuxt/*.woff2 并注入 <link rel="preload">。
import interRegular from '~/assets/fonts/inter-latin-400-normal.woff2'

const { isZh } = useLocale()

useHead({
  link: [
    { rel: 'preload', as: 'font', type: 'font/woff2', href: interRegular, crossorigin: 'anonymous' }
  ]
})

// Google Analytics 4（gtag.js）—— 来自 runtimeConfig.public.gaId
const gaId = useRuntimeConfig().public.gaId
if (gaId) {
  useHead({
    link: [
      { rel: 'preconnect', href: 'https://www.googletagmanager.com' },
      { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' }
    ]
  })
}

onMounted(() => {
  if (!gaId) return
  const w = window as typeof window & {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    requestIdleCallback?: (cb: () => void) => number
  }
  const loadAnalytics = () => {
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) return
    w.dataLayer = w.dataLayer || []
    // 官方 stub 语义：gtag.js 只认 arguments 对象格式的命令，push 真数组会被静默忽略，
    // 导致 config 不生效、GA4 收不到任何数据（2026-07-28~09-19 数据归零的根因）
    w.gtag = function () {
      w.dataLayer?.push(arguments as unknown as unknown[])
    }
    w.gtag('js', new Date())
    w.gtag('config', gaId)
    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    script.async = true
    document.head.appendChild(script)
  }
  if (w.requestIdleCallback) w.requestIdleCallback(loadAnalytics)
  else window.setTimeout(loadAnalytics, 2000)
})

// 注入 <html lang> 与 hreflang 交替链接 —— 由 @nuxtjs/i18n 提供，自动按当前 locale 生成
// useLocaleHead(seo 默认开启) 会同时输出：canonical、hreflang(含 x-default)、og:url、og:locale(/alternate)
const localeHead = useLocaleHead()

// 标题模板按当前 locale 选择站名 + tagline（中文/英文不同）
// htmlAttrs/link/meta 用 getter 保持响应式：locale 或路由切换时跟随更新
useHead({
  titleTemplate: (t) => (t ? `${t} | ${site.brand}` : `${isZh.value ? site.nameCn : site.name} — ${isZh.value ? site.taglineZh : site.tagline}`),
  htmlAttrs: () => localeHead.value.htmlAttrs,
  link: () => localeHead.value.link,
  meta: () => [
    // theme-color：移动端浏览器地址栏 / PWA 主题色（与页面深蓝主色一致）
    { name: 'theme-color', content: '#0A2540' },
    ...localeHead.value.meta
  ]
})

useSeoMeta({
  title: () => `${isZh.value ? site.nameCn : site.name} — ${isZh.value ? site.taglineZh : site.tagline}`,
  ogTitle: () => isZh.value ? site.taglineZh : site.tagline,
  description: () => isZh.value ? site.descriptionZh : site.description,
  ogDescription: () => isZh.value ? site.descriptionZh : site.description,
  ogType: 'website',
  ogSiteName: isZh.value ? site.nameCn : site.name,
  // og:url 已由 useLocaleHead() 的 meta 统一输出（规范化的 locale 路径），此处不再重复
  ogImage: `${SITE_URL}/images/ogImage.jpeg`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: () => `${isZh.value ? site.nameCn : site.name} — ${isZh.value ? '全球营养补充剂 OEM/ODM 解决方案' : 'Global Nutritional Supplement OEM/ODM Solutions'}`,
  twitterCard: 'summary_large_image',
  // twitter:title/description 补全（之前只设了 card 和 image；Twitter 卡片展示时标题缺失会用页面标题兜底，显式给出更可控）
  twitterTitle: () => isZh.value ? site.taglineZh : site.tagline,
  twitterDescription: () => isZh.value ? site.descriptionZh : site.description,
  twitterImage: `${SITE_URL}/images/ogImage.jpeg`
})

// 结构化数据：Organization（利于 SEO / Google 富摘要）
// 注：站点搜索由 Pagefind 客户端弹窗提供，无 /products?q= 服务端路由，
// 故不输出虚构的 WebSite.potentialAction SearchAction（爬虫抓取会得到 404）。
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: site.name,
        alternateName: site.nameCn,
        url: SITE_URL,
        logo: `${SITE_URL}/logo/logo.png`,
        description: site.description,
        foundingDate: String(site.founded),
        email: site.contact.email,
        telephone: site.contact.phone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: site.contact.address,
          addressCountry: 'CN'
        },
        ...(site.social.length ? { sameAs: site.social.map((s) => s.href) } : {})
      })
    }
  ]
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
