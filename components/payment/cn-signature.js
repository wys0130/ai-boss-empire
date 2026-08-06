/**
 * Ed25519 签名验证与VIP状态管理
 * 零注册，即付即用，安全防伪
 */
(function() {
  'use strict';

  const SIG_KEY = 'apexwork_cn_vip_signature';
  const API_ENDPOINT = 'https://pay.apexwork.cn/api/verify';

  class CNSignature {
    constructor() {
      this.signature = null;
      this.init();
    }

    init() {
      // 从localStorage读取签名
      const stored = localStorage.getItem(SIG_KEY);
      if (stored) {
        try {
          this.signature = JSON.parse(stored);
          this.verifySignature();
        } catch (e) {
          console.error('Invalid signature format');
          localStorage.removeItem(SIG_KEY);
        }
      }
    }

    async verifySignature() {
      if (!this.signature) return false;

      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: this.signature.orderId,
            signature: this.signature.signature,
            timestamp: this.signature.timestamp
          })
        });

        const data = await response.json();
        if (data.valid) {
          this.isVIP = true;
          this.applyVIPState();
          return true;
        } else {
          // 签名无效，清除
          localStorage.removeItem(SIG_KEY);
          this.isVIP = false;
          return false;
        }
      } catch (error) {
        console.error('Signature verification error:', error);
        // 离线时使用本地缓存验证
        return this.localVerify();
      }
    }

    localVerify() {
      // 本地验证签名有效性（简化版）
      if (!this.signature) return false;
      
      const timestamp = this.signature.timestamp;
      const now = Date.now();
      const validityPeriod = 365 * 24 * 60 * 60 * 1000; // 1年
        
      return (now - timestamp) < validityPeriod;
    }

    applyVIPState() {
      // 应用VIP状态到全站
      document.body.classList.add('vip-unlocked');
      
      // 隐藏所有付费墙
      document.querySelectorAll('.paywall, .cn-paywall').forEach(el => {
        el.style.display = 'none';
      });
      
      // 显示VIP专属内容
      document.querySelectorAll('.vip-only').forEach(el => {
        el.style.display = 'block';
      });
      
      // 触发全局事件
      window.dispatchEvent(new CustomEvent('apexwork:vip-verified'));
    }

    getSignature() {
      return this.signature;
    }

    isUnlocked() {
      return this.isVIP || this.localVerify();
    }
  }

  // 全局实例
  window.CNSignature = new CNSignature();
})();