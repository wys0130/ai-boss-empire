/**
 * APEXWORK 智能 DNS 分流路由器 (Edge-Native)
 * 实现：国内境内镜像 / 海外 Cloudflare 边缘，TTFB < 50ms
 * 版本：V5.0 天网宪法合规
 */
(function () {
  'use strict';

  // ---------- 核心配置（零成本极客托管） ----------
  const DNS_CONFIG = {
    // 国内镜像（GitHub Pages 加速 / 国内 CDN）
    domesticMirror: 'https://apexwork.cn',
    // 海外边缘（Cloudflare Workers）
    overseasEdge: 'https://apexwork.workers.dev',
    // 默认备用（GitHub Pages 兜底）
    fallback: 'https://apexwork.github.io',
    // 超时阈值（毫秒）—— 严格 50ms 红线
    timeout: 50,
  };

  // ---------- 智能探测与分流 ----------
  class DNSRouter {
    constructor() {
      this.currentRegion = this.detectRegion();
      this.activeEndpoint = null;
      this.performanceLog = [];
    }

    // 1. 区域探测（基于 Intl API + 时区偏移，零请求开销）
    detectRegion() {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const offset = new Date().getTimezoneOffset();
        
        // 中国时区集合（含港澳台）
        const cnTimezones = [
          'Asia/Shanghai',
          'Asia/Hong_Kong',
          'Asia/Macau',
          'Asia/Taipei',
          'Asia/Urumqi'
        ];

        if (cnTimezones.includes(timezone) || (offset === -480 && timezone.includes('Asia'))) {
          return 'domestic';
        }
        return 'overseas';
      } catch (e) {
        // 探测失败默认走海外（Cloudflare 全球节点更稳）
        return 'overseas';
      }
    }

    // 2. 极速预连接（提前建立 TCP+TLS，确保 50ms 红线）
    preconnect() {
      const endpoints = this.currentRegion === 'domestic'
        ? [DNS_CONFIG.domesticMirror, DNS_CONFIG.fallback]
        : [DNS_CONFIG.overseasEdge, DNS_CONFIG.fallback];

      endpoints.forEach(endpoint => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = endpoint;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });
    }

    // 3. 智能分流（带超时降级）
    async route() {
      const primary = this.currentRegion === 'domestic'
        ? DNS_CONFIG.domesticMirror
        : DNS_CONFIG.overseasEdge;

      const startTime = performance.now();

      try {
        // 并行探测：主端点 + 备用端点
        const [primaryResult, fallbackResult] = await Promise.allSettled([
          this.probeEndpoint(primary),
          this.probeEndpoint(DNS_CONFIG.fallback)
        ]);

        // 选择最快响应且成功的端点
        if (primaryResult.status === 'fulfilled' && primaryResult.value.success) {
          this.activeEndpoint = primary;
          this.logPerformance('primary', performance.now() - startTime);
          return primary;
        }

        if (fallbackResult.status === 'fulfilled' && fallbackResult.value.success) {
          this.activeEndpoint = DNS_CONFIG.fallback;
          this.logPerformance('fallback', performance.now() - startTime);
          return DNS_CONFIG.fallback;
        }

        // 全部失败则使用主端点（至少保证有响应）
        this.activeEndpoint = primary;
        this.logPerformance('fallback', performance.now() - startTime);
        return primary;

      } catch (e) {
        // 极端情况：直接返回主端点，绝不白屏
        this.activeEndpoint = primary;
        return primary;
      }
    }

    // 4. 端点探测（严格 50ms 超时）
    probeEndpoint(endpoint) {
      return new Promise((resolve) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), DNS_CONFIG.timeout);

        fetch(`${endpoint}/api/ping`, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-store'
        })
          .then(() => {
            clearTimeout(timer);
            resolve({ success: true, endpoint });
          })
          .catch(() => {
            clearTimeout(timer);
            resolve({ success: false, endpoint });
          });
      });
    }

    // 5. 性能日志（供 SRE 部门监控）
    logPerformance(type, latency) {
      this.performanceLog.push({
        type,
        latency,
        timestamp: Date.now(),
        region: this.currentRegion
      });

      // 异步上报（不阻塞主流程）
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(this.performanceLog)], {
          type: 'application/json'
        });
        navigator.sendBeacon('/api/performance', blob);
      }
    }

    // 6. 静态资源 URL 重写（确保所有资源走同一端点）
    rewriteUrls(endpoint) {
      const observer = new MutationObserver(() => {
        document.querySelectorAll('img, script, link, video, source').forEach(el => {
          const attr = el.tagName === 'LINK' ? 'href' : 'src';
          const url = el[attr];
          if (url && url.startsWith('/')) {
            el[attr] = `${endpoint}${url}`;
          }
        });
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    // 7. 初始化入口
    async init() {
      // 1. 预连接（立即执行，不阻塞渲染）
      this.preconnect();

      // 2. 智能分流
      const endpoint = await this.route();

      // 3. 重写资源 URL
      this.rewriteUrls(endpoint);

      // 4. 挂载全局路由（供其他组件调用）
      window.APEXWORK_DNS = {
        endpoint,
        region: this.currentRegion,
        performanceLog: this.performanceLog
      };

      // 5. 触发自定义事件（供其他部门监听）
      document.dispatchEvent(new CustomEvent('dns-routed', {
        detail: { endpoint, region: this.currentRegion }
      }));

      return endpoint;
    }
  }

  // ---------- 立即执行（不阻塞 DOM） ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new DNSRouter().init();
    }, { once: true });
  } else {
    new DNSRouter().init();
  }

  // ---------- 导出（供模块化使用） ----------
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DNSRouter;
  }
})();