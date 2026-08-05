/**
 * 中国大陆访客检测与爱发电支付路由 v1.0
 * 基于天网宪法 V5.0 - 零备案过渡方案
 */
(function() {
  'use strict';

  // 爱发电主页链接（需替换为实际链接）
  const AFDIAN_URL = 'https://afdian.com/a/apexwork';
  
  // 检测中国大陆 IP
  async function detectMainlandChina() {
    try {
      // 使用 Cloudflare Trace 检测（免费、快速、无备案）
      const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
      const text = await response.text();
      const lines = text.split('\n');
      const data = {};
      lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key) data[key] = value;
      });
      
      // 检查地区码
      const loc = data.loc || '';
      const isChina = ['CN', 'HK', 'MO', 'TW'].includes(loc.toUpperCase());
      
      // 额外检查 IP 段（备用方案）
      if (!isChina) {
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        return ipData.country_code === 'CN';
      }
      
      return isChina;
    } catch (error) {
      console.warn('IP 检测失败，使用默认国际版');
      return false;
    }
  }

  // 替换购买按钮为爱发电链接
  function replacePurchaseButtons() {
    const buttons = document.querySelectorAll('[data-purchase], .purchase-btn, .buy-btn');
    buttons.forEach(btn => {
      // 保存原始 onclick
      const originalOnClick = btn.onclick;
      
      // 替换为爱发电跳转
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(AFDIAN_URL, '_blank', 'noopener');
      };
      
      // 视觉标记
      btn.classList.add('cn-afdian-btn');
      btn.setAttribute('data-cn-payment', 'afdian');
      
      // 更新按钮文案
      if (btn.textContent.includes('$')) {
        btn.innerHTML = '⚡ ¥69 爱发电获取';
      }
    });
  }

  // 显示爱发电支付弹窗
  function showAfdianModal() {
    // 加载弹窗组件
    fetch('/components/cn-payment-gateway.html')
      .then(response => response.text())
      .then(html => {
        // 插入弹窗
        const div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div);
        
        // 绑定按钮事件
        const payBtn = document.getElementById('cn-pay-btn');
        if (payBtn) {
          payBtn.addEventListener('click', () => {
            window.open(AFDIAN_URL, '_blank');
            // 可选：关闭弹窗
            const gateway = document.getElementById('cn-payment-gateway');
            if (gateway) gateway.style.display = 'none';
          });
        }
        
        // 点击遮罩关闭
        const overlay = document.querySelector('.cn-pay-overlay');
        if (overlay) {
          overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
              const gateway = document.getElementById('cn-payment-gateway');
              if (gateway) gateway.style.display = 'none';
            }
          });
        }
      });
  }

  // 初始化
  async function init() {
    const isMainlandChina = await detectMainlandChina();
    
    if (isMainlandChina) {
      // 标记为国内用户
      document.body.classList.add('cn-user');
      
      // 替换所有购买按钮
      replacePurchaseButtons();
      
      // 在页面加载后显示弹窗（延迟 2 秒）
      setTimeout(() => {
        showAfdianModal();
      }, 2000);
      
      // 存储状态
      localStorage.setItem('cn_user', 'true');
    } else {
      localStorage.setItem('cn_user', 'false');
    }
  }

  // 页面加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

### 3. 配置清单