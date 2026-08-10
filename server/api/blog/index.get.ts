// GET /api/blog — 全部博客文章（列表页 + 详情页「相关文章」共用）
// 服务端专用：queryCollection 在此走 Nitro 服务端 DB，客户端不加载 sqlite-wasm。
// 响应带 SSG 预渲染缓存；GitHub Pages 上该文件为纯静态 JSON（与产品列表 API 同模式）。
import type { BlogPost } from '~/data/blog'

// 只返回前端渲染所需的轻量字段（titleZh/descriptionZh 为可选，@nuxt/content 会给缺省字段
// 填 undefined，客户端 computed 用 ?? 回退，类型保持一致）
export default defineEventHandler(async (event) => {
  const posts = await queryCollection(event, 'blog')
    .order('date', 'DESC')
    .all()

  const cards: BlogPost[] = posts.map((post) => ({
    path: post.path,
    title: post.title,
    description: post.description,
    date: post.date,
    category: post.category,
    tags: post.tags,
    cover: post.cover,
    titleZh: post.titleZh,
    descriptionZh: post.descriptionZh
  }))

  return cards
})
