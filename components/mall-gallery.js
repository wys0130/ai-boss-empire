/**
 * APEXWORK 商城大图画廊引擎 (components/mall-gallery.js)
 * 1. 彻底从 HTML 中解耦，解决加载白屏问题。
 * 2. 模拟大厂（觅知网）包含骨架屏占位与平滑加载。
 * 3. 自动融合本地兜底数据与云端 AI 动态生成数据。
 */

window.ApexMallGallery = {
    // 兜底基础货品
    baseProducts: [
        {
            id: "aerotech",
            title: "AeroTech 创投规划书",
            category: "15 页 · 商业计划书",
            thumb: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
            priceRmb: 69,
            priceUsd: 9.99
        },
        {
            id: "saas",
            title: "SaaS 增长指标盘点",
            category: "20 页 · 数据可视化",
            thumb: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80",
            priceRmb: 69,
            priceUsd: 9.99
        },
        {
            id: "fintech",
            title: "FinTech A 轮融资方案",
            category: "12 页 · 科技金融",
            thumb: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
            priceRmb: 69,
            priceUsd: 9.99
        }
    ],

    init: async function() {
        const grid = document.getElementById('mall-ppt-grid');
        if (!grid) return;
        
        // 渲染加载骨架屏
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center text-blue-500 font-mono text-sm animate-pulse flex flex-col items-center justify-center gap-3">
                <span class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                <span>正在接入云端 AI 模板矩阵...</span>
            </div>
        `;

        let allProducts = [...this.baseProducts];

        // 尝试拉取 AI 生成的模板
        try {
            const res = await fetch('data/ai-generated-decks.json?nocache=' + Date.now());
            if (res.ok) {
                const aiData = await res.json();
                if (Array.isArray(aiData) && aiData.length > 0) {
                    allProducts = [...allProducts, ...aiData];
                }
            }
        } catch(e) {
            console.warn("未检测到新的 AI 模板，加载默认图库。");
        }

        this.render(allProducts);
    },

    render: function(products) {
        const grid = document.getElementById('mall-ppt-grid');
        if (!grid) return;
        grid.innerHTML = "";

        const pricing = window.ApexPricing ? window.ApexPricing.getConfig() : { ppt: { rmb: 69, usd: 9.99 } };

        products.forEach(p => {
            const finalImg = p.thumb || p.fallback || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80";
            const currentRmb = p.priceRmb || pricing.ppt.rmb;

            grid.innerHTML += `
                <div onclick="ApexMallGallery.openDetailModal('${p.id}', '${p.title.replace(/'/g, "\\'")}', '${finalImg}', ${currentRmb})" class="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 group cursor-pointer flex flex-col relative">
                    
                    <div class="relative w-full pt-[75%] bg-slate-100 overflow-hidden">
                        <img src="${finalImg}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="${p.title}" loading="lazy">
                        
                        <div class="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                            👑 严选商用
                        </div>
                        
                        <div class="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                            ${p.category ? p.category.split('·')[0].trim() : '模板'}
                        </div>
                    </div>
                    
                    <div class="p-4 flex-1 flex flex-col justify-between bg-white">
                        <h4 class="text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition tracking-tight">${p.title}</h4>
                        <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                            <span class="text-[11px] text-slate-400 font-medium truncate pr-2">${p.category ? p.category.split('·')[1]?.trim() : '商业展示'}</span>
                            <span class="text-base font-black text-orange-600 font-mono">￥${currentRmb}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        if (window.ApexLang) window.ApexLang.apply(window.ApexLang.currentLang);
    },

    // 👑 新增：商品预览大弹窗
    openDetailModal: function(id, title, img, priceRmb) {
        // 先检查是否存在模态框容器，没有就动态创建
        let modal = document.getElementById("productDetailModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "productDetailModal";
            modal.className = "hidden fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4";
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="bg-white max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
                <button onclick="document.getElementById('productDetailModal').classList.add('hidden')" class="absolute top-4 right-4 z-10 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/70 transition font-bold">✕</button>
                
                <!-- 左侧大图区 -->
                <div class="md:w-3/5 bg-slate-100 relative min-h-[250px] md:min-h-[400px]">
                    <img src="${img}" class="absolute inset-0 w-full h-full object-cover" alt="预览">
                </div>
                
                <!-- 右侧信息区 -->
                <div class="md:w-2/5 p-6 md:p-8 flex flex-col justify-between bg-white">
                    <div>
                        <div class="text-[10px] font-mono text-blue-600 font-bold bg-blue-50 inline-block px-2 py-1 rounded mb-3">APEXWORK 官方自营模板</div>
                        <h2 class="text-xl font-black text-slate-900 leading-tight mb-2">${title}</h2>
                        <p class="text-xs text-slate-500 leading-relaxed mb-4">包含高阶配色方案、矢量数据图表与全套动画。支持一键修改企业数据，100% 符合欧美与国内商用合规标准。</p>
                        <div class="space-y-2 mb-6 border-t border-b border-slate-100 py-4">
                            <div class="flex justify-between text-xs font-mono"><span class="text-slate-400">商用授权许可</span><span class="font-bold text-emerald-600">✓ 终身可商用</span></div>
                            <div class="flex justify-between text-xs font-mono"><span class="text-slate-400">格式支持</span><span class="font-bold text-slate-700">.PPTX / 在线编辑</span></div>
                        </div>
                    </div>
                    
                    <div>
                        <div class="flex items-end gap-2 mb-3">
                            <span class="text-2xl font-black text-orange-600 font-mono">￥${priceRmb}</span>
                            <span class="text-xs text-slate-400 line-through mb-1">￥199</span>
                        </div>
                        <button onclick="window.location.href='editor.html?deck=${id}'" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2">
                            <span>⚡ 立即解锁并进入全能编辑器</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (window.ApexMallGallery) window.ApexMallGallery.init();
});
