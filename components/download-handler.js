/**
 * APEXWORK Download Handler
 * Handles secure download URL verification and file delivery
 */
class DownloadHandler {
  constructor() {
    this.secureManager = window.APEXWORK.SecureDownload;
    this._init();
  }

  _init() {
    // Listen for download link clicks
    document.addEventListener('click', (e) => {
      const downloadBtn = e.target.closest('[data-secure-download]');
      if (downloadBtn) {
        e.preventDefault();
        this.handleDownloadRequest(downloadBtn.dataset.secureDownload);
      }
    });

    // Handle URL token verification on page load
    this._checkUrlToken();
  }

  /**
   * Handle download request
   * @param {string} token - Secure download token
   */
  async handleDownloadRequest(token) {
    try {
      // Show loading state
      this._showLoading(true);

      // Verify token
      const linkData = await this.secureManager.verifyAndGetLink(token);
      
      if (!linkData) {
        this._showError('Download link expired or invalid. Please purchase again.');
        return;
      }

      // Trigger file download
      const response = await fetch(linkData.downloadUrl);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${linkData.productId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      // Show success message
      this._showSuccess('Download started!');
    } catch (error) {
      console.error('Download failed:', error);
      this._showError('Download failed. Please try again.');
    } finally {
      this._showLoading(false);
    }
  }

  /**
   * Check URL for token parameter
   * @private
   */
  _checkUrlToken() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      // Auto-trigger download if token present
      this.handleDownloadRequest(token);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  /**
   * Show loading state
   * @private
   */
  _showLoading(show) {
    const loader = document.getElementById('download-loader');
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Show error message
   * @private
   */
  _showError(message) {
    this._showToast(message, 'error');
  }

  /**
   * Show success message
   * @private
   */
  _showSuccess(message) {
    this._showToast(message, 'success');
  }

  /**
   * Show toast notification
   * @private
   */
  _showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 9999;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      ${type === 'error' ? 'background: linear-gradient(135deg, #ff6b6b, #ee5a24);' : 'background: linear-gradient(135deg, #00b894, #00cec9);'}
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize handler
document.addEventListener('DOMContentLoaded', () => {
  window.APEXWORK.DownloadHandler = new DownloadHandler();
});