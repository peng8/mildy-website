// 博客轻量模块 —— 文章类型 + 分类常量
// 与 content.config.ts 的 blog 集合 schema 对齐；页面/卡片共用，避免类型漂移。
// 文章内容由 @nuxt/content 读取（content/blog/*.md），此处不含正文数据。

/** 与 content.config.ts blog 集合 frontmatter 对应的文章类型 */
export interface BlogPost {
  /** @nuxt/content 生成的路径，如 /blog/how-to-private-label-gummies */
  path: string
  title: string
  description: string
  /** ISO 日期字符串，如 2026-08-01 */
  date: string
  category: string
  tags: string[]
  cover: string
  /** 可选中文 meta 覆盖（无则回退英文 title/description） */
  titleZh?: string
  descriptionZh?: string
}

/** 博客分类常量 —— 列表页筛选 chips 与卡片角标共用 */
export const blogCategories: { slug: string; name: string; nameZh: string }[] = [
  { slug: 'guides', name: 'Guides', nameZh: '指南' },
  { slug: 'compliance', name: 'Compliance', nameZh: '法规' },
  { slug: 'manufacturing', name: 'Manufacturing', nameZh: '制造' },
  { slug: 'ingredients', name: 'Ingredients', nameZh: '成分' },
  { slug: 'supplements', name: 'Supplements', nameZh: '补充剂' },
  { slug: 'wellness', name: 'Wellness', nameZh: '健康' }
]

/** 按 slug 查分类显示名（当前语言），未知分类回退原文 */
export function getBlogCategoryName(category: string, isZh: boolean): string {
  const found = blogCategories.find((c) => c.slug === category)
  if (!found) return category
  return isZh ? found.nameZh : found.name
}
