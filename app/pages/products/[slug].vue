<script setup lang="ts">
// 产品详情页 —— 封面大图 + 缩略图画廊 + 描述特性 + 规格参数表 + 咨询定制 CTA + 同类推荐
// Product data fetched from server API; heavy products-mutations.ts is never bundled into client.
import type { Product, ProductCategory } from '~/data/products'
import { productCategories } from '~/data/productCategories'
import { SITE_URL } from '~/data/site'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const {  t, isZh , formatMoq, localePath } = useLocale()

const { data, pending } = await useAsyncData(
  `product-${slug.value}`,
  () => $fetch<{ product: Product; category: ProductCategory | null; related: Product[] }>(`/api/products/${slug.value}`),
  { watch: [slug] }
)

const product = computed(() => data.value?.product)
const category = computed(() => data.value?.category)
const related = computed(() => data.value?.related ?? [])

// 找不到产品 → 抛 404，交由 Nuxt 的错误页 / error.vue 处理。
// 注意：客户端在详情页之间跳转时 setup 重新执行，数据有空窗（pending=true、product=undefined），
// 不能在此同步 throw，否则导航瞬间误判 404 卡住页面。必须用 watch 等取数结束后再判。
watch([product, pending], ([p, isPending]) => {
  if (!isPending && !p) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found', fatal: true })
  }
}, { immediate: true })

// FAQ 单一数据源：页面可见 <details> 与 JSON-LD FAQPage schema 共用，避免两份文案漂移。
// 必须声明在 useHead 之前——其 script computed 引用了 faqs；若声明在后，
// 客户端导航时 unhead 提前解析会撞上 const 暂时性死区(TDZ)，抛 ReferenceError 中断路由。
const faqs = computed(() => {
  const p = product.value
  if (!p) return []
  const cat = category.value
  if (isZh.value) {
    const pn = p.nameZh ?? p.name
    const cn = cat?.nameZh ?? '补充剂'
    const pm = formatMoq(p.moq)
    return [
      { q: `${pn} 的最小起订量是多少?`, a: `${pn} 的最小起订量为 ${pm},我们也为新合作伙伴提供试单。` },
      { q: '可以定制配方和包装吗?', a: `可以。作为 OEM/ODM 制造商,我们提供${cn}的全面定制——活性成分剂量、口味、形状、标签设计和结构化包装。` },
      { q: '交期多久?', a: '确认包装设计和订单后,常规生产交期 7–14 个工作日,样品通常 7–15 天内完成。' },
      { q: '工厂持有哪些认证?', a: '我们 20,000 平方米工厂持有 GMP 认证、FDA 注册、BRCGS 和 NSF GMP。每批次出具完整 COA,涵盖有效成分、重金属和微生物检测。' }
    ]
  }
  const cn = cat?.name ?? 'supplements'
  return [
    { q: `What is the MOQ for ${p.name}?`, a: `The minimum order quantity for ${p.name} is ${p.moq}. We also support trial orders for new partners — contact us to discuss your volume needs.` },
    { q: 'Can I customize the formula and packaging?', a: `Yes. As an OEM/ODM manufacturer we offer full customization for ${cn} — including active ingredient dosage, flavor, shape, color, label artwork and structural packaging. Free formulation consultation is available.` },
    { q: 'What is the lead time?', a: 'Typical production lead time is 7–14 working days after artwork and order confirmation. Samples are usually ready within 7–15 days. Sea-freight export documentation is handled in-house.' },
    { q: 'Which certifications does your facility hold?', a: 'Our 20,000 m² facility is GMP-certified with FDA registration, BRCGS and NSF GMP. Every batch ships with a full COA covering active assay, heavy metals and microbiology.' }
  ]
})

// 动态 SEO
// title 命中买家搜索意图(产品名 + 剂型 + OEM/Supplier)，超长时智能截断产品名保关键词
const seoTitle = computed(() => {
  const p = product.value
  if (!p) return ''
  const catName = category.value?.name ?? 'Supplement'
  // 后缀固定约 18 字符，预留产品名空间；超长则按单词边界截断
  const suffix = ` | OEM ${catName} Supplier`
  const maxName = 60 - suffix.length
  let name = p.name
  if (name.length > maxName) {
    name = name.slice(0, maxName - 1).replace(/\s+\S*$/, '') + '…'
  }
  return `${name}${suffix}`
})

// 描述 meta 控制在 150-160 字符内（Google 展示截断线），超长按单词边界截断保留关键词；
// 中文按 ~100 字符截断（中文单字符信息密度更高，展示宽度也受限）
const truncateTo = (s: string, max: number) =>
  s.length > max ? s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…' : s
const seoDescription = computed(() => {
  const p = product.value
  if (!p) return ''
  const raw = isZh.value ? (p.shortDescZh ?? p.shortDesc) : p.shortDesc
  return truncateTo(raw, isZh.value ? 100 : 155)
})

useSeoMeta({
  title: () => { const p = product.value; return p ? (isZh.value ? (p.nameZh ?? p.name) : seoTitle.value) : '' },
  description: seoDescription,
  ogTitle: () => { const p = product.value; return p ? (isZh.value ? (p.nameZh ?? p.name) : seoTitle.value) : '' },
  // og:description 必须与 description 同源(app.vue 全局设了站点级 ogDescription,产品页若不覆盖会沿用站点默认描述,与产品不一致,影响 SEO)
  ogDescription: seoDescription,
  ogType: 'product',
  ogImage: () => { const p = product.value; if (!p) return ''; return p.cover.startsWith('http') ? p.cover : `${SITE_URL}${p.cover}` },
  // og:image alt 必须随产品覆盖（app.vue 全局设了站点级 ogImageAlt，不覆盖会与产品图不匹配）
  ogImageAlt: () => { const p = product.value; return p ? (isZh.value ? (p.nameZh ?? p.name) : p.name) : '' },
  // 注意：产品图来自 CDN（800×800 / 888×1024 不等），无法预知真实尺寸，
  // 覆盖为 null 以移除 app.vue 全局的 og:image:width/height(1200×630) ——
  // 产品页不覆盖会沿用站点级 ogImage 尺寸，与产品图不符反而误导社交爬虫。
  ogImageWidth: null,
  ogImageHeight: null,
  twitterCard: 'summary_large_image',
  twitterImage: () => { const p = product.value; if (!p) return ''; return p.cover.startsWith('http') ? p.cover : `${SITE_URL}${p.cover}` }
})

// 结构化数据：Product + BreadcrumbList（Google 富摘要：产品信息 + 面包屑路径）
useHead({
  script: computed(() => {
    const p = product.value
    if (!p) return []
    const cat = category.value
    const zh = isZh.value
    const pn = zh ? p.nameZh ?? p.name : p.name
    const pd = zh ? p.shortDescZh ?? p.shortDesc : p.shortDesc
    const cn = cat ? (zh ? cat.nameZh : cat.name) : null
    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: pn,
      description: pd,
      image: p.cover,
      category: cn ?? cat?.name,
      // sku 用全局唯一的 slug 充当库存标识（Google 推荐 Product 含 sku 或 mpn）
      sku: p.slug,
      brand: { '@type': 'Brand', name: 'MILDY Health' },
      manufacturer: {
        '@type': 'Organization',
        name: 'MILDY Health',
        url: SITE_URL
      },
      // OEM/ODM 无公开标价：去掉 offers（priceCurrency 无 price 会被 Google 判为无效 Offer，
      // inventoryLevel 描述的是现货库存，也不该拿来表达起订量）。
      // 起订量用干净的 additionalProperty 表达，避免结构化数据告警。
      additionalProperty: {
        '@type': 'PropertyValue',
        name: 'MOQ',
        value: p.moq
      }
    }
    const localePrefix = zh ? '/zh' : ''
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: zh ? '首页' : 'Home', item: `${SITE_URL}${localePrefix}/` },
        { '@type': 'ListItem', position: 2, name: zh ? '产品中心' : 'Products', item: `${SITE_URL}${localePrefix}/products/` },
        ...(cat
          ? [{ '@type': 'ListItem', position: 3, name: cn, item: `${SITE_URL}${localePrefix}/products/categories/${cat.slug}/` },
             { '@type': 'ListItem', position: 4, name: pn, item: `${SITE_URL}${localePrefix}/products/${p.slug}/` }]
          : [{ '@type': 'ListItem', position: 3, name: pn, item: `${SITE_URL}${localePrefix}/products/${p.slug}/` }])
      ]
    }
    // FAQ schema：覆盖买家最常问的询盘问题，利于 Google 富摘要（与页面可见 FAQ 共用 faqs 数据源）
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.value.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    }
    return [
      { type: 'application/ld+json', innerHTML: JSON.stringify(productSchema) },
      { type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumbSchema) },
      { type: 'application/ld+json', innerHTML: JSON.stringify(faqSchema) }
    ]
  })
})

// SEO 正文：基于产品名+剂型+MOQ+OEM 关键词生成，补充详情页文字内容（利于关键词排名）
// 结构化为 h3 + ul + p，比整段纯文本更利于 Google 抓取权重与关键词密度。
// 注意：客户端在详情页之间跳转(点同类推荐)时，useAsyncData 重新取数存在空窗，product 可能为 undefined，
// 故这些 computed 必须对空数据安全（不能用 product.value! 非空断言），否则渲染期抛 TypeError 中断导航。
const seoBlocks = computed(() => {
  const p = product.value
  if (!p) return null
  const cat = category.value
  const catName = cat?.name ?? 'supplement'
  const catNameZh = cat?.nameZh ?? '营养补充剂'
  const productName = isZh.value ? (p.nameZh ?? p.name) : p.name
  const catKey = catName.toLowerCase()
  // 产品名常以剂型结尾（如 "…Gummies"），标题里重复剂型显得冗余，去重
  const dedupeHeading = (name: string, catWord: string) =>
    name.toLowerCase().endsWith(catWord.toLowerCase()) ? name : `${name} ${catWord}`

  if (isZh.value) {
    return {
      heading: `${dedupeHeading(productName, catNameZh)} OEM/ODM —— 为什么选择 MILDY Health`,
      points: [
        `20,000 平方米 GMP 认证工厂,持有 FDA 注册、BRCGS 与 NSF GMP 资质`,
        `${catNameZh} 全面定制:活性成分剂量、口味、形状、植物基配方与品牌包装`,
        `起订量 ${formatMoq(p.moq)},为新合作伙伴提供试单`,
        `服务 30+ 国家和地区的品牌方、跨境卖家与分销商`,
        `免费配方咨询,样品 7–15 天交付,无义务报价`
      ],
      closing: `MILDY Health 是中国领先的 ${catNameZh} 合同制造商,为 ${productName} 提供白标贴牌与定制配方一站式服务。立即联系我们,获取您 ${productName} ${catNameZh} 项目的无义务报价,我们的 OEM/ODM 团队将在 24 小时内回复。`
    }
  }
  return {
    heading: `Start Your ${dedupeHeading(productName, catName)} OEM/ODM Project with MILDY Health`,
    points: [
      `GMP-certified 20,000 m² facility with FDA registration, BRCGS and NSF GMP accreditation`,
      `Full ${catKey} customization: active-ingredient dosage, flavors, shapes, vegan bases and branded packaging`,
      `MOQ from ${p.moq}, with trial orders available for new partners`,
      `Serving supplement brands, cross-border sellers and distributors across 30+ countries`,
      `Free formulation consultation, samples within 7–15 days and a no-obligation quote`
    ],
    closing: `Request a no-obligation quote for your ${productName} ${catKey} project today — our OEM/ODM team will respond within 24 hours.`
  }
})

// 跨品类内链：排除当前剂型，列出其余分类页（利于站内权重传递 + 爬虫深挖分类页）
const otherCategories = computed(() => {
  const current = category.value?.slug
  return productCategories.filter((c) => c.slug !== current)
})

