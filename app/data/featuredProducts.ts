// 首页精选产品 —— 只含卡片渲染所需的最小字段（约 2KB），
// 避免首页为展示 8 个产品而把整份 curatedProducts(~159KB) 打包进客户端。
// 字段对齐 ProductCardItem：slug/name/nameZh/category/cover/shortDesc/shortDescZh/moq。
// 精选规则：6 大剂型各取 1 个 + 补齐到 8 个（与原来 home/ProductCategories.vue 逻辑等价）。
import type { ProductCardItem } from './products-types'

export const featuredProducts: ProductCardItem[] = [
  {
    slug: 'apple-cider-vinegar-gummies',
    name: 'Apple Cider Vinegar Gummies',
    nameZh: '苹果醋软糖',
    category: 'gummies',
    cover: 'https://img.mildy-health.com/products/m43182_1782872439842-42.jpg',
    shortDesc: "Delicious apple-flavored apple cider vinegar gummies, fully customizable for your brand's detox & wellness supplement line.",
    shortDescZh: '美味的苹果味苹果醋软糖，可完全定制，适用于您品牌的排毒保健品系列。它们有助于身体排毒，促进新陈代谢，平衡体内健康。',
    moq: '500 bottles'
  },
  {
    slug: 'adult-vegan-d3-k2-coconut-softgels-bone-and-immune',
    name: 'Adult Vegan D3+K2 Coconut Softgels - Bone & Immune',
    nameZh: '成人纯素 D3+K2 椰子软胶囊',
    category: 'softgels',
    cover: 'https://img.mildy-health.com/products/m0_mr_x3mrofkgwbc3a6fxekyni95g.jpg',
    shortDesc: 'Picture a sunlit morning: palm shadows on the counter and golden softgels catching the light like little suns—each one a plant-powered promise.',
    shortDescZh: '想象一下阳光明媚的早晨：棕榈树的影子投射在柜台上，金色的软胶囊在阳光下熠熠生辉，宛如一颗颗小太阳——每一粒都蕴含着植物能量的承诺。',
    moq: '500 bottles'
  },
  {
    slug: 'china-oem-vitamin-d3-k2-tablets-365ct-adults-immunity-24m',
    name: 'China OEM Vitamin D3 K2 Tablets 365ct - Adults Immunity 24M',
    nameZh: '维生素 D3+K2 片剂',
    category: 'tablets',
    cover: 'https://img.mildy-health.com/products/m0_fc_3ofc52fdgwjb63qbe6hejlys.png',
    shortDesc: 'China OEM Vitamin D3 K2 Tablets 365ct - Adults Immunity 24M is a one‑year supply of D3 and K2 made for private‑label brands.',
    shortDescZh: '中国OEM维生素D3 K2片365片装 - 成人免疫力24个月，为自有品牌生产，可满足一年的维生素D3和K2用量。',
    moq: '500 bottles'
  },
  {
    slug: 'cinnamon-capsules-dietary-supp-energy-and-immune',
    name: 'Cinnamon Capsules - Dietary Supp: Energy & Immune',
    nameZh: '肉桂能量免疫胶囊',
    category: 'hard-capsules',
    cover: 'https://img.mildy-health.com/products/m0_wj_r0wj4jw9yjqexhj9acgq2g62.png',
    shortDesc: 'OEM/ODM Cinnamon Capsules are a natural dietary supplement in easy-to-swallow capsules, formulated to support energy and immune health with concentrated cinnamon extract.',
    shortDescZh: 'OEM/ODM肉桂胶囊是一款天然膳食补充剂，采用易于吞咽的胶囊包装，富含浓缩肉桂提取物，旨在支持能量和免疫健康。',
    moq: '500 bottles'
  },
  {
    slug: 'pure-himalayan-shilajit-resin-fulvic-50',
    name: 'Pure Himalayan Shilajit Resin Fulvic 50%',
    nameZh: '喜来芝树脂膏',
    category: 'powders',
    cover: 'https://img.mildy-health.com/products/m0_7i_767iq7i7ml9luppxt6p3mhzm.jpg',
    shortDesc: 'Wholesale 100% Pure Himalayan Shilajit Resin Fulvic 50% is a dark, natural resin collected from high-altitude Himalayan rocks.',
    shortDescZh: '批发100%纯喜马拉雅山脉喜来芝树脂（富里酸含量50%）是一种深色天然树脂，采自喜马拉雅山脉高海拔岩石。',
    moq: '500 bottles'
  },
  {
    slug: '1000mg-nad-liquid-supplement-with-pqq-cellular-energy',
    name: '1000mg NAD+ Liquid Supplement with PQQ - Cellular Energy',
    nameZh: '1000mg NAD+ 液体滴剂(含 PQQ)-细胞能量',
    category: 'liquid-drops',
    cover: 'https://img.mildy-health.com/products/m0_xo_wuxou4yvvflxv6xw7c0jcbjh.jpg',
    shortDesc: 'This is a 1000 mg NAD+ liquid with PQQ made to boost cellular energy. The liquid form is easy to take and absorbs fast, while PQQ supports mitochondrial function for better energy.',
    shortDescZh: '这是一款含有1000毫克NAD+和PQQ的液体产品，旨在提升细胞能量。液体形式服用方便，吸收迅速，PQQ则有助于支持线粒体功能。',
    moq: '500 bottles'
  },
  {
    slug: 'boosts-muscle-strength-high-potency-creatine-monohydrate-gummies',
    name: 'High-Potency Creatine Monohydrate Gummies',
    nameZh: '高含量一水肌酸软糖',
    category: 'gummies',
    cover: 'https://img.mildy-health.com/products/m43182_1781746241583-15.jpg',
    shortDesc: "High-dose creatine monohydrate gummies, fully customizable for your brand's premium sports nutrition line.",
    shortDescZh: '高剂量肌酸一水合物软糖，可完全定制，满足您品牌高端运动营养系列的需求。',
    moq: '500 bottles'
  },
  {
    slug: 'cortisol-health-gummies',
    name: 'Cortisol Health Gummies',
    nameZh: '皮质醇健康软糖',
    category: 'gummies',
    cover: 'https://img.mildy-health.com/products/m43182_1782872448286-47.jpg',
    shortDesc: 'Natural cortisol management gummies with adaptogenic herbs, supporting healthy cortisol levels, reducing stress and anxiety, improving sleep quality, and promoting overall stress resilience.',
    shortDescZh: '含有适应原草药的天然皮质醇管理软糖，有助于维持健康的皮质醇水平，减轻压力和焦虑，改善睡眠质量。',
    moq: '500 bottles'
  }
]
