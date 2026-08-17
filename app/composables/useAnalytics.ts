// 统一的 GA4 事件上报入口。
// gtag 脚本由 app.vue 在 onMounted 懒加载并挂到 window（见 app.vue 的 loadAnalytics），
// 这里只负责「有 gtag 就上报、没有就静默跳过」，不负责加载脚本本身。
type GtagWindow = Window & { gtag?: (...args: unknown[]) => void }

export const trackEvent = (event: string, params: Record<string, unknown> = {}) => {
  if (!import.meta.client) return
  const w = window as GtagWindow
  w.gtag?.('event', event, {
    // 统一带上当前页面路径，便于在 GA4 里按页面拆分「哪个页面触发的行为」
    page_path: window.location.pathname,
    ...params
  })
}
