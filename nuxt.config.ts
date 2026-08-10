// https://nuxt.com/docs/api/configuration/nuxt-config
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { getAllProducts } from './app/data/products-mutations'
import { getAllProductListRoutes, getAllProductListApiRoutes } from './app/data/productRoutes'
import { DEFAULT_PRODUCT_IMAGE_BASE_URL } from './app/data/productImageUrl'

// 两个语言：英文为默认裸路径，中文使用 /zh 前缀
const LOCALES = ['en', 'zh'] as const

// 给一组裸路径乘以所有 locale：英文保留裸路径，中文生成 /zh/xxx
const withLocales = (bareRoutes: string[]) =>
  LOCALES.flatMap((l) => bareRoutes.map((r) => l === 'en' ? r : `/${l}${r === '/' ? '' : r}`))

// 统一加尾斜杠：GitHub Pages 会把 /products/xxx 301 到 /products/xxx/，
// sitemap / canonical / hreflang / 预渲染路由必须与线上实际返回的 URL 完全一致，
// 否则 Google 顺着 sitemap 访问撞上 301 会判定「无法识别此网址」（见产品页收录问题）。
const withTrailingSlash = (r: string) => (r === '/' ? '/' : `${r}/`)

// 博客文章 slug 列表（content/blog/*.md 文件名）—— 构建期读取，驱动 SSG 预渲染与 sitemap。
// 文件不存在时（首次检出未装依赖前）静默回退空数组，避免构建崩溃。
const blogSlugs = (() => {
  try {
    return readdirSync(join(process.cwd(), 'content', 'blog'))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
  } catch { return [] }
})()

const staticPageRoutes = [
  '/',
  '/about',
  '/products',
  '/services',
  '/manufacturing',
  '/how-it-works',
  '/blog',
  '/contact',
  '/privacy',
  '/terms'
]

// Full product list for SSG route generation (server-only, not in client bundle)
const allProducts = getAllProducts()

// 产品列表分页路由 + 列表 API 路由（复用 productRoutes 的统一规则，避免分页逻辑在两处漂移）
const productListRoutes = getAllProductListRoutes(allProducts)
const productListApiRoutes = getAllProductListApiRoutes(allProducts)

const canonicalBareRoutes = Array.from(new Set([
  ...staticPageRoutes,
  ...productListRoutes,
  ...allProducts.map((p) => `/products/${p.slug}`),
  ...blogSlugs.map((s) => `/blog/${s}`)
]))

// sitemap lastmod：显式 urls + zeroRuntime 时 @nuxtjs/sitemap 无法从源文件推断时间戳，
// autoLastmod 会被静默丢弃（实测 en-US.xml 里 0 个 <lastmod>）。这里手动注入一个构建日期，
// 让 Google 知道站点有更新、触发周期性重新抓取。构建日期尽量取最近一次源码改动时间，
// 避免每次 generate 都产生新的 lastmod 导致无效的「伪更新」。
const buildDate = (() => {
  // 取项目内最近被修改的文件时间作为 lastmod（windows 下 git 调用不稳定，用文件系统遍历）
  try {
    let latest = 0
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const p = join(dir, entry)
        let st
        try { st = statSync(p) } catch { continue }
        if (st.isDirectory()) walk(p)
        else latest = Math.max(latest, st.mtimeMs)
      }
    }
    for (const r of ['app', 'public']) walk(r)
    if (latest > 0) return new Date(latest).toISOString().slice(0, 10)
  } catch { /* 忽略，回退到固定日期 */ }
  return '2026-08-01'
})()

const sitemapEntries = (locale: typeof LOCALES[number]) =>
  canonicalBareRoutes.map((route) => {
    const loc = locale === 'en' ? withTrailingSlash(route) : route === '/' ? '/zh/' : withTrailingSlash(`/zh${route}`)
    const enHref = withTrailingSlash(route)
    const zhHref = route === '/' ? '/zh/' : withTrailingSlash(`/zh${route}`)

    return {
      loc,
      lastmod: buildDate,
      alternatives: [
        { hreflang: 'en-US', href: enHref },
        { hreflang: 'zh-CN', href: zhHref },
        { hreflang: 'x-default', href: enHref }
      ]
    }
  })

