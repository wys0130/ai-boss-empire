// /components/lang-and-policy.js - 纯净单币种 & IP 权威优先国际化引擎

// 👑 1. 国际化与语言控制引擎
window.ApexLang = {
  current: localStorage.getItem('APEX_LANG') || 'zh',
  
  toggle: function() {
    this.current = (this.current === 'zh') ? 'en' : 'zh';
    localStorage.setItem('APEX_LANG', this.current);
    localStorage.setItem('APEX_LANG_MANUAL', 'true'); // 记录用户手动点击，不再被 IP 强覆盖
    this.apply();
    if (window.ApexPricing) window.ApexPricing.applyPricing();
  },

  apply: function() {
    document.querySelectorAll('[data-zh][data-en]').forEach(el => {
      const text = el.getAttribute(`data-${this.current}`);
      if (text) el.innerHTML = text;
    });
    const btn = document.getElementById('langToggleBtn');
    if (btn) btn.innerText = (this.current === 'zh') ? '🌐 简 / EN' : '🌐 EN / 简';
  }
};

// 👑 2. 纯净单币种定价引擎（绝对唯一价格，杜绝双币种并排）
window.ApexPricing = {
  convertRMBtoUSD: function(rmb) {
    const rawUsd = Number(rmb) / 7.0;
    return (Math.floor(rawUsd) + 0.99).toFixed(2);
  },

  applyPricing: function() {
    const isEn = (window.ApexLang.current === 'en');

    document.querySelectorAll('[data-price-rmb]').forEach(el => {
      const rmb = parseFloat(el.getAttribute('data-price-rmb')) || 69;
      const usd = this.convertRMBtoUSD(rmb);
      
      if (isEn) {
        // 英文 / 法国 / 海外 IP 视图：仅干净展示 USD
        el.innerHTML = `<span class="text-blue-600 font-black">$${usd} USD</span>`;
      } else {
        // 中文 / 国内 IP 视图：仅干净展示 RMB
        el.innerHTML = `<span class="text-slate-900 font-black">￥${rmb} RMB</span>`;
      }
    });
  }
};

// 👑 3. 欧美合规弹窗控制
window.ApexCompliance = {
  showPolicy: function(type) {
    const modal = document.getElementById('auditPolicyModal');
    const title = document.getElementById('auditModalTitle');
    const text = document.getElementById('auditModalText');
    const isEn = (window.ApexLang.current === 'en');
    if (!modal || !title || !text) return;

    if (type === 'terms') {
      title.textContent = isEn ? 'Terms of Service' : '服务条款 (Terms of Service)';
      text.textContent = isEn 
        ? '1. License: Purchasing an APEXWORK enterprise package grants a permanent non-exclusive Commercial License.\n2. Restrictions: Redistributing or reselling raw template source files is strictly prohibited.\n3. Delivery: Files are delivered instantly via secure signed URLs.'
        : '1. 商业授权：用户在 APEXWORK 支付成功后，获得相关模板的永久非独占商用授权。\n2. 禁止转卖：严禁在公开市场将原始模板源文件二次转售或打包贩卖。\n3. 交付承诺：支付成功后，系统由安全链接于 3 分钟内签发原件下载。';
    } else if (type === 'privacy') {
      title.textContent = isEn ? 'Privacy Policy' : '隐私政策 (Privacy Policy)';
      text.textContent = isEn 
        ? '1. Local Running: APEXWORK editors run locally in your browser and do not upload sensitive enterprise data.\n2. Security: Payments are processed via regulated gateways.\n3. Compliance: Fully compliant with GDPR and CCPA standards.'
        : '1. 数据安全：在线编辑台全年在您本地浏览器运行，绝不私密上传企业文档到云端。\n2. 支付加密：交易信息由已备案与授权的清算网关处理，平台不存储银行账号。\n3. 合规：遵守欧洲 GDPR 与北美 CCPA 规范。';
    } else if (type === 'refund') {
      title.textContent = isEn ? 'Refund Policy (Digital Goods)' : '退款政策 (Refund Policy - Digital Goods)';
      text.textContent = isEn 
        ? '1. Digital Goods Nature: As APEXWORK products are downloadable source files (.pptx/.xlsx/.docx), sales are considered consumed once downloaded.\n2. Policy: We do not offer no-reason refunds for downloaded files unless file corruption occurs.\n3. Support: Email 1105630829@qq.com for any delivery or file integrity issues within 24 hours.'
        : '1. 虚拟产品说明：APEXWORK 所售均为可直接签发下载的数字资产 (.pptx/.xlsx/.docx)，下载授权生效即视为消费结案。\n2. 政策：除非出现致命性文件结构损坏且无法修验，已下载生效的产品不支持主观原因的无理由退换。\n3. 售后保障：如遇下载失败或文件错误，请发邮件至 1105630829@qq.com，客服承诺 24 小时内解决。';
    }
    modal.style.display = 'flex';
  },
  
  closePolicy: function() {
    const modal = document.getElementById('auditPolicyModal');
    if (modal) modal.style.display = 'none';
  }
};

// 👑 4. 真实 IP 权威优先探测 (法国 / 海外直接强锁英文与美元)
window.ApexGeo = {
  init: async function() {
    // 步骤 A：不管任何情况，进来第 0 毫秒强行渲染单币种，消灭“双价格并排”残影
    window.ApexLang.apply();
    window.ApexPricing.applyPricing();

    // 步骤 B：如果用户没手动点过右上角按钮，以 Cloudflare 真实 IP 所在国家为绝对权威！
    if (!localStorage.getItem('APEX_LANG_MANUAL')) {
      try {
        const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { cache: 'no-store' });
        const text = await res.text();
        const match = text.match(/loc=([A-Z]+)/);
        if (match && match[1]) {
          const country = match[1]; // 法国为 FR, 中国为 CN, 美国为 US
          const targetLang = (country === 'CN') ? 'zh' : 'en';
          
          if (window.ApexLang.current !== targetLang) {
            window.ApexLang.current = targetLang;
            localStorage.setItem('APEX_LANG', targetLang);
            window.ApexLang.apply();
            window.ApexPricing.applyPricing();
          }
        }
      } catch (e) {
        // 静默处理：遇到极端网络屏蔽 Trace 时维持初始单币种
      }
    }
  }
};

// 立即绑定执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.ApexGeo.init());
} else {
  window.ApexGeo.init();
}
