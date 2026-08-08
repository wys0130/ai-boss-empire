/**
 * APEXWORK Payment Callback Handler
 * Generates secure download links after successful payment
 */
class PaymentCallbackHandler {
  constructor() {
    this.secureManager = window.APEXWORK.SecureDownload;
    this._init();
  }

  _init() {
    // Listen for payment success events (works with any payment provider)
    window.addEventListener('payment:success', (e) => {
      this.handlePaymentSuccess(e.detail);
    });

    // Also handle direct callback from payment iframe
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'PAYMENT_SUCCESS') {
        this.handlePaymentSuccess(e.data.payload);
      }
    });
  }

  /**
   * Handle successful payment callback
   * @param {Object} paymentData - Payment data from provider
   */
  async handlePaymentSuccess(paymentData) {
    try {
      // Validate payment data
      if (!paymentData.orderId || !paymentData.productId) {
        throw new Error('Invalid payment callback data');
      }

      // Show processing state
      this._showProcessing(true);

      // Generate secure download link
      const secureLink = await this.secureManager.generateSecureLink({
        orderId: paymentData.orderId,
        productId: paymentData.productId,
        amount: paymentData.amount || 9.99,
        currency: paymentData.currency || 'USD'
      });

      // Store in localStorage for VIP access
      this._storeVipAccess(paymentData);

      // Show success modal with download button
      this._showDownloadModal(secureLink, paymentData);

    } catch (error) {
      console.error('Payment callback failed:', error);
      this._showProcessing(false);
      this._showError('Failed to process payment. Please contact support.');
    }
  }

  /**
   * Store VIP access in localStorage
   * @private
   */
  _storeVipAccess(paymentData) {
    const vipData = {
      orderId: paymentData.orderId,
      productId: paymentData.productId,
      purchasedAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days VIP access
    };

    const existing = JSON.parse(localStorage.getItem('apexwork_vip') || '{}');
    existing[paymentData.productId] = vipData;
    localStorage.setItem('apexwork_vip', JSON.stringify(existing));
  }

  /**
   * Show download modal
   * @private
   */
  _showDownloadModal(secureLink, paymentData) {
    const modal = document.createElement('div');
    modal.id = 'download-modal';
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9998;
        backdrop-filter: blur(8px);
      ">
        <div style="
          background: white;
          border-radius: 16px;
          padding: 40px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
          <h2 style="margin: 0 0 8px; color: #2d3436; font-size: 24px;">Payment Successful!</h2>
          <p style="color: #636e72; margin: 0 0 24px; font-size: 14px;">
            Order: ${paymentData.orderId}<br>
            Amount: $${paymentData.amount || '9.99'}
          </p>
          <div style="
            background: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
          ">
            <p style="margin: 0 0 8px; color: #2d3436; font-size: 12px;">
              ⏰ Link expires in <strong>3 minutes</strong>
            </p>
            <div id="countdown" style="color: #0984e3; font-size: 20px; font-weight: bold;">03:00</div>
          </div>
          <button onclick="window.APEXWORK.DownloadHandler.handleDownloadRequest('${secureLink.token}')" style="
            background: linear-gradient(135deg, #6c5ce7, #a29bfe);
            color: white;
            border: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
            ⬇️ Download Now
          </button>
          <p style="color: #b2bec3; font-size: 12px; margin-top: 16px;">
            Secure link · Single use only
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Start countdown
    const expiryTime = secureLink.expiresAt;
    const countdownEl = modal.querySelector('#countdown');
    const timer = setInterval(() => {
      const remaining = Math.max(0, expiryTime - Date.now());
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      countdownEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      if (remaining <= 0) {
        clearInterval(timer);
        countdownEl.textContent = 'EXPIRED';
        countdownEl.style.color = '#d63031';
      }
    }, 1000);

    // Close modal on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        clearInterval(timer);
      }
    });
  }

  /**
   * Show processing state
   * @private
   */
  _showProcessing(show) {
    const existing = document.getElementById('processing-overlay');
    if (existing) existing.remove();
    
    if (show) {
      const overlay = document.createElement('div');
      overlay.id = 'processing-overlay';
      overlay.innerHTML = `
        <div style="
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9997;
        ">
          <div style="
            background: white;
            padding: 24px 40px;
            border-radius: 12px;
            text-align: center;
          ">
            <div style="
              width: 40px; height: 40px;
              border: 4px solid #f3f3f3;
              border-top: 4px solid #6c5ce7;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 16px;
            "></div>
            <p style="margin: 0; color: #2d3436; font-weight: 500;">Processing payment...</p>
          </div>
        </div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
      `;
      document.body.appendChild(overlay);
    }
  }

  /**
   * Show error message
   * @private
   */
  _showError(message) {
    const errorModal = document.createElement('div');
    errorModal.innerHTML = `
      <div style="
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9998;
      ">
        <div style="
          background: white;
          padding: 32px;
          border-radius: 12px;
          text-align: center;
          max-width: 360px;
        ">
          <div style="font-size: 40px; margin-bottom: 16px;">❌</div>
          <h3 style="margin: 0 0 8px; color: #d63031;">Payment Error</h3>
          <p style="margin: 0 0 20px; color: #636e72; font-size: 14px;">${message}</p>
          <button onclick="this.closest('div[style]').remove()" style="
            background: #d63031;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 6px;
            cursor: pointer;
          ">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(errorModal);
  }
}

// Initialize handler
document.addEventListener('DOMContentLoaded', () => {
  window.APEXWORK.PaymentCallback = new PaymentCallbackHandler();
});