/**
 * APEXWORK 2026 全局流体与光感视觉引擎 (apex-ui-2026.js)
 * 👑 终极质感版：引入 SVG 噪点材质、Linear 级极简高光边框、纯黑高级暗黑模式
 */

(function () {
    // 1. 注入顶级极简商业 CSS 材质装甲
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* 👑 1. 全局材质层：引入高级 SaaS 必备的极微弱噪点 (Noise) 纹理，消除塑料感 */
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            letter-spacing: -0.01em !important; /* 全局字距微微收紧，提升精细度 */
        }
        body::before {
            content: ''; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
            pointer-events: none; z-index: 9999; mix-blend-mode: overlay;
        }

        /* 👑 2. 暗黑模式重塑：抛弃发蓝的 slate-950，改用极其高级的“真·纯黑”底色 */
        [data-theme="dark"] body, body.bg-slate-950 {
            background-color: #000000 !important;
            color: #ededed !important;
        }

        /* 👑 3. 字体排版重塑：标题强制紧凑，强化力量感 */
        h1, h2, h3, h4, .font-black {
            letter-spacing: -0.03em !important;
        }

        /* 👑 4. 顶栏重构：剔除多余边框，仅用极薄底部投影分离层级 */
        header {
            background-color: rgba(255, 255, 255, 0.75) !important;
            backdrop-filter: blur(20px) saturate(180%) !important;
            -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
            border-bottom: none !important;
            box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0,0,0,0.02) !important;
        }
        [data-theme="dark"] header, body.bg-slate-950 header {
            background-color: rgba(10, 10, 10, 0.75) !important;
            box-shadow: 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 24px rgba(0,0,0,0.4) !important;
        }

        /* 👑 5. 卡片质感革命 (Linear Style)：加入物理厚度的高光 (Inset Shadow) */
        .bento-card, .saas-card, .kpi-card, .border-slate-200 {
            background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%) !important;
            border: 1px solid rgba(0, 0, 0, 0.06) !important;
            /* 关键质感：顶部边缘 1px 白色内发光，模拟物理切面反光 */
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 1), 
                        0 2px 4px rgba(0, 0, 0, 0.02), 
                        0 8px 16px rgba(0, 0, 0, 0.02) !important;
            border-radius: 12px !important;
        }
        [data-theme="dark"] .bento-card, body.bg-slate-950 .bento-card, 
        [data-theme="dark"] .saas-card, [data-theme="dark"] .kpi-card,
        [data-theme="dark"] .border-slate-800 {
            background: linear-gradient(180deg, #161616 0%, #0c0c0c 100%) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            /* 关键质感：暗色模式下的微光边缘 */
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 
                        0 10px 30px rgba(0,0,0,0.8) !important;
        }

        /* 卡片极简悬浮反馈：不要大弹跳，只需锐利的上浮和阴影加深 */
        .bento-card:hover, .saas-card:hover {
            transform: translateY(-2px) !important;
            border-color: rgba(0, 0, 0, 0.12) !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 1), 
                        0 12px 24px rgba(0, 0, 0, 0.04), 
                        0 24px 48px rgba(0, 0, 0, 0.04) !important;
        }
        [data-theme="dark"] .bento-card:hover, [data-theme="dark"] .saas-card:hover,
        body.bg-slate-950 .saas-card:hover {
            border-color: rgba(255, 255, 255, 0.15) !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 
                        0 20px 40px rgba(0,0,0,0.9) !important;
        }

        /* 👑 6. 按钮高级感：增加微渐变与金属反光边框 */
        button.bg-blue-600, button.bg-indigo-600, button.bg-emerald-600 {
            background-image: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%) !important;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 5px rgba(0,0,0,0.2) !important;
            text-shadow: 0 1px 1px rgba(0,0,0,0.2) !important;
            border-top: 1px solid rgba(255,255,255,0.2) !important;
        }
        button:active { transform: scale(0.96) !important; }

        /* 👑 7. 输入框：收敛边框，增加柔和内凹感 */
        input, select, textarea, [contenteditable="true"] {
            background-color: rgba(0,0,0,0.02) !important;
            border: 1px solid rgba(0,0,0,0.08) !important;
            box-shadow: inset 0 1px 2px rgba(0,0,0,0.02) !important;
            border-radius: 8px !important;
            transition: all 0.2s ease !important;
        }
        [data-theme="dark"] input, [data-theme="dark"] select, [data-theme="dark"] textarea, body.bg-slate-950 [contenteditable="true"] {
            background-color: rgba(255,255,255,0.03) !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
            box-shadow: inset 0 1px 2px rgba(0,0,0,0.2) !important;
        }
        input:focus, textarea:focus, [contenteditable="true"]:focus {
            background-color: #ffffff !important;
            border-color: #6366f1 !important;
            box-shadow: 0 0 0 1px #6366f1, 0 4px 12px rgba(99,102,241,0.1) !important;
            outline: none !important;
        }
        [data-theme="dark"] input:focus, body.bg-slate-950 [contenteditable="true"]:focus {
            background-color: #111111 !important;
            box-shadow: 0 0 0 1px #6366f1, 0 4px 12px rgba(99,102,241,0.2) !important;
        }

        /* Lenis 基础滚动 */
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

        // A. 高级阻尼感物理滚动
        const lenis = new Lenis({
            duration: 1.0, 
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

        // B. 高级入场动效：克制、干脆的透明度与Y轴显现，抛弃廉价的放大缩小回弹
        const animateElements = document.querySelectorAll('.bento-card, .saas-card, section, .kpi-card');
        
        animateElements.forEach((el, i) => {
            if (el.classList.contains('gsap-bound')) return;
            el.classList.add('gsap-bound');

            gsap.fromTo(el, 
                { y: 20, opacity: 0 }, 
                {
                    y: 0, opacity: 1, 
                    duration: 0.7,
                    ease: "power2.out", 
                    scrollTrigger: {
                        trigger: el,
                        start: "top 95%", 
                        toggleActions: "play none none reverse", 
                    },
                    delay: i % 10 * 0.04 
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
