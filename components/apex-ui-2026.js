/**
 * APEXWORK 2026 全局流体与光感视觉引擎 (apex-ui-2026.js)
 * 作用：无需修改任何 HTML 结构，强行接管全站视觉反馈、滚动惯性与入场动画
 */

(function () {
    // 1. 动态注入 2026 最潮流的弥散光感 (Aura) 与弹簧微动效 CSS
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --aura-primary: rgba(99, 102, 241, 0.15);
            --aura-success: rgba(16, 185, 129, 0.15);
            --spring-easing: cubic-bezier(0.175, 0.885, 0.32, 1.275);
            --fluid-easing: cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* 隐藏原生生硬滚动条，交由 Lenis 接管视觉 */
        html.lenis, html.lenis body { height: auto; width: 100vw; }
        .lenis.lenis-smooth { scroll-behavior: auto !important; }
        .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }

        /* 卡片悬浮态：弹簧阻尼放大 + 环境光晕 */
        .bento-card, .saas-card, .kpi-card {
            transition: transform 0.5s var(--spring-easing), box-shadow 0.4s var(--fluid-easing), border-color 0.4s ease !important;
            will-change: transform, box-shadow;
        }
        .bento-card:hover, .saas-card:hover {
            transform: translateY(-4px) scale(1.005) !important;
            box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08), 0 0 40px -10px var(--aura-primary) !important;
            border-color: rgba(99, 102, 241, 0.3) !important;
            z-index: 10;
        }
        .kpi-card:hover {
            transform: translateY(-3px) scale(1.02) !important;
            box-shadow: 0 10px 20px -5px var(--aura-success) !important;
        }

        /* 按钮磁性与流体反馈 */
        button {
            transition: all 0.3s var(--fluid-easing) !important;
            position: relative;
            overflow: hidden;
        }
        button:active {
            transform: scale(0.96) !important; /* 点击时的物理按压感 */
        }
        button::after {
            content: ''; position: absolute; top: 50%; left: 50%; width: 150%; height: 150%;
            background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%);
            transform: translate(-50%, -50%) scale(0); opacity: 0; transition: transform 0.4s ease, opacity 0.4s ease;
        }
        button:hover::after {
            transform: translate(-50%, -50%) scale(1); opacity: 1;
        }

        /* 沉浸式输入框聚焦体验 (Aura Focus) */
        input, select, textarea, [contenteditable="true"] {
            transition: box-shadow 0.4s var(--spring-easing), background-color 0.3s ease, border-color 0.3s ease !important;
        }
        input:focus, textarea:focus, [contenteditable="true"]:focus {
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2), 0 0 30px -5px var(--aura-primary) !important;
            border-color: #6366f1 !important;
            background-color: #ffffff !important;
        }
        [data-theme="dark"] input:focus, [data-theme="dark"] [contenteditable="true"]:focus {
            background-color: #0f172a !important;
        }

        /* 左侧导航栏与侧边栏的磨砂玻璃进化 */
        aside {
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
    `;
    document.head.appendChild(style);

    // 2. 动态加载 2026 必备的依赖引擎 (GSAP + Lenis 丝滑滚动)
    const loadScript = (src) => new Promise(resolve => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src; s.onload = resolve; document.head.appendChild(s);
    });

    async function initModernUI() {
        // 并发加载 GSAP 核心、ScrollTrigger 插件 和 Lenis 滚动引擎
        await Promise.all([
            loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"),
            loadScript("https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.29/bundled/lenis.min.js")
        ]);
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js");

        gsap.registerPlugin(ScrollTrigger);

        // --- A. 注入全局丝滑物理滚动 (Lenis) ---
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // 2026 最优阻尼曲线
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);

        // 与 GSAP ScrollTrigger 联动
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => { lenis.raf(time * 1000) });
        gsap.ticker.lagSmoothing(0);

        // --- B. 全站自动化入场级联动画 (Stagger Reveal) ---
        // 自动寻址所有卡片、模块区块，只要出现在视口，就顺滑上浮出现
        const animateElements = document.querySelectorAll('.bento-card, .saas-card, section, .kpi-card, table tr');
        
        animateElements.forEach((el, i) => {
            // 防止重复绑定
            if (el.classList.contains('gsap-bound')) return;
            el.classList.add('gsap-bound');

            gsap.fromTo(el, 
                { y: 30, opacity: 0, scale: 0.98 },
                {
                    y: 0, opacity: 1, scale: 1,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 90%", // 当元素顶部到达屏幕 90% 时触发
                        toggleActions: "play none none reverse", // 向上滚动时会恢复，再次向下会重新播放
                    },
                    delay: i % 10 * 0.05 // 创造瀑布流级别的递进感
                }
            );
        });

        // --- C. 特殊编辑器页面的顶栏吸附呼吸效 ---
        const header = document.querySelector('header');
        if (header) {
            ScrollTrigger.create({
                start: 'top -50',
                onUpdate: (self) => {
                    if (self.direction === 1) { // 向下滚动，顶栏收缩并加深毛玻璃
                        gsap.to(header, { backdropFilter: "blur(24px)", backgroundColor: "rgba(255,255,255,0.8)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)", duration: 0.3 });
                    } else {
                        gsap.to(header, { backgroundColor: "rgba(255,255,255,1)", duration: 0.3 });
                    }
                }
            });
        }
    }

    // 监听页面完全加载后执行（兼容您现有的所有异步渲染）
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(initModernUI, 100);
    } else {
        window.addEventListener('DOMContentLoaded', () => setTimeout(initModernUI, 100));
    }
})();
