// GET /api/blog/:slug — 博客文章详情
// 服务端专用：queryCollection 在此走 Nitro 服务端 DB（sqlite 由服务器进程持有），
// 客户端不打包/不下载 sqlite-wasm 运行时（详见 blog 页注释）。
// 响应带 SSG 预渲染缓存；GitHub Pages 上该文件为纯静态 JSON（与产品列表 API 同模式）。
import type { BlogPost } from '~/data/blog'

// 前端 BlogPost 缺 body；@nuxt/content 的文档对象自带 body（ProseMirror JSON，ContentRenderer 消费）。
// 这里显式列出返回结构，避免把服务端扩展字段（如 _id/body 之外的索引字段）泄漏给客户端。
interface BlogArticleResponse extends BlogPost {
  body: unknown
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  // 按 path 精确匹配：content/blog/*.md 的 path 为 /blog/<slug>（不带 locale 前缀，中英共用同一正文）
  const article = await queryCollection(event, 'blog')
    .where('path', '=', `/blog/${slug}`)
    .first()

  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  return article as unknown as BlogArticleResponse
})
