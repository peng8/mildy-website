<script setup lang="ts">
import { site, SITE_URL } from '~/data/site'
import { trackEvent } from '~/composables/useAnalytics'

const { t, isZh, localePath } = useLocale()

useSeoMeta({
  title: () => isZh.value ? '联系 MILDY — OEM/ODM 补充剂报价' : 'Contact MILDY — OEM/ODM Supplement Quote',
  description: () => isZh.value
    ? '联系 MILDY Health 咨询 OEM/ODM 营养补充剂代工。邮件、WhatsApp、电话或在线表单——我们 24 小时内回复。'
    : 'Contact MILDY Health for OEM/ODM supplement manufacturing inquiries. Email, WhatsApp, phone or submit our online form — we respond within 24 hours.'
})

// 用经纬度坐标生成 Google Maps 嵌入地址
// q=lat,lng 格式只会落一个标记点,避免地址文本匹配出多个候选点
// 注意：必须用 WGS-84 坐标（wgsLat/wgsLng）。lat/lng 是 GCJ-02（高德火星坐标），
// 直接喂给 Google Maps 会偏移约 620 米,客户按错图找不到厂。
const mapSrc = computed(() => {
  const { wgsLat, wgsLng } = site.contact
  return `https://maps.google.com/maps?q=${wgsLat},${wgsLng}&z=16&output=embed`
})

const contactMethods = [
  { icon: 'mail', key: '1', value: site.contact.email, href: `mailto:${site.contact.email}`, valueParams: { email: site.contact.email } },
  { icon: 'whatsapp', key: '2', value: null, href: site.contact.whatsappHref, valueParams: {} },
  { icon: 'phone', key: '3', value: site.contact.phone, href: site.contact.phoneHref, valueParams: { phone: site.contact.phone, hours: site.contact.hours } },
  { icon: 'pin', key: '4', value: null, href: null, valueParams: { address: isZh.value ? site.contact.addressCn : site.contact.address } }
]

// 联系方式卡片点击埋点 —— 目前只关心 WhatsApp（跳转到 wa.me）
const trackContactClick = (method: { icon: string }) => {
  if (method.icon === 'whatsapp') trackEvent('whatsapp_click', { placement: 'contact' })
}

// ContactPage + Organization 结构化数据（地址/电话/坐标/sameAs 已存在于 site.ts，用于本地/公司实体识别）
useHead({
  script: computed(() => [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: isZh.value ? site.nameCn : site.name,
        url: SITE_URL,
        mainEntity: {
          '@type': 'Organization',
          name: site.name,
          alternateName: site.nameCn,
          url: SITE_URL,
          email: site.contact.email,
          telephone: site.contact.phone,
          address: {
            '@type': 'PostalAddress',
            streetAddress: isZh.value ? site.contact.addressCn : site.contact.address,
            addressCountry: 'CN'
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: site.contact.wgsLat,
            longitude: site.contact.wgsLng
          },
          openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: '09:00',
            closes: '18:00'
          },
          ...(site.social.length ? { sameAs: site.social.map((s) => s.href) } : {})
        }
      })
    }
  ])
})
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('contact.hero.eyebrow')"
      :title="t('contact.hero.title')"
      :subtitle="t('contact.hero.subtitle')"
      image="/images/contact/hero.jpg"
      :breadcrumb="[{ label: t('nav.home'), to: localePath('/') }, { label: t('nav.contact') }]"
    />

    <section class="section bg-white">
      <div class="wrap">
        <div class="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <!-- 左：联系方式 -->
          <div>
            <span class="eyebrow"><span class="h-px w-6 bg-gold" />{{ t('contact.info.eyebrow') }}</span>
            <h2 class="mt-3 text-2xl font-bold md:text-3xl">{{ t('contact.info.title') }}</h2>
            <p class="mt-4 text-sm leading-relaxed text-navy/65">
              {{ t('contact.info.desc') }}
            </p>

            <div class="mt-8 space-y-5">
              <div
                v-for="method in contactMethods"
                :key="method.key"
                class="flex items-start gap-4 rounded-xl bg-mist p-5 transition-all hover:shadow-card"
              >
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy text-gold">
                  <UiAppIcon :name="method.icon" :size="24" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-navy">{{ t(`contact.method.${method.key}.label`) }}</h3>
                  <component
                    :is="method.href ? 'a' : 'p'"
                    v-bind="method.href ? { href: method.href, target: method.href.startsWith('http') ? '_blank' : undefined, rel: 'noopener noreferrer' } : {}"
                    class="mt-1 text-base font-semibold text-navy-500 transition-colors hover:text-navy"
                    @click="trackContactClick(method)"
                  >
                    {{ t(`contact.method.${method.key}.value`, method.valueParams) }}
                  </component>
                  <p class="mt-1 text-xs text-navy/50">{{ t(`contact.method.${method.key}.desc`, method.valueParams) }}</p>
                </div>
              </div>
            </div>

            <!-- 社媒 -->
            <div class="mt-8">
              <h3 class="text-sm font-bold text-navy">{{ t('contact.followUs') }}</h3>
              <div class="mt-3 flex gap-3">
                <a
                  v-for="s in site.social"
                  :key="s.label"
                  :href="s.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="s.label"
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white transition-colors hover:bg-navy-500"
                >
                  <UiAppIcon :name="s.icon" :size="18" />
                </a>
              </div>
            </div>
          </div>

          <!-- 右：询价表单 -->
          <div>
            <QuoteForm variant="light" />
          </div>
        </div>
      </div>
    </section>

    <!-- 地图嵌入 -->
    <section class="bg-mist">
      <div class="wrap py-16">
        <UiSectionHeading
          :eyebrow="t('contact.location.eyebrow')"
          :title="t('contact.location.title')"
          :subtitle="t('contact.location.subtitle')"
        />
        <div class="reveal mt-10 overflow-hidden rounded-2xl shadow-card">
          <iframe
            :title="t('contact.location.mapTitle')"
            :src="mapSrc"
            width="100%"
            height="400"
            style="border:0;"
            allowfullscreen
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            class="w-full"
          />
        </div>
      </div>
    </section>
  </div>
</template>
