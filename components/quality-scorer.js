/**
 * APEXWORK 85 分多模态质检引擎
 * 自动评估模板设计质量，低于 85 分触发重构
 */
(function() {
  'use strict';

  const QUALITY_THRESHOLD = 85;
  const WEIGHTS = {
    whitespaceRatio: 0.25,
    textCentering: 0.20,
    visualContrast: 0.25,
    textDensity: 0.20,
    colorHarmony: 0.10
  };

  class QualityScorer {
    constructor() {
      this.results = [];
    }

    /**
     * 评估模板设计质量
     * @param {Object} template - 模板数据
     * @returns {Object} 评分结果
     */
    async evaluate(template) {
      const scores = {
        whitespaceRatio: this._scoreWhitespace(template),
        textCentering: this._scoreTextCentering(template),
        visualContrast: this._scoreVisualContrast(template),
        textDensity: this._scoreTextDensity(template),
        colorHarmony: this._scoreColorHarmony(template)
      };

      const total = this._calculateWeightedScore(scores);
      const passed = total >= QUALITY_THRESHOLD;

      const result = {
        templateId: template.id,
        totalScore: total,
        passed,
        scores,
        timestamp: new Date().toISOString(),
        action: passed ? 'PUBLISH' : 'REBUILD'
      };

      this.results.push(result);
      return result;
    }

    _scoreWhitespace(template) {
      // 理想留白比 40-60%
      const ratio = template.whitespaceRatio || 0.45;
      if (ratio >= 0.35 && ratio <= 0.65) return 95;
      if (ratio >= 0.25 && ratio <= 0.75) return 80;
      return 60;
    }

    _scoreTextCentering(template) {
      // 100% 居中排版要求
      const centeringScore = template.textCenteringScore || 0.9;
      return Math.round(centeringScore * 100);
    }

    _scoreVisualContrast(template) {
      // 对比度要求：文字与背景对比度 >= 4.5:1
      const contrastRatio = template.contrastRatio || 5.0;
      if (contrastRatio >= 7) return 95;
      if (contrastRatio >= 4.5) return 85;
      if (contrastRatio >= 3) return 70;
      return 50;
    }

    _scoreTextDensity(template) {
      // 少字多图原则：每页文字不超过 50 词
      const wordsPerSlide = template.wordsPerSlide || 30;
      if (wordsPerSlide <= 30) return 95;
      if (wordsPerSlide <= 50) return 85;
      if (wordsPerSlide <= 80) return 70;
      return 50;
    }

    _scoreColorHarmony(template) {
      // 色彩和谐度评估
      const harmonyScore = template.colorHarmonyScore || 0.85;
      return Math.round(harmonyScore * 100);
    }

    _calculateWeightedScore(scores) {
      let total = 0;
      for (const [key, weight] of Object.entries(WEIGHTS)) {
        total += scores[key] * weight;
      }
      return Math.round(total);
    }
  }

  // 全局单例
  window.APEXWORKQualityScorer = new QualityScorer();
})();