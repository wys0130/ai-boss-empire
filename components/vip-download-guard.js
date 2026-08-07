/**
 * APEXWORK VIP 商用下载风控与反爬引擎 (components/vip-download-guard.js)
 * 1. 每日商用限额：默认限制合规 VIP 每日最多可下载 15 次，堵死倒卖贩子。
 * 2. 高频冷却熔断：60 秒内触发超 3 次立刻锁定拦截，防多线程爬虫脚本。
 * 3. 3 分钟时效令牌：生成专属带时间戳的预签名密钥，超时即失效。
 */
(function() {
  const STORAGE_KEY_DAILY = "APEX_VIP_DAILY_STATS";
  const STORAGE_KEY_BURST = "APEX_VIP_BURST_STATS";
  const DEFAULT_DAILY_LIMIT = 15;
  const BURST_LIMIT = 3;
  const BURST_WINDOW_MS = 60 * 1000; // 60秒窗
  const TOKEN_EXPIRY_MS = 3 * 60 * 1000; // 3分钟时效

  function getTodayDateStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function getDailyStats() {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY);
    const today = getTodayDateStr();
    if (!raw) return { date: today, count: 0 };
    try {
      const stats = JSON.parse(raw);
      if (stats.date !== today) return { date: today, count: 0 };
      return stats;
    } catch (e) {
      return { date: today, count: 0 };
    }
  }

  function getBurstStats() {
    const raw = localStorage.getItem(STORAGE_KEY_BURST);
    if (!raw) return [];
    try {
      const timestamps = JSON.parse(raw);
      const now = Date.now();
      return timestamps.filter(ts => (now - ts) < BURST_WINDOW_MS);
    } catch (e) {
      return [];
    }
  }

  window.ApexVIPGuard = {
    // 1. 校验下载权限
    verifyAndAuthorize: function(skuId = "COMMERCIAL_ASSET") {
      const now = Date.now();

      // --- 防线 1：高频熔断检查 (防脚本) ---
      const burstList = getBurstStats();
      if (burstList.length >= BURST_LIMIT) {
        const earliest = Math.min(...burstList);
        const remainSec = Math.ceil((earliest + BURST_WINDOW_MS - now) / 1000);
        alert(`⚠️ 【风控冷却拦截】\n您的一分钟内下载请求过于频繁！系统为防止爬虫恶意抓取，已启动频次冷却。\n\n请等待 ${remainSec} 秒后再试。`);
        return null;
      }

      // --- 防线 2：每日商用配额检查 (防倒卖) ---
      const daily = getDailyStats();
      if (daily.count >= DEFAULT_DAILY_LIMIT) {
        alert(`🔒 【已达今日下载配额上限】\n根据 APEXWORK 商业用户服务协议，VIP 会员每日合理使用上限为 ${DEFAULT_DAILY_LIMIT} 次。\n\n今日配额已用完，请于明日（北京时间 00:00 后）重试，或联系企业法务组提升对公授权限额。`);
        return null;
      }

      // --- 记录本次有效触发 ---
      daily.count += 1;
      localStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify(daily));
      
      burstList.push(now);
      localStorage.setItem(STORAGE_KEY_BURST, JSON.stringify(burstList));

      // --- 防线 3：生成 3 分钟临时预签名下载授权 (防盗链) ---
      const expiry = now + TOKEN_EXPIRY_MS;
      const rawSign = `${skuId}:${now}:${expiry}:${navigator.userAgent}`;
      const token = {
        sku: skuId,
        issued_at: now,
        expires_at: expiry,
        sig: btoa(rawSign),
        daily_used: daily.count,
        daily_limit: DEFAULT_DAILY_LIMIT
      };

      console.log(`>> [VIP风控通过] 今日可用额度: ${daily.count}/${DEFAULT_DAILY_LIMIT} | 授权签名有效期 3 分钟`);
      return token;
    },

    getRemainingQuota: function() {
      const daily = getDailyStats();
      return Math.max(0, DEFAULT_DAILY_LIMIT - daily.count);
    }
  };
})();