// 询价链接：携带产品名 + 剂型 slug，让 /contact 表单可预填上下文
// （直接传 category slug，比从长产品名反推剂型更可靠）
// 注意：不能在这里用模板字符串内联 isZh（模板里 ref 已解包，isZh.value 会是 undefined），
// 必须放到 script 里基于 product/isZh 计算。
const quoteHref = computed(() => {
  const p = product.value
  const name = isZh.value ? (p?.nameZh ?? p?.name ?? '') : (p?.name ?? '')
  const params = new URLSearchParams()
  if (name) params.set('product', name)
  if (category.value?.slug) params.set('type', category.value.slug)
  const qs = params.toString()
  return `${localePath('/contact')}${qs ? `?${qs}` : ''}`
})

// 画廊：封面图为主图；若产品附带额外画廊图则追加为缩略图（目前产品仅封面一张）
const gallery = computed(() => {
  const p = product.value
  return p ? [p.cover, ...p.gallery] : []
})
const activeImg = ref(0)
const activeGalleryImage = computed(() => gallery.value[activeImg.value] ?? gallery.value[0] ?? product.value?.cover ?? '')
watch(gallery, () => (activeImg.value = 0))

const formatSpecValue = (value: string) => {
  if (!isZh.value) return value
  // 剂型 + 包装 + 保质期等通用规格值的中文翻译。
  // 产品名/成分名等专有名词不在此列，保持原文（数据里 specsZh 已存中文的则直接用）。
  const replacements: Record<string, string> = {
    // 剂型
    Gummy: '软糖',
    Gummies: '软糖',
    Softgel: '软胶囊',
    Softgels: '软胶囊',
    'Hard Capsule': '硬胶囊',
    'Hard Capsules': '硬胶囊',
    Tablet: '片剂',
    Tablets: '片剂',
    Powder: '粉剂',
    Powders: '粉剂',
    'Oral Liquid/Drops': '口服液/滴剂',
    // 包装
    'PET bottle / Custom': 'PET 瓶 / 定制包装',
    'PET bottle + desiccant': 'PET 瓶 + 干燥剂',
    'PET bottle + tamper seal': 'PET 瓶 + 防伪封口',
    'PET bottle or tube': 'PET 瓶或软管',
    'Glass/PET bottle + dropper': '玻璃/PET 瓶 + 滴管',
    'Glass jar / Custom': '玻璃罐 / 定制包装',
    'Sachet / Tub / Stick pack': '条包 / 罐装 / 棒状包装',
    // 通用
    Custom: '可定制',
    '24 months': '24 个月'
  }
  return replacements[value] ?? value
}

// 规格表 label 中文翻译：imported 产品无 specsZh，中文版回退到英文 specs，
// 其 label（Dosage Form 等）需在此翻译；手工产品有 specsZh 则直接用其中文 label。
const formatSpecLabel = (label: string) => {
  if (!isZh.value) return label
  const replacements: Record<string, string> = {
    'Dosage Form': '剂型',
    'Active Ingredients': '有效成分',
    'Net Count': '净含量',
    'Net g': '净重',
    'Net ml': '容量',
    'Net lb': '净重',
    Packaging: '包装',
    'Shelf Life': '保质期'
  }
  return replacements[label] ?? label
}
</script>

