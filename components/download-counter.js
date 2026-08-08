/**
 * APEXWORK Download Counter & Analytics
 * Tracks download conversions for RLFF revenue optimization
 */
class DownloadCounter {
  constructor() {
    this.statsKey = 'apexwork_download_stats';
    this._init();
  }

  _init() {
    // Track download button impressions
    document.addEventListener('DOMContentLoaded', () => {
      this._trackImpressions();
    });

    // Track actual downloads
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-secure-download]')) {
        this._trackDownload(e.target.closest('[data-secure-download]').dataset.productId);
      }
    });
  }

  /**
   * Track product card impressions
   * @private
   */
  _trackImpressions() {
    const cards = document.querySelectorAll('[data-product-card]');
    cards.forEach(card => {
      const productId = card.dataset.productId;
      this._incrementStat(productId, 'impressions');
    });
  }

  /**
   * Track successful downloads
   * @private
   */
  _trackDownload(productId) {
    if (productId) {
      this._incrementStat(productId, 'downloads');
      this._checkConversionRate(productId);
    }
  }

  /**
   * Increment statistic counter
   * @private
   */
  _incrementStat(productId, statType) {
    try {
      const stats = JSON.parse(localStorage.getItem(this.statsKey) || '{}');
      if (!stats[productId]) {
        stats[productId] = { impressions: 0, downloads: 0, purchases: 0 };
      }
      stats[productId][statType]++;
      localStorage.setItem(this.statsKey, JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to update stats:', e);
    }
  }

  /**
   * Check conversion rate for RLFF pruning
   * @private
   */
  _checkConversionRate(productId) {
    try {
      const stats = JSON.parse(localStorage.getItem(this.statsKey) || '{}');
      const productStats = stats[productId];
      if (!productStats) return;

      const conversionRate = productStats.downloads / Math.max(1, productStats.impressions);
      
      // If conversion rate < 0.5% after 7 days, flag for pruning
      if (conversionRate < 0.005 && productStats.impressions > 100) {
        this._flagForPruning(productId, conversionRate);
      }
    } catch (e) {
      console.warn('Failed to check conversion:', e);
    }
  }

  /**
   * Flag low-performing products for RLFF pruning
   * @private
   */
  _flagForPruning(productId, conversionRate) {
    const event = new CustomEvent('product:prune', {
      detail: {
        productId,
        conversionRate,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
    
    console.warn(`[RLFF] Product ${productId} flagged for pruning: ${(conversionRate * 100).toFixed(2)}% conversion`);
  }

  /**
   * Get stats for a product
   */
  getProductStats(productId) {
    try {
      const stats = JSON.parse(localStorage.getItem(this.statsKey) || '{}');
      return stats[productId] || { impressions: 0, downloads: 0, purchases: 0 };
    } catch {
      return { impressions: 0, downloads: 0, purchases: 0 };
    }
  }

  /**
   * Get all stats
   */
  getAllStats() {
    try {
      return JSON.parse(localStorage.getItem(this.statsKey) || '{}');
    } catch {
      return {};
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.APEXWORK.DownloadCounter = new DownloadCounter();
});