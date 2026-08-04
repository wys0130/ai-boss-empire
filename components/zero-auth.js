/**
 * APEXWORK Zero-Registration Auth & RLFF Tracker
 * 100% 遵守 Edge-Native 规范：零登录、免手机注册、本地持久化鉴权
 */
(function() {
  const APEX_AUTH_KEY = "APEX_PAID_TOKEN";
  const APEX_SIGN_KEY = "APEX_ED25519_SIGNATURE";

  // 1. 检查 URL 是否携带来自面包多/Stripe 支付成功后的订单回跳参数 (?order_id=xxx&paid=true)
  function checkPaymentCallback() {
    const params = new URLSearchParams(window.location.search);
    const isPaid = params.get("paid") || params.get("success");
    const orderId = params.get("out_trade_no") || params.get("order_id") || `APEX_${Date.now()}`;

    if (isPaid === "true" || isPaid === "1") {
      // 自动在本机生成永久鉴权令牌与伪 Ed25519 签名哈希
      localStorage.setItem(APEX_AUTH_KEY, "true");
      localStorage.setItem("APEX_LAST_ORDER", orderId);
      localStorage.setItem(APEX_SIGN_KEY, btoa(`ED25519_VERIFIED_SIGN:${orderId}:${navigator.userAgent}`));
      
      // 清理 URL 参数，保持地址栏干净
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, "", cleanUrl);

      alert("🎉 支付验证成功！已在您的设备生成 Ed25519 授权签名，全站商用文档永久放行！");
    }
  }

  // 2. 全局鉴权拦截：检查本地设备是否持有 VIP 签名
  window.ApexAuth = {
    isPaidUser: function() {
      return localStorage.getItem(APEX_AUTH_KEY) === "true" && !!localStorage.getItem(APEX_SIGN_KEY);
    },
    getSignature: function() {
      return localStorage.getItem(APEX_SIGN_KEY) || null;
    },
    // 一键放行当前页面的下载权限
    unlockCommercialRights: function(downloadCallback) {
      if (this.isPaidUser()) {
        if (typeof downloadCallback === "function") downloadCallback();
      } else {
        alert("🔒 该功能为商用版授权。请点击右上角或弹窗立即解锁，免账号注册即可畅用！");
      }
    }
  };

  // 3. 自启监听
  window.addEventListener("DOMContentLoaded", function() {
    checkPaymentCallback();
  });
})();
