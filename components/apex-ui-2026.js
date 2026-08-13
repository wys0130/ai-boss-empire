/**
 * APEXWORK 2026 全局流体与光感视觉引擎 (apex-ui-2026.js)
 * 👑 纯净尊享版：去除光污染与廉价毛玻璃，对标 Stripe / Linear 顶级极简商业美学
 */

(function () {
    // 1. 注入顶级极简商业 CSS 装甲
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
            --ease-in-out-quint: cubic-bezier(0.83, 0, 0.17, 1);
        }

        /* 1. 顶栏：保留极致克制的极薄毛玻璃，去除生硬边框，改用极微弱阴影 */
        header {
            background-color: rgba(255, 255, 255, 0.85) !important;
            backdrop-filter: blur(12px) saturate(180%) !important;
            -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.04) !important;
            transition: background-color 0.3s ease !important;
        }
        [data-theme="dark"] header, 
        body.bg-slate-950 header, 
        body.bg-slate-900 header {
            background-color: rgba(11, 17, 32, 0.75) !important; /* 深度贴合暗黑底色 */
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.4) !important;
        }

        /* 2. 卡片质感：绝对的实体纯净，抛弃廉价半透明，引入“极细物理边框” */
        .bento-card, .saas-card, .kpi-card {
            background-color: #ffffff !important;
            /* 采用多层柔和阴影，模拟真实物理光源 */
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02), 
                        0 4px 12px rgba(0, 0, 0, 0.02), 
                        0 12px 24px rgba(0, 0, 0, 0.02) !important;
            border: 1px solid rgba(0, 0, 0, 0.06) !important;
            border-radius: 16px !important; /* 更柔和的高级圆角 */
            transition: transform 0.3s var(--ease-out-expo), box-shadow 0.3s var(--ease-out-expo), border-color 0.3s ease !important;
            will-change: transform, box-shadow;
        }
        [data-theme="dark"] .bento-card, body.bg-slate-950 .bento-card, body.bg-slate-900 .bento-card,
        [data-theme="dark"] .saas-card, [data-theme="dark"] .kpi-card {
            background-color: #111827 !important; /* 纯净的深灰，不要透明 */
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            /* 暗黑模式下用极细的白色内发光模拟边缘高光 */
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 
                        0 10px 30px -10px rgba(0,0,0,0.5) !important;
        }

        /* 3. 卡片悬浮：干脆利落的 Z 轴抬升，绝不抖动 */
        .bento-card:hover, .saas-card:hover {
            transform: translateY(-2px) !important; /* 非常克制的位移 */
            border-color: rgba(99, 102, 241, 0.3) !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 
                        0 12px 24px rgba(0, 0, 0, 0.04), 
                        0 24px 48px rgba(99, 102, 241, 0.06) !important;
        }
        [data-theme="dark"] .bento-card:hover, [data-theme="dark"] .saas-card:hover {
            border-color: rgba(99, 102, 241, 0.5) !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 
                        0 12px 40px -10px rgba(0,0,0,0.8),
                        0 0 20px -5px rgba(99, 102, 241, 0.15) !important;
        }

        /* 4. 输入框/按钮：去油腻，恢复专业严谨 */
        input, select, textarea, [contenteditable="true"] {
            transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
            border-radius: 8px !important;
        }
        input:focus, textarea:focus, [contenteditable="true"]:focus {
            /* 抛弃巨大的光晕，改用克制的高对比度聚焦环 */
            box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #6366f1 !important;
            border-color: #6366f1 !important;
            outline: none !important;
        }
        [data-theme="dark"] input:focus, [data-theme="dark"] [contenteditable="true"]:focus {
            box-shadow: 0 0 0 2px #0b1120, 0 0 0 4px #6366f1 !important;
        }

        button {
            transition: transform 0.15s ease, opacity 0.2s ease !important;
        }
        button:active {
            transform: scale(0.97) !important; /* 快速按压反馈 */
        }

        /* 5. Lenis 基础滚动 */
        html.lenis, html.lenis body { height: auto; width: 100vw; }
        .lenis.lenis-smooth { scroll-behavior: auto !important; }
        .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
    `;
    document.head.appendChild(style);

    // 2. 加载核心动画引擎
    const loadScript = (src) => new Promise(resolve => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src; s.onload = resolve; document.head.appendChild(s);
    });

    async function initModernUI() {
        await Promise.all([
            loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"),
            loadScript("https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.29/bundled/lenis.min.js")
        ]);
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js");

        gsap.registerPlugin(ScrollTrigger);

        // A. 极其平顺但有力量感的滚动阻尼
        const lenis = new Lenis({
            duration: 1.0, // 稍微调快，不拖泥带水
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
            direction: 'vertical',
            smooth: true,
            smoothTouch: false,
        });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => { lenis.raf(time * 1000) });
        gsap.ticker.lagSmoothing(0);

        // B. 高级入场动效：摈弃弹簧效果，采用极速且平滑的淡入上浮
        const animateElements = document.querySelectorAll('.bento-card, .saas-card, section, .kpi-card');
        
        animateElements.forEach((el, i) => {
            if (el.classList.contains('gsap-bound')) return;
            el.classList.add('gsap-bound');

            gsap.fromTo(el, 
                { y: 15, opacity: 0 }, // 位移距离缩短，动作更干脆
                {
                    y: 0, opacity: 1, 
                    duration: 0.6,
                    ease: "power2.out", // 顶级的指数级减速，稳重、高级
                    scrollTrigger: {
                        trigger: el,
                        start: "top 95%", 
                        toggleActions: "play none none reverse", 
                    },
                    delay: i % 10 * 0.03 // 间隔时间变短，瀑布流更流畅
                }
            );
        });
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(initModernUI, 50);
    } else {
        window.addEventListener('DOMContentLoaded', () => setTimeout(initModernUI, 50));
    }
})();