export default defineNuxtConfig({
  compatibilityDate: '2026-07-01',
  devtools: { enabled: false },

  // 产品路由由数据驱动显式预渲染 ——
  // 1. 详情页 /products/[slug]：列表有分页，crawlLinks 无法稳定发现第 2 页之后的产品链接
  // 2. 列表分页/分类页 /products/page/N、/products/[cat]、/products/[cat]/page/N：
  //    虽用 <NuxtLink> 可被 crawlLinks 发现，但显式注入确保全量生成独立 HTML
  // 双语改造：英文裸路径，中文 /zh 前缀。
  // 注：旧站 /en 前缀路径已确认无需兼容（GitHub Pages 上 _redirects 不生效且无人访问），
  // 不再生成 /en 兼容页，也未保留 _redirects 文件。
  hooks: {
    'nitro:config': (nitroConfig) => {
      nitroConfig.prerender ||= {}
      nitroConfig.prerender.routes ||= []
      // 预渲染路由统一带尾斜杠（与 sitemap/canonical 一致，避免 GitHub Pages 301）
      const productDetailRoutes = withLocales(allProducts.map((p) => `/products/${p.slug}`)).map(withTrailingSlash)
      const listRoutes = withLocales(productListRoutes).map(withTrailingSlash)
      const pageRoutes = withLocales(staticPageRoutes).map(withTrailingSlash)
      const blogRoutes = withLocales(blogSlugs.map((s) => `/blog/${s}`)).map(withTrailingSlash)
      const productApiRoutes = allProducts.map((p) => `/api/products/${p.slug}`)
      // 博客 API 预渲染为静态 JSON：客户端 $fetch 命中缓存文件（GitHub Pages 纯静态）
      const blogApiRoutes = blogSlugs.map((s) => `/api/blog/${s}`)
      nitroConfig.prerender.routes.push(
        ...pageRoutes,
        ...productDetailRoutes,
        ...listRoutes,
        ...blogRoutes,
        ...productListApiRoutes,
        ...productApiRoutes,
        '/api/blog',
        ...blogApiRoutes,
        '/api/products/search-index',
        '/404.html'
      )
    }
  },

  // 默认开启 SSR，既能 `npm run dev` 跑动态，也能 `npm run generate` 生成全静态站点。
  ssr: true,

  modules: ['@nuxtjs/tailwindcss', '@nuxt/image', '@nuxtjs/sitemap', '@nuxtjs/i18n', '@nuxt/content'],

  // 中英文分路径 SEO：英文使用裸路径，中文使用 /zh/...，利于 Google 分别收录 + hreflang
  i18n: {
    locales: [
      { code: 'en', language: 'en-US', name: 'English' },
      { code: 'zh', language: 'zh-CN', name: '中文' }
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default', // 英文默认不带前缀，中文使用 /zh
    // 全站统一尾斜杠：让 localePath() 生成的路由、canonical/hreflang/og:url 都以 / 结尾，
    // 与 GitHub Pages 实际返回的 URL（/products/xxx → 301 → /products/xxx/）对齐，
    // 避免 Google 顺着 sitemap 访问裸路径时撞上 301 而判定「无法识别」。
    trailingSlash: true,
    // 翻译文案统一来自 i18n/i18n.config.ts（复用原 messages.ts，保持 MessageKey 类型）
    vueI18n: '~/i18n/i18n.config.ts',
    // 默认入口固定到英文，中文页面仅通过 /zh/... 访问，避免浏览器语言把 / 自动导向中文。
    detectBrowserLanguage: false,
    baseUrl: 'https://www.mildy-health.com'
  },

  // 站点绝对地址 —— sitemap / canonical / og:url 的统一基准（SEO 必需）
  site: {
    url: 'https://www.mildy-health.com',
    name: 'MILDY Health',
    // 全站统一尾斜杠：@nuxtjs/sitemap 通过 fixSlashes(siteConfig.trailingSlash, ...)
    // 为 sitemap 的 <loc>/hreflang 追加 /，与 GitHub Pages 实际返回的 URL 对齐。
    trailingSlash: true
  },

  // 自动生成 sitemap.xml + robots.txt（@nuxtjs/i18n 与 @nuxtjs/sitemap 原生集成，自动输出 hreflang）
  sitemap: {
    zeroRuntime: true,
    autoLastmod: true,
    autoI18n: false,
    sitemaps: {
      'en-US': { urls: sitemapEntries('en') },
      'zh-CN': { urls: sitemapEntries('zh') }
    }
  },

  // Web3Forms 询盘表单 access_key —— 去 https://web3forms.com 用邮箱注册即可获取
  // 该 key 设计为前端可见（类似 reCAPTCHA site key），可安全公开
  // 也可通过环境变量 NUXT_PUBLIC_WEB3FORMS_ACCESS_KEY 覆盖
  runtimeConfig: {
    public: {
      web3formsAccessKey: process.env.NUXT_PUBLIC_WEB3FORMS_ACCESS_KEY || 'b07fa823-6ec0-4508-abb1-244849ee6019',
      productImageBaseUrl: process.env.NUXT_PUBLIC_PRODUCT_IMAGE_BASE_URL || DEFAULT_PRODUCT_IMAGE_BASE_URL,
      // Google Analytics 4 衡量 ID（gtag.js）；可通过环境变量 NUXT_PUBLIC_GA_ID 覆盖
      gaId: process.env.NUXT_PUBLIC_GA_ID || 'G-16K2YJ87K0'
    }
  },

  css: ['~/assets/css/main.css'],

  app: {
    // CNAME = www.mildy-health.com，使用自定义域名，部署在根路径。
    baseURL: '/',
    head: {
      // <html lang> 由 @nuxtjs/i18n 按当前 locale 自动设置（en-US / zh-CN），不再硬编码
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' }
        // 注：不再输出 name="keywords"（Google 自 2009 起已完全忽略该标签）
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
        // Inter 字体已自托管在 public/fonts/，通过 main.css 的 @font-face 加载，
        // 无需再引用 Google Fonts（国内访问受限），零外部依赖
      ],
      script: [
        // 渐进增强：JS 可用时给 <html> 加 .js。CSS 中 .reveal 默认可见，
        // 仅 .js .reveal 才先隐藏再滚动显示 —— 无 JS / JS 失败时内容不被 opacity:0 锁死。
        // 必须放 <head>：在首帧渲染前标记 .js，避免内容先显示→隐藏→再动画的闪烁。
        { innerHTML: "document.documentElement.classList.add('js')", tagPosition: 'head' }
      ]
    }
  },

  // 所有图片已本地化为站内相对路径，
  // IPX 在 SSG 时统一预渲染为 WebP/AVIF + 响应式多尺寸，无需外部域名白名单。
  // 注意：format 数组仅在 <NuxtPicture> 下才会生成多格式 <source> 协商；
  // 全站实际用的是 <NuxtImg>（单 <img>，见 ui/LazyImage.vue / home/HeroBanner.vue），
  // 它们各自显式 format="webp"，故此处数组目前不生效，保留仅作将来切 NuxtPicture 时的默认值。
  image: {
    format: ['avif', 'webp'],
    quality: 80,
    screens: { xs: 320, sm: 640, md: 768, lg: 1024, xl: 1280, xxl: 1536 },
    densities: [1, 2]
  },

  nitro: {
    prerender: {
      // 抓取页面内所有 <NuxtLink>，自动预渲染整站为静态 HTML。
      crawlLinks: false,
      // 预渲染路由由 hooks.nitro:config 统一注入，此处不重复声明
      failOnError: true
    }
  }
})
