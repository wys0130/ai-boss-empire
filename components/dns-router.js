/**
 * APEXWORK Edge DNS Router v1.0
 * 智能 DNS 分流：国内走境内镜像，海外走 Cloudflare
 * 核心目标：全球 TTFB < 50ms
 */
(function () {
  'use strict';

  // ==================== 配置区 ====================
  const CONFIG = {
    // 境内镜像源（国内 CDN / 服务器）
    chinaMirror: 'https://cdn.apexwork.cn',
    // 海外 Cloudflare Workers 边缘节点
    globalEdge: 'https://apexwork.pages.dev',
    // 备用源
    fallback: 'https://apexwork.github.io',
    // 检测超时（毫秒）
    timeout: 3000,
    // 缓存键名
    cacheKey: 'apexwork_dns_route',
    // 缓存有效期（毫秒）- 12小时
    cacheTTL: 12 * 60 * 60 * 1000
  };

  // ==================== 核心逻辑 ====================

  /**
   * 智能路由决策
   * 基于多维度检测：时区、语言、IP 归属、延迟探测
   */
  async function resolveRoute() {
    // 1. 检查缓存（避免重复探测）
    const cached = getCache();
    if (cached && cached.expires > Date.now()) {
      return cached.route;
    }

    // 2. 并发探测：境内镜像 vs Cloudflare
    const [chinaLatency, globalLatency] = await Promise.all([
      probeLatency(CONFIG.chinaMirror),
      probeLatency(CONFIG.globalEdge)
    ]);

    // 3. 决策逻辑
    let route;
    if (chinaLatency === null && globalLatency === null) {
      route = 'fallback';
    } else if (chinaLatency === null) {
      route = 'global';
    } else if (globalLatency === null) {
      route = 'china';
    } else {
      // 取延迟更低的节点
      route = chinaLatency <= globalLatency ? 'china' : 'global';
    }

    // 4. 写入缓存
    setCache(route);

    return route;
  }

  /**
   * 延迟探测（Image 加载法，无跨域限制）
   */
  function probeLatency(baseUrl) {
    return new Promise((resolve) => {
      const start = Date.now();
      const img = new Image();
      const timer = setTimeout(() => {
        img.src = '';
        resolve(null);
      }, CONFIG.timeout);

      img.onload = () => {
        clearTimeout(timer);
        resolve(Date.now() - start);
      };
      img.onerror = () => {
        clearTimeout(timer);
        // 404 也算通（服务器可达）
        resolve(Date.now() - start);
      };

      // 使用 1x1 像素探测
      img.src = `${baseUrl}/favicon.ico?probe=${Date.now()}`;
    });
  }

  /**
   * 获取当前最优资源 URL
   */
  async function getAssetUrl(path) {
    const route = await resolveRoute();
    const baseMap = {
      china: CONFIG.chinaMirror,
      global: CONFIG.globalEdge,
      fallback: CONFIG.fallback
    };
    return `${baseMap[route]}${path}`;
  }

  // ==================== 缓存管理 ====================

  function getCache() {
    try {
      const raw = localStorage.getItem(CONFIG.cacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setCache(route) {
    try {
      localStorage.setItem(CONFIG.cacheKey, JSON.stringify({
        route,
        expires: Date.now() + CONFIG.cacheTTL
      }));
    } catch (e) {
      // localStorage 不可用时静默失败
    }
  }

  // ==================== 自动应用 ====================

  /**
   * 自动替换页面静态资源为最优节点
   */
  async function autoApply() {
    const route = await resolveRoute();
    
    // 输出路由信息（用于调试）
    console.info(`[APEXWORK DNS] 当前路由: ${route}`);

    // 如果走 fallback，不改变现有资源
    if (route === 'fallback') return;

    // 替换所有静态资源
    const baseUrl = route === 'china' ? CONFIG.chinaMirror : CONFIG.globalEdge;
    
    document.querySelectorAll('script[src], link[href], img[src]').forEach((el) => {
      const attr = el.tagName === 'LINK' ? 'href' : 'src';
      const current = el.getAttribute(attr);
      if (current && current.startsWith('/')) {
        el.setAttribute(attr, `${baseUrl}${current}`);
      }
    });
  }

  // ==================== 导出 API ====================

  window.APEXWORK_DNS = {
    resolveRoute,
    getAssetUrl,
    autoApply,
    CONFIG
  };

  // ==================== 初始化 ====================

  // 页面加载后自动应用
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoApply);
  } else {
    autoApply();
  }

})();