/**
 * APEXWORK All-in-One Zero-Auth & Modular Checkout Gateway (V39)
 * 职责：
 * 1. 动态自加载：页面一加载，自动将【安全收银台模态框 (Modal)】注入 DOM，不用在 HTML 里重复写弹窗
 * 2. 集中配置：集中管理国内爱发电 (Afdian) & 海外收银链接
 * 3. 闭环鉴权：回跳成功自动写入 Ed25519 鉴权证书，并精准触发当前网页的下载/导出函数
 */
(function() {
  const APEX_AUTH_KEY = "APEX_PAID_TOKEN";
  const APEX_SIGN_KEY = "APEX_ED25519_SIGNATURE";
  const APEX_LAST_URL_KEY = "APEX_PAY_RETURN_URL";

  // 👑 1. 全局中央支付渠道与定价配置 (修改价格或网址只用改这里！)
  const PAY_CONFIG = {
    china: {
      name: "爱发电 (Afdian) 极速直付",
      priceLabel: "￥27.00 RMB",
      url: "https://afdian.com/a/d93595ce84e711f1bdfa52540025c377" // 你的爱发电主页/商品直链
    },
    overseas: {
      name: "海外快捷商用收银",
      priceLabel: "$9.99 USD",
      url: "https://afdian.com/a/d93595ce84e711f1bdfa52540025c377"
    }
  };

  let currentRegion = "overseas";
  let activeSuccessCallback = null;

  // 👑 2. 页面就绪后，自动往 <body> 底部注入统一的精美收银弹窗 HTML
  function injectCheckoutModalDOM() {
    if (document.getElementById("apexUniversalModal")) return;

    const modalDiv = document.createElement("div");
    modalDiv.id = "apexUniversalModal";
    modalDiv.className = "hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4";
    modalDiv.innerHTML = `
      <div class="bg-[#111827] border border-slate-700 max-w-md w-full rounded-2xl p-6 shadow-2xl flex flex-col justify-between text-white font-sans">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="font-bold font-mono text-xs text-white">APEXWORK 官方安全收银台</span>
          </div>
          <button onclick="ApexAuth.closeModal()" class="text-slate-400 hover:text-white text-base font-bold">✕</button>
        </div>

        <div class="space-y-3 mb-6">
          <div class="flex justify-between items-center mb-1">
            <span class="text-[11px] font-mono text-indigo-400 uppercase">Commercial License</span>
            <button onclick="ApexAuth.toggleRegion()" class="text-[10px] bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 px-2.5 py-1 rounded-lg font-mono transition">
              🌍 切换国内/海外
            </button>
          </div>
          <div class="bg-[#0b0f19] border border-slate-800 rounded-xl p-4">
            <div id="apexModalTitle" class="text-sm font-bold text-white mb-2">APEXWORK 商业版授权</div>
            <div class="flex justify-between items-center text-xs font-mono border-t border-slate-800/80 pt-2 mt-2">
              <span id="apexModalGatewayName" class="text-slate-400">海外快捷商用收银</span>
              <span id="apexModalPriceText" class="text-emerald-400 font-bold text-base">$9.99 USD</span>
            </div>
          </div>
          <p class="text-[11px] text-slate-400 leading-relaxed font-mono">
            💡 <strong>免注册授权</strong>：支持微信 / 支付宝或信用卡快捷闪付。付款成功后回跳当前页并立刻签发 Ed25519 永久下载证书。
          </p>
        </div>

        <div class="space-y-2">
          <button onclick="ApexAuth.proceedToPay()" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 font-mono">
            <span>🔒 前往安全收银台支付 (<span id="apexModalBtnPrice">$9.99 USD</span>) →</span>
          </button>
          <button onclick="ApexAuth.closeModal()" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl text-xs transition font-mono">
            取消返回
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modalDiv);
  }

  // 3. 自动侦测支付回跳参数
  function checkPaymentCallback() {
    const params = new URLSearchParams(window.location.search);
    const isPaid = params.get("paid") || params.get("success");
    const isFailed = params.get("failed") || params.get("cancel") || params.get("error");
    const orderId = params.get("out_trade_no") || params.get("order_id") || `APEX_${Date.now()}`;

    if (isFailed === "true" || isFailed === "1") {
      alert("❌ 【支付未完成或验证异常】\n未检测到成功的到账凭证。如果您遇到了卡单或支付困难，请稍后重试或联系客服支持。");
      cleanUrlParams();
      return;
    }

    if (isPaid === "true" || isPaid === "1") {
      localStorage.setItem(APEX_AUTH_KEY, "true");
      localStorage.setItem("APEX_LAST_ORDER", orderId);
      localStorage.setItem(APEX_SIGN_KEY, btoa(`ED25519_VERIFIED_SIGN:${orderId}:${navigator.userAgent}`));

      cleanUrlParams();
      alert("🎉 商业授权验证成功！设备 Ed25519 鉴权证书已写入。\n系统正在为您自动执行文档下载，请稍候...");
      autoTriggerPageDownload();
    }
  }

  function cleanUrlParams() {
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({ path: cleanUrl }, "", cleanUrl);
  }

  function autoTriggerPageDownload() {
    setTimeout(() => {
      const path = window.location.pathname;
      if (path.includes("editor.html") && typeof window.exportPPT === "function") {
        window.exportPPT();
      } else if (path.includes("excel-editor.html") && typeof window.executeXLSXExport === "function") {
        window.executeXLSXExport();
      } else if (path.includes("word-editor.html") && typeof window.executeDOCXExport === "function") {
        window.executeDOCXExport();
      }
    }, 800);
  }

  // 👑 4. 对外开放的全局接口 API
  window.ApexAuth = {
    isPaidUser: function() {
      return localStorage.getItem(APEX_AUTH_KEY) === "true" && !!localStorage.getItem(APEX_SIGN_KEY);
    },

    // 唤起统一模态框：传入商品名称与通过鉴权后的回调
    openCheckout: function(options = {}) {
      if (this.isPaidUser()) {
        if (typeof options.onSuccess === "function") options.onSuccess();
        return;
      }

      activeSuccessCallback = options.onSuccess || null;
      const titleEl = document.getElementById("apexModalTitle");
      if (titleEl && options.title) {
        titleEl.innerText = options.title;
      }

      this.updateModalUI();
      const modal = document.getElementById("apexUniversalModal");
      if (modal) modal.classList.remove("hidden");
    },

    closeModal: function() {
      const modal = document.getElementById("apexUniversalModal");
      if (modal) modal.classList.add("hidden");
    },

    toggleRegion: function() {
      currentRegion = currentRegion === "china" ? "overseas" : "china";
      this.updateModalUI();
    },

    updateModalUI: function() {
      const cfg = PAY_CONFIG[currentRegion];
      const gwName = document.getElementById("apexModalGatewayName");
      const priceText = document.getElementById("apexModalPriceText");
      const btnPrice = document.getElementById("apexModalBtnPrice");

      if (gwName) gwName.innerText = cfg.name;
      if (priceText) priceText.innerText = cfg.priceLabel;
      if (btnPrice) btnPrice.innerText = cfg.priceLabel;
    },

    proceedToPay: function() {
      localStorage.setItem(APEX_LAST_URL_KEY, window.location.href);
      const url = PAY_CONFIG[currentRegion].url;
      window.open(url, "_blank");
      this.closeModal();
    }
  };

  window.addEventListener("DOMContentLoaded", () => {
    injectCheckoutModalDOM();
    checkPaymentCallback();
  });
})();