<template>
  <div v-if="product" data-pagefind-body>
    <!-- 面包屑区（深色底，与透明导航栏协调，避免顶部留白无背景） -->
    <section class="border-b border-white/10 bg-navy pt-16 md:pt-20">
      <div class="wrap py-6">
        <nav class="flex items-center gap-2 text-xs text-white/60" data-pagefind-ignore>
          <NuxtLink :to="localePath('/')" class="transition-colors hover:text-gold-light">{{ isZh ? '首页' : 'Home' }}</NuxtLink>
          <UiAppIcon name="chevron-right" :size="12" class="opacity-50" />
          <NuxtLink :to="localePath('/products')" class="transition-colors hover:text-gold-light">{{ isZh ? '产品中心' : 'Products' }}</NuxtLink>
          <UiAppIcon name="chevron-right" :size="12" class="opacity-50" />
          <span v-if="category" class="text-white/80">{{ isZh ? category.nameZh : category.name }}</span>
        </nav>
      </div>
    </section>

    <!-- 主信息区：画廊 + 详情 -->
    <section class="section">
      <div class="wrap grid gap-10 lg:grid-cols-2 lg:gap-14">
        <!-- 左侧：主图 + 缩略图行 -->
        <div class="reveal lg:sticky lg:top-28 lg:self-start">
          <div class="overflow-hidden rounded-2xl bg-mist-dark shadow-card">
            <UiLazyImage :src="activeGalleryImage" :alt="(isZh ? product.nameZh : product.name) ?? product.name" ratio="aspect-square" eager />
          </div>
          <!-- 缩略图行：仅当存在多张图时显示 -->
          <div v-if="gallery.length > 1" class="mt-4 grid grid-cols-4 gap-3">
            <button
              v-for="(img, i) in gallery"
              :key="i"
              class="overflow-hidden rounded-lg bg-mist-dark ring-2 transition-all"
              :class="i === activeImg ? 'ring-gold' : 'ring-transparent hover:ring-mist-border'"
              :aria-label="isZh ? `查看第 ${i + 1} 张` : `View image ${i + 1}`"
              :aria-current="i === activeImg ? 'true' : undefined"
              @click="activeImg = i"
            >
              <UiLazyImage :src="img" :alt="`${isZh ? product.nameZh ?? product.name : product.name} ${i + 1}`" ratio="aspect-square" class="transition-transform duration-500 hover:scale-105" />
            </button>
          </div>
        </div>

        <!-- 右侧：产品信息 -->
        <div class="reveal" style="transition-delay: 120ms">
          <span
            v-if="category"
            class="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-dark"
          >
            {{ isZh ? category.shortZh : category.short }}
          </span>
          <h1 class="mt-4 text-3xl font-bold leading-tight md:text-4xl">{{ isZh ? product.nameZh ?? product.name : product.name }}</h1>
          <p class="mt-4 text-base leading-relaxed text-navy/70">{{ isZh ? product.shortDescZh ?? product.shortDesc : product.shortDesc }}</p>

          <!-- 特性勾选列表 -->
          <ul class="mt-6 grid gap-3 sm:grid-cols-2">
            <li v-for="(f, i) in (isZh ? product.featuresZh ?? product.features : product.features)" :key="i" class="flex items-start gap-2.5 text-sm text-navy/80">
              <UiAppIcon name="check" :size="16" class="mt-0.5 shrink-0 text-leaf" />
              {{ f }}
            </li>
          </ul>

          <!-- MOQ + 咨询定制 -->
          <div class="mt-7 flex flex-wrap items-center gap-4 rounded-xl bg-mist p-5 ring-1 ring-mist-border">
            <div>
              <p class="text-xs text-navy/50">{{ t('detail.moq') }}</p>
              <p class="text-xl font-bold text-navy-500">{{ isZh ? '' : 'from ' }}{{ formatMoq(product.moq) }}</p>
            </div>
            <UiAppButton
              :to="quoteHref"
              variant="primary"
              size="lg"
              icon="send"
              class="ml-auto"
            >
              {{ t('detail.requestQuote') }}
            </UiAppButton>
          </div>

          <!-- 规格参数表 -->
          <div class="mt-8">
            <h2 class="mb-3 text-lg font-bold text-navy">{{ t('detail.specs') }}</h2>
            <div class="overflow-hidden rounded-xl ring-1 ring-mist-border">
              <table class="w-full text-sm">
                <tbody>
                  <tr
                    v-for="(spec, i) in (isZh ? product.specsZh ?? product.specs : product.specs)"
                    :key="i"
                    :class="i % 2 === 0 ? 'bg-white' : 'bg-mist'"
                  >
                    <th scope="row" class="w-2/5 px-4 py-3 text-left font-medium text-navy/60">
                      {{ formatSpecLabel(spec.label) }}
                    </th>
                    <td class="px-4 py-3 font-semibold text-navy">{{ formatSpecValue(spec.value) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 返回列表 -->
          <div class="mt-8">
            <NuxtLink :to="localePath('/products')" class="link-underline">
              <UiAppIcon name="arrow-right" :size="16" class="rotate-180" />
              {{ t('common.backToProducts') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- 详细描述（跨栏段落） -->
    <section class="section bg-mist pt-0 md:pt-0">
      <div class="wrap max-w-4xl">
        <UiSectionHeading
          :eyebrow="t('detail.overview')"
          :title="t('detail.description')"
          align="left"
        />
        <p class="reveal mt-6 text-base leading-relaxed text-navy/75">{{ isZh ? product.descriptionZh ?? product.description : product.description }}</p>
        <!-- SEO 正文：h3 + ul + p 结构化，补充关键词密度与站内锚文本，利于产品页排名 -->
        <div v-if="seoBlocks" class="reveal mt-8 rounded-xl bg-white p-6 ring-1 ring-mist-border">
          <h3 class="text-lg font-bold text-navy">{{ seoBlocks.heading }}</h3>
          <ul class="mt-4 space-y-2.5">
            <li v-for="(point, i) in seoBlocks.points" :key="i" class="flex items-start gap-2.5 text-sm text-navy/75">
              <UiAppIcon name="check" :size="16" class="mt-0.5 shrink-0 text-gold-dark" />
              {{ point }}
            </li>
          </ul>
          <p class="mt-5 border-t border-mist-border pt-4 text-sm leading-relaxed text-navy/60">{{ seoBlocks.closing }}</p>
        </div>
      </div>
    </section>

    <!-- FAQ（询盘常见问题，结构化数据同步输出） -->
    <section class="section bg-white pt-0 md:pt-0">
      <div class="wrap max-w-4xl">
        <UiSectionHeading
          :eyebrow="isZh ? '常见问题' : 'FAQ'"
          :title="isZh ? '关于这款产品的常见问题' : `Frequently Asked Questions`"
          align="left"
        />
        <div class="mt-8 space-y-4">
          <details
            v-for="(faq, i) in faqs"
            :key="i"
            class="reveal group rounded-xl border border-mist-border bg-mist/30 p-5 [&_summary]:cursor-pointer"
          >
            <summary class="flex items-center justify-between font-semibold text-navy">
              <span>{{ faq.q }}</span>
              <UiAppIcon name="chevron-down" :size="18" class="transition-transform group-open:rotate-180" />
            </summary>
            <p class="mt-3 text-sm leading-relaxed text-navy/70">{{ faq.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- 同类推荐 -->
    <section v-if="related.length" class="section bg-white">
      <div class="wrap">
        <UiSectionHeading
          :eyebrow="t('detail.related')"
          :title="isZh ? `更多${category?.nameZh ?? ''}产品` : `More ${category?.name ?? ''} Products`"
          align="left"
        />
        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <ProductGridCard
            v-for="(item, i) in related"
            :key="item.slug"
            :product="item"
            :index="i"
          />
        </div>
      </div>
    </section>

    <!-- 其他剂型分类（跨品类内链：把权重引向分类页，利于整站收录与爬虫深挖） -->
    <section v-if="otherCategories.length" class="section bg-mist">
      <div class="wrap">
        <UiSectionHeading
          :eyebrow="isZh ? '全剂型覆盖' : 'All Dosage Forms'"
          :title="isZh ? '探索其他产品类型' : 'Explore Other Product Categories'"
          align="left"
        />
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="(c, i) in otherCategories"
            :key="c.slug"
            :to="localePath(`/products/categories/${c.slug}`)"
            class="reveal group flex items-center gap-4 rounded-xl bg-white p-5 ring-1 ring-mist-border transition-all hover:-translate-y-0.5 hover:shadow-card"
            :style="{ transitionDelay: `${i * 40}ms` }"
          >
            <div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist-dark">
              <UiLazyImage :src="c.image" :alt="c.name" ratio="aspect-square" />
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-navy group-hover:text-gold-dark">{{ isZh ? c.nameZh : c.name }}</p>
              <p class="mt-0.5 truncate text-xs text-navy/55">{{ isZh ? c.shortZh : c.short }}</p>
            </div>
            <UiAppIcon name="arrow-right" :size="16" class="ml-auto shrink-0 text-navy/30 transition-all group-hover:translate-x-0.5 group-hover:text-gold-dark" />
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
