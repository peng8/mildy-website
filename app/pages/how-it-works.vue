<script setup lang="ts">
import { processSteps } from '~/data/process'
import { trackEvent } from '~/composables/useAnalytics'

const { t, isZh, localePath } = useLocale()

useSeoMeta({
  title: () => isZh.value ? '合作流程 — 6 步从询盘到出货' : 'How It Works — 6 Steps from Inquiry to Shipment',
  description: () => isZh.value
    ? '清晰透明的 6 步流程:询盘 → 配方打样 → 包装设计 → 订单确认 → 生产质检 → 出口装柜。典型周期 8–12 周。'
    : 'A clear, transparent 6-step process: Inquiry → Formulation & Sampling → Artwork & Packaging → Order Confirmation → Production & QC → Shipping & Export. Typical 8–12 weeks.'
})

const timeline = computed(() =>
  processSteps.map((s) => ({
    ...s,
    title: isZh.value ? s.titleZh : s.title,
    desc: isZh.value ? s.descZh : s.desc,
    duration: isZh.value ? s.durationZh : s.duration
  }))
)
// 注：TimelineItem 内部已用 isZh 选择 titleZh/descZh/durationZh，
// 此处 timeline 的本地化字段供「视觉流程概览」模块直接使用。

const faqs = [
  {
    q: 'How long does the whole process take?',
    qZh: '整个流程需要多长时间?',
    a: 'White-label orders typically take 6–8 weeks from inquiry to shipment. ODM custom projects are 10–14 weeks depending on R&D complexity.',
    aZh: '白标订单从询盘到出货通常需要 6–8 周。ODM 定制项目为 10–14 周,具体取决于研发复杂度。'
  },
  {
    q: 'What is the minimum order quantity (MOQ)?',
    qZh: '最小起订量(MOQ)是多少?',
    a: 'Our minimum order quantity (MOQ) is 500 bottles across all dosage forms — gummies, softgels, tablets, capsules, powders and liquid drops. We also offer trial orders for new partners.',
    aZh: '我们的最小起订量(MOQ)为 500 瓶,适用于软糖、软胶囊、片剂、胶囊、粉剂和口服液等全部剂型。我们也为新合作伙伴提供试单。'
  },
  {
    q: 'Can I use my own formula?',
    qZh: '可以使用我自己的配方吗?',
    a: 'Yes. In ODM mode, you can provide your formula or work with our R&D team to develop one. The intellectual property belongs to you.',
    aZh: '可以。在 ODM 模式下,您可以提供配方,或与我们的研发团队共同开发。知识产权归您所有。'
  },
  {
    q: 'Do you help with packaging design?',
    qZh: '你们提供包装设计服务吗?',
    a: 'Absolutely. Our in-house design team creates label artwork and structural packaging aligned with your brand and destination-market regulations.',
    aZh: '当然。我们的内部设计团队创建符合您品牌和目标市场法规的标签设计和结构性包装。'
  },
  {
    q: 'What export documents do you provide?',
    qZh: '你们提供哪些出口单证?',
    a: 'We provide COA (Certificate of Analysis), COO (Certificate of Origin), commercial invoice, packing list, bill of lading and any market-specific documents you need.',
    aZh: '我们提供 COA(检验报告)、COO(原产地证)、商业发票、装箱单、提单以及您需要的任何市场专项文件。'
  },
  {
    q: 'Can I visit the factory before placing an order?',
    qZh: '下单前可以参观工厂吗?',
    a: 'Of course. We welcome on-site and virtual factory tours. Contact us to schedule your visit.',
    aZh: '当然。我们欢迎现场及线上工厂参观。联系我们预约您的参观。'
  }
]

// JSON-LD FAQPage structured data for Google rich results
// 用 computed 保持响应式：locale 切换后结构化数据跟随更新（与详情页写法对齐）
useHead({
  script: computed(() => [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: isZh.value ? f.qZh : f.q,
        acceptedAnswer: { '@type': 'Answer', text: isZh.value ? f.aZh : f.a }
      }))
    })
  }])
})
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('howItWorks.hero.eyebrow')"
      :title="t('howItWorks.hero.title')"
      :subtitle="t('howItWorks.hero.subtitle')"
      image="/images/how-it-works/hero.jpg"
      :breadcrumb="[{ label: t('nav.home'), to: localePath('/') }, { label: t('howItWorks.hero.eyebrow') }]"
    />

    <!-- 时间线 -->
    <section class="section bg-white">
      <div class="wrap">
        <div class="mx-auto max-w-2xl">
          <TimelineItem
            v-for="(step, i) in timeline"
            :key="step.step"
            :item="step"
            :index="i"
            :last="i === timeline.length - 1"
          />
        </div>
      </div>
    </section>

    <!-- 视觉流程概览 -->
    <section class="section bg-mist">
      <div class="wrap">
        <UiSectionHeading
          :eyebrow="t('howItWorks.overview.eyebrow')"
          :title="t('howItWorks.overview.title')"
          :subtitle="t('howItWorks.overview.subtitle')"
        />
        <div class="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div
            v-for="(step, i) in timeline"
            :key="step.step"
            class="reveal text-center"
            :style="`transition-delay: ${i * 80}ms`"
          >
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy text-gold shadow-md">
              <UiAppIcon :name="step.icon" :size="24" />
            </div>
            <span class="mt-3 block text-xs font-bold uppercase tracking-widest text-gold">{{ step.step }}</span>
            <h3 class="mt-1 text-sm font-bold text-navy">{{ step.title }}</h3>
            <span class="mt-2 inline-block rounded-full bg-leaf/10 px-2 py-0.5 text-[10px] font-semibold text-leaf-dark">{{ step.duration }}</span>
            <p class="mt-2 text-xs leading-relaxed text-navy/55">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="section bg-white">
      <div class="wrap mx-auto max-w-3xl">
        <UiSectionHeading
          :eyebrow="t('howItWorks.faq.eyebrow')"
          :title="t('howItWorks.faq.title')"
          :subtitle="t('howItWorks.faq.subtitle')"
        />
        <div class="mt-12 space-y-4">
          <details
            v-for="(faq, i) in faqs"
            :key="i"
            class="reveal group rounded-xl border border-mist-border bg-mist/50 transition-all hover:shadow-card"
            :style="`transition-delay: ${i * 60}ms`"
          >
            <summary class="flex cursor-pointer items-center justify-between p-5 text-sm font-semibold text-navy marker:[content:''] [&::-webkit-details-marker]:hidden">
              {{ isZh ? faq.qZh : faq.q }}
              <UiAppIcon name="chevron-down" :size="18" class="shrink-0 text-navy/40 transition-transform group-open:rotate-180" />
            </summary>
            <p class="px-5 pb-5 text-sm leading-relaxed text-navy/65">{{ isZh ? faq.aZh : faq.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section bg-navy">
      <div class="wrap reveal text-center">
        <h2 class="text-3xl font-bold text-white md:text-4xl">{{ t('howItWorks.cta.title') }}</h2>
        <p class="mx-auto mt-4 max-w-xl text-white/75">{{ t('howItWorks.cta.subtitle') }}</p>
        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <UiAppButton :to="localePath('/contact')" variant="primary" size="lg" icon="send">{{ t('howItWorks.cta.submit') }}</UiAppButton>
          <a
            href="https://wa.me/8618613000659"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-outline"
            @click="trackEvent('whatsapp_click', { placement: 'how_it_works' })"
          >
            <UiAppIcon name="whatsapp" :size="18" />{{ t('howItWorks.cta.whatsapp') }}
          </a>
        </div>
      </div>
    </section>
  </div>
</template>
