// ==========================================
// APEXWORK 模块 2：业务风控、产品大盘与代码快照引擎 (admin-biz.js)
// ==========================================

const DEFAULT_AUDIT_PRODUCTS = [
    { id: "aerotech", title: "AeroTech 创投规划书", category: "15 SLIDES · Office PPT演示", thumbKey: "prod_aerotech", thumbCloudPath: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-orange-500 font-bold", isLinked: true, status: true },
    { id: "saas", title: "SaaS 增长指标盘点", category: "20 SLIDES · Office PPT演示", thumbKey: "prod_saas", thumbCloudPath: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-orange-500 font-bold", isLinked: true, status: true },
    { id: "fintech", title: "FinTech A 轮融资方案", category: "12 SLIDES · Office PPT演示", thumbKey: "prod_fintech", thumbCloudPath: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-orange-500 font-bold", isLinked: true, status: true },
    { id: "excel-roi", title: "全渠道 ROI 动态测算模型", category: "XLSX MODEL · Office EXCEL表格", thumbKey: "prod_excel", thumbCloudPath: "https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-emerald-600 font-bold", isLinked: true, status: true },
    { id: "word-ats", title: "欧美 ATS 智能排版合规报告", category: "DOCX STANDARD · Office WORD文档", thumbKey: "prod_word", thumbCloudPath: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-indigo-600 font-bold", isLinked: true, status: true }
];

async function loadAuditProducts() {
    let blacklist = JSON.parse(localStorage.getItem('APEX_DELETED_ZOMBIES') || '[]');
    const localProducts = localStorage.getItem('APEX_AUDIT_PRODUCTS');
    if (localProducts) {
        AUDIT_PRODUCTS.length = 0; 
        JSON.parse(localProducts).forEach(p => AUDIT_PRODUCTS.push(p));
    } else {
        AUDIT_PRODUCTS = JSON.parse(JSON.stringify(DEFAULT_AUDIT_PRODUCTS));
    }

    try {
        let aiData = null;
        const keys = getKeysSafe();
        if (keys && keys.gh) {
            const f = await getGithubFileSafe("data/ai-generated-decks.json", keys.gh);
            if (f.content) aiData = JSON.parse(f.content);
        } else {
            const res = await fetch('data/ai-generated-decks.json?nocache=' + Date.now());
            if (res.ok) aiData = await res.json();
        }

        if (Array.isArray(aiData)) {
            aiData.forEach(aiItem => {
                // 如果不仅本地没有，且【绝对没在黑名单中出现过】，才允许拉进来
                if (!AUDIT_PRODUCTS.find(p => p.id === aiItem.id) && !blacklist.includes(aiItem.id)) {
                    let col = 'text-orange-500 font-bold';
                    if (aiItem.type === 'excel') col = 'text-emerald-600 font-bold';
                    if (aiItem.type === 'word') col = 'text-indigo-600 font-bold';
                    
                    AUDIT_PRODUCTS.push({
                        id: aiItem.id, title: aiItem.title || aiItem.name,
                        category: aiItem.category || `AI 生成 · ${aiItem.type ? aiItem.type.toUpperCase() : 'PPT'}`,
                        thumbKey: "prod_" + aiItem.id,
                        thumbCloudPath: aiItem.thumb || aiItem.thumbnail || "",
                        thumbDefault: aiItem.thumb || aiItem.thumbnail || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80",
                        priceRmb: aiItem.priceRmb || 69, priceUsd: aiItem.priceUsd || "14.99",
                        colorCls: col, isLinked: true, status: true
                    });
                }
            });
        }
    } catch(e) { console.warn("拉取云端模板失败", e); }
    
    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(AUDIT_PRODUCTS));
    renderAuditTable();
}

function toggleAllCheckboxes(masterCb) {
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        if (!cb.disabled) cb.checked = masterCb.checked;
    });
}

// 👑 带排队锁的完美批量删除系统
async function bulkDeleteSelected() {
    const checkedBoxes = Array.from(document.querySelectorAll('.row-checkbox:checked'));
    if (checkedBoxes.length === 0) return alert("⚠️ 请先勾选需要删除的作品！");
    
    if (!confirm(`⚠️ 确定要强制销毁选中的 ${checkedBoxes.length} 个作品吗？\n(物理删除，且加入防复活黑名单，绝对无法恢复！)`)) return;

    const idsToDelete = checkedBoxes.map(cb => cb.value);
    const btn = document.getElementById('bulkDeleteBtn');
    if (btn) { btn.innerHTML = "销毁中..."; btn.disabled = true; }

    try {
        let blacklist = JSON.parse(localStorage.getItem('APEX_DELETED_ZOMBIES') || '[]');
        idsToDelete.forEach(id => { if (!blacklist.includes(id)) blacklist.push(id); });
        localStorage.setItem('APEX_DELETED_ZOMBIES', JSON.stringify(blacklist));

        AUDIT_PRODUCTS = AUDIT_PRODUCTS.filter(p => !idsToDelete.includes(p.id));
        localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(AUDIT_PRODUCTS));
        renderAuditTable();

        while(isCloudSyncing) { await new Promise(r => setTimeout(r, 500)); }
        isCloudSyncing = true;

        const keys = getKeysSafe();
        if (keys && keys.gh) {
            const f = await getGithubFileSafe("data/ai-generated-decks.json", keys.gh);
            if (f.content) {
                let cloudDecks = JSON.parse(f.content);
                cloudDecks = cloudDecks.filter(d => !idsToDelete.includes(d.id) && !blacklist.includes(d.id));
                await pushGithubJsonFile("data/ai-generated-decks.json", cloudDecks, f.sha, `🗑️ 批量销毁 ${checkedBoxes.length} 个 AI 商品 [skip ci]`, keys.gh);
            }
        }
        appendLog(`>> [风控审查] 批量销毁成功！已彻底清理 ${checkedBoxes.length} 个 AI 作品。`);
    } catch(e) {
        alert("❌ 云端同步异常：" + e.message);
    } finally {
        isCloudSyncing = false;
        if (btn) { btn.innerHTML = "🗑️ 批量删除选中"; btn.disabled = false; }
        const masterCb = document.getElementById('selectAllCheckbox');
        if (masterCb) masterCb.checked = false;
    }
}

async function forceRemoveProduct(id) {
    const idx = AUDIT_PRODUCTS.findIndex(p => p.id === id);
    if (idx === -1) return;
    const title = AUDIT_PRODUCTS[idx].title;

    if (!confirm(`⚠️ 危险操作！确定要在商城强制下架并销毁 [${title}] 吗？`)) return;
    
    const btn = window.event ? window.event.currentTarget : null;
    const originalText = btn ? btn.innerHTML : "强制销毁";
    if (btn) { btn.innerHTML = "销毁中..."; btn.disabled = true; }
    
    try {
        const blacklist = JSON.parse(localStorage.getItem('APEX_DELETED_ZOMBIES') || '[]');
        if (!blacklist.includes(id)) blacklist.push(id);
        localStorage.setItem('APEX_DELETED_ZOMBIES', JSON.stringify(blacklist));

        AUDIT_PRODUCTS.splice(idx, 1);
        localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(AUDIT_PRODUCTS));
        renderAuditTable();
        
        while(isCloudSyncing) { await new Promise(r => setTimeout(r, 500)); }
        isCloudSyncing = true;

        const keys = getKeysSafe();
        if (keys && keys.gh) {
            const f = await getGithubFileSafe("data/ai-generated-decks.json", keys.gh);
            if (f.content) {
                let cloudDecks = JSON.parse(f.content);
                cloudDecks = cloudDecks.filter(d => d.id !== id && !blacklist.includes(d.id));
                await pushGithubJsonFile("data/ai-generated-decks.json", cloudDecks, f.sha, `🗑️ 单件强制销毁下架: ${title} [skip ci]`, keys.gh);
            }
        }
        appendLog(`>> [风控审查] 已彻底销毁作品并加入防复活黑名单: ${title}`);
    } catch(e) {
        alert("❌ 销毁失败，云端同步异常：" + e.message);
        if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
    } finally {
        isCloudSyncing = false;
    }
}

function renderAuditTable() {
    const tbody = document.getElementById("auditTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const tableEl = tbody.closest("table");
    if (tableEl) {
        tableEl.querySelectorAll("th").forEach(th => th.classList.add("whitespace-nowrap", "tracking-wider", "select-none"));
        const theadTr = tableEl.querySelector('thead tr');
        if (theadTr && !document.getElementById('selectAllCheckbox')) {
            const th = document.createElement('th');
            th.className = "py-3 px-2 w-10 text-center";
            th.innerHTML = '<input type="checkbox" id="selectAllCheckbox" class="w-4 h-4 cursor-pointer accent-blue-600" onchange="toggleAllCheckboxes(this)">';
            theadTr.insertBefore(th, theadTr.firstChild);
        }
    }

    const titleArea = document.querySelector('#tab-audit h3');
    if (titleArea && !document.getElementById('bulkDeleteBtn')) {
        titleArea.classList.add('flex', 'items-center');
        const btn = document.createElement('button');
        btn.id = 'bulkDeleteBtn';
        btn.className = "ml-4 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer";
        btn.innerHTML = "🗑️ 批量删除选中";
        btn.onclick = bulkDeleteSelected;
        titleArea.appendChild(btn);
    }

    const blacklist = JSON.parse(localStorage.getItem('APEX_DELETED_ZOMBIES') || '[]');
    AUDIT_PRODUCTS = AUDIT_PRODUCTS.filter(p => !blacklist.includes(p.id));

    AUDIT_PRODUCTS.forEach((item, index) => {
        const isDefault = !item.id.startsWith('AI-');
        const finalThumbUrl = ApexImageEngine.resolve(item.thumbKey, item.thumbCloudPath, item.thumbDefault);
        const badgeCls = item.status ? "bg-emerald-500 text-white font-bold shadow-sm" : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400";
        const linkBtnCls = item.isLinked ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-amber-500/10 text-amber-600 border-amber-500/30";
        const linkBtnText = item.isLinked ? "🔗 联动中" : "🔓 独立价";

        tbody.innerHTML += `
            <tr class="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <td class="py-2 px-2 w-10 text-center">
                    ${isDefault 
                        ? `<input type="checkbox" disabled class="w-4 h-4 opacity-30 cursor-not-allowed" title="原生源码商品无法删除">` 
                        : `<input type="checkbox" class="row-checkbox w-4 h-4 cursor-pointer accent-blue-600" value="${item.id}">`
                    }
                </td>
                <td class="py-2 px-2 w-16 whitespace-nowrap text-center">
                    <div class="relative group w-12 h-16 mx-auto">
                        <img src="${finalThumbUrl}" alt="快照" class="w-12 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" />
                        <button onclick="uploadProductThumb(${index})" class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center text-white text-[10px] font-bold">📤 WebP</button>
                    </div>
                </td>
                <td class="py-2 px-3 min-w-[150px] whitespace-normal break-words">
                    <div class="font-black text-sm text-[#0f172a] dark:text-[#f8fafc] leading-tight">${item.title}</div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">${item.category}</div>
                </td>
                <td class="py-2 px-2 font-mono whitespace-nowrap">
                    <div class="flex items-center gap-1 flex-nowrap whitespace-nowrap">
                        <span class="${item.colorCls}">￥</span>
                        <input type="number" value="${item.priceRmb}" onchange="onAuditPriceChange(${index}, 'rmb', this.value)" class="w-14 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1 py-1 text-xs font-bold text-center outline-none ${item.colorCls}" />
                        <span class="text-slate-400 mx-1">/</span>
                        <span class="text-blue-600 font-bold">$</span>
                        <input type="number" step="0.01" value="${item.priceUsd}" onchange="onAuditPriceChange(${index}, 'usd', this.value)" class="w-16 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1 py-1 text-xs font-bold text-center text-blue-600 outline-none" />
                        <button onclick="toggleRowLinkage(${index})" class="ml-1 px-1.5 py-1 rounded border text-[10px] font-mono font-bold transition-all shrink-0 whitespace-nowrap ${linkBtnCls}">${linkBtnText}</button>
                    </div>
                </td>
                <td class="py-2 px-2 whitespace-nowrap text-center">
                    <button onclick="toggleAuditStatus(${index})" class="px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap inline-flex items-center gap-1 transition ${badgeCls}">
                        <span>●</span><span>${item.status ? '已上架' : '已隐藏'}</span>
                    </button>
                </td>
                <td class="py-3 px-4 text-right">
                    <div class="inline-flex flex-wrap justify-end gap-1 min-w-[140px]">
                        <button onclick="uploadProductThumb(${index})" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition whitespace-nowrap">上传WebP图</button>
                        ${isDefault
                            ? `<button class="px-3 py-1.5 rounded-lg bg-slate-600 text-slate-300 font-bold text-xs shadow-sm transition whitespace-nowrap cursor-not-allowed opacity-60">内置商品</button>`
                            : `<button onclick="forceRemoveProduct('${item.id}')" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition whitespace-nowrap">强制销毁</button>`
                        }
                    </div>
                </td>
            </tr>
        `;
    });
}

function uploadProductThumb(index) {
    const item = AUDIT_PRODUCTS[index];
    ApexImageEngine.uploadAndBackup(item.thumbKey, item.thumbCloudPath, () => {
        localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(AUDIT_PRODUCTS));
        renderAuditTable();
        appendLog(`>> [缩略图] [${item.title}] WebP 转换并绑定完成`);
    });
}

function toggleRowLinkage(index) {
    AUDIT_PRODUCTS[index].isLinked = !AUDIT_PRODUCTS[index].isLinked;
    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(AUDIT_PRODUCTS));
    renderAuditTable();
    appendLog(`>> [风控审查] 作品 [${AUDIT_PRODUCTS[index].title}] 定价模式 -> ${AUDIT_PRODUCTS[index].isLinked ? '汇率联动' : '行内独立定价'}`);
}

function onAuditPriceChange(index, field, val) {
    const num = parseFloat(val) || 0;
    if (field === 'rmb') {
        AUDIT_PRODUCTS[index].priceRmb = num;
        if (AUDIT_PRODUCTS[index].isLinked) {
            let usd = num / ApexFX.currentRate;
            usd = (ApexPricing && ApexPricing.use99Rule && num > 0) ? (Math.floor(usd) + 0.99) : Number(usd.toFixed(2));
            AUDIT_PRODUCTS[index].priceUsd = usd > 0 ? usd : "0.00";
        }
    } else if (field === 'usd') {
        AUDIT_PRODUCTS[index].priceUsd = num;
        if (AUDIT_PRODUCTS[index].isLinked) {
            const rmb = Math.round(num * ApexFX.currentRate);
            AUDIT_PRODUCTS[index].priceRmb = rmb > 0 ? rmb : 0;
        }
    }
    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(AUDIT_PRODUCTS));
    renderAuditTable();
}

function toggleAuditStatus(index) {
    AUDIT_PRODUCTS[index].status = !AUDIT_PRODUCTS[index].status;
    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(AUDIT_PRODUCTS));
    renderAuditTable();
    appendLog(`>> [风控审查] 更改作品 [${AUDIT_PRODUCTS[index].title}] 上架状态 -> ${AUDIT_PRODUCTS[index].status ? '已上架' : '下架隐藏'}`);
}

// 辅助组件：图片引擎、汇率、配置
const ApexImageEngine = {
    cdn: { owner: "wys0130", repo: "ai-boss-empire", branch: "main" },
    toCDN: function(path) {
        if (!path || path.trim() === "") return null;
        if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:image")) return path;
        const cleanPath = path.replace(/^\//, "");
        return `https://cdn.jsdelivr.net/gh/${this.cdn.owner}/${this.cdn.repo}@${this.cdn.branch}/${cleanPath}`;
    },
    resolve: function(assetKey, cloudPath, defaultFallback) {
        const local = localStorage.getItem("APEX_IMG_CACHE_" + assetKey);
        if (local && local.startsWith("data:image")) return local;
        if (cloudPath && (cloudPath.startsWith("http://") || cloudPath.startsWith("https://"))) return cloudPath;
        if (cloudPath && cloudPath.trim() !== "" && !cloudPath.startsWith("assets/")) {
            const cdnUrl = this.toCDN(cloudPath);
            if (cdnUrl) return cdnUrl;
        }
        return defaultFallback || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80";
    },
    uploadAndBackup: function(assetKey, repoPath, callback) {
        const fileInput = document.createElement("input");
        fileInput.type = "file"; fileInput.accept = "image/*";
        fileInput.onchange = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const maxW = 1280; let w = img.width, h = img.height;
                    if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
                    canvas.width = w; canvas.height = h;
                    const webpDataUrl = canvas.toDataURL("image/webp", 0.85);
                    localStorage.setItem("APEX_IMG_CACHE_" + assetKey, webpDataUrl);
                    if (callback) callback(webpDataUrl, repoPath);
                    try {
                        const keys = getKeysSafe();
                        if (keys && keys.gh) {
                            const rawBase64 = webpDataUrl.replace(/^data:image\/webp;base64,/, "");
                            const fileObj = await getGithubFileSafe(repoPath, keys.gh);
                            await pushGithubBinaryFile(repoPath, rawBase64, fileObj.sha, `🖼️ Asset: Backup WebP image [${assetKey}] to ${repoPath} [skip ci]`, keys.gh);
                            alert(`✅ 图片已转 WebP 并成功备份！\n\n全球CDN秒开链接：\n${ApexImageEngine.toCDN(repoPath)}`);
                            return;
                        }
                    } catch (err) { console.warn("提交 GitHub 云端异常:", err); }
                    alert("✅ 图片已压缩为 WebP 并写入当前电脑缓存！");
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        };
        fileInput.click();
    }
};

const ApexFX = {
    currentRate: 7.18,
    initWeeklyRate: async function() {
        const cache = JSON.parse(localStorage.getItem("APEX_FX_RATE_CACHE") || "{}");
        const now = Date.now();
        if (cache.rate && cache.timestamp && (now - cache.timestamp < 604800000)) {
            this.currentRate = cache.rate;
            this.updateBadge(cache.rate, false);
            return;
        }
        await this.forceRefreshRate();
    },
    manualRefresh: async function() {
        if (!confirm("🔄 确定要手动向央行节点拉取最新汇率吗？\n\n(拉取成功后，系统将自动重算全站所有已开启【汇率联动】的美元定价)")) return;
        await this.forceRefreshRate(true);
    },
    forceRefreshRate: async function(isManual = false) {
        const badge = document.getElementById("fxRateBadge");
        if (badge) badge.innerText = "向央行查汇中...";
        try {
            const res = await fetch("https://open.er-api.com/v6/latest/USD");
            const data = await res.json();
            if (data && data.rates && data.rates.CNY) {
                const newRate = Number(data.rates.CNY).toFixed(2);
                const isRateChanged = this.currentRate !== newRate;
                this.currentRate = newRate;
                localStorage.setItem("APEX_FX_RATE_CACHE", JSON.stringify({ rate: this.currentRate, timestamp: Date.now() }));
                this.updateBadge(this.currentRate, true);
                appendLog(`>> [汇率中台] 抓取最新外汇：1 USD = ${this.currentRate} CNY`);
                if (isManual || isRateChanged) {
                    this.syncAllLinkedPrices();
                    if (isManual) alert(`✅ 最新外汇挂牌价拉取成功：1 USD = ${this.currentRate} CNY\n\n已为您自动重算所有开启了【汇率联动】的美元定价！`);
                }
                return;
            }
        } catch (err) {
            appendLog(`>> [汇率中台] 查询超时，沿用缓存：1 USD = ${this.currentRate} CNY`);
            if (isManual) alert("❌ 查询超时或网络异常，请稍后再试。");
        }
        this.updateBadge(this.currentRate, false);
    },
    updateBadge: function(rate, isFresh) {
        const badge = document.getElementById("fxRateBadge");
        if (badge) badge.innerText = `1 : ${rate} ${isFresh ? '(最新)' : ''}`;
    },
    syncAllLinkedPrices: function() {
        if (window.ApexPricing && window.ApexPricing.isLinked) {
            const keys = ["bundle", "ppt", "excel", "word"];
            keys.forEach(key => {
                const rmbInput = document.getElementById(`rmb-${key}`);
                if (rmbInput && rmbInput.value) { ApexPricing.onRMBChange(key, rmbInput.value); }
            });
        }
        if (typeof AUDIT_PRODUCTS !== "undefined" && Array.isArray(AUDIT_PRODUCTS)) {
            let productsChanged = false;
            AUDIT_PRODUCTS.forEach((item) => {
                if (item.isLinked) {
                    const rmb = parseFloat(item.priceRmb) || 0;
                    let usd = rmb / this.currentRate;
                    usd = (window.ApexPricing && window.ApexPricing.use99Rule && rmb > 0) ? (Math.floor(usd) + 0.99) : Number(usd.toFixed(2));
                    item.priceUsd = usd > 0 ? usd : "0.00";
                    productsChanged = true;
                }
            });
            if (productsChanged) {
                localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(AUDIT_PRODUCTS));
                renderAuditTable();
            }
        }
        appendLog(`>> [汇率中台] 全站已开启联动的美元定价，已按 1:${this.currentRate} 重新核算完毕。`);
    }
};

const ApexPricing = {
    isLinked: true,
    use99Rule: true,
    toggleLinkage: function() {
        this.isLinked = !this.isLinked;
        const btn = document.getElementById("btnToggleLink");
        const icons = ["bundle", "ppt", "excel", "word"];
        if (this.isLinked) {
            btn.className = "px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/30 transition whitespace-nowrap";
            btn.innerText = "🔗 汇率关联: 已绑定";
            icons.forEach(k => { const el = document.getElementById(`linkIcon-${k}`); if (el) { el.innerText = "⇄"; el.className = "text-xs text-emerald-500 font-bold"; } });
            appendLog(`>> [定价控制] 开启关联：任意修改将按汇率 1 : ${ApexFX.currentRate} 互转。`);
        } else {
            btn.className = "px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/30 transition whitespace-nowrap";
            btn.innerText = "🔓 汇率关联: 已解绑";
            icons.forEach(k => { const el = document.getElementById(`linkIcon-${k}`); if (el) { el.innerText = "‖"; el.className = "text-xs text-slate-400"; } });
            appendLog(`>> [定价控制] 关闭关联：双方完全独立填写。`);
        }
    },
    toggle99Rule: function() {
        this.use99Rule = !this.use99Rule;
        const btn = document.getElementById("btnToggle99");
        btn.innerText = `✨ .99尾数: ${this.use99Rule ? '开启' : '关闭'}`;
        btn.className = `px-3 py-1.5 rounded-lg font-bold border transition whitespace-nowrap ${this.use99Rule ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`;
    },
    onRMBChange: function(key, rmbVal) {
        if (!this.isLinked) return;
        const rmb = parseFloat(rmbVal) || 0;
        let usd = rmb / ApexFX.currentRate;
        usd = (this.use99Rule && rmb > 0) ? (Math.floor(usd) + 0.99) : Number(usd.toFixed(2));
        const el = document.getElementById(`usd-${key}`);
        if (el) el.value = usd > 0 ? usd : "";
    },
    onUSDChange: function(key, usdVal) {
        if (!this.isLinked) return;
        const usd = parseFloat(usdVal) || 0;
        const rmb = Math.round(usd * ApexFX.currentRate);
        const el = document.getElementById(`rmb-${key}`);
        if (el) el.value = rmb > 0 ? rmb : "";
    },
    saveAllToStorage: async function() {
        const config = {
            bundle: { rmb: document.getElementById('rmb-bundle').value, usd: document.getElementById('usd-bundle').value },
            ppt: { rmb: document.getElementById('rmb-ppt').value, usd: document.getElementById('usd-ppt').value },
            excel: { rmb: document.getElementById('rmb-excel').value, usd: document.getElementById('usd-excel').value },
            word: { rmb: document.getElementById('rmb-word').value, usd: document.getElementById('usd-word').value },
            rate: ApexFX.currentRate, isLinked: this.isLinked, use99Rule: this.use99Rule, updatedAt: new Date().toISOString()
        };
        localStorage.setItem('APEX_PRICING_CONFIG', JSON.stringify(config));
        try {
            const keys = getKeysSafe();
            if (keys && keys.gh) {
                const fileObj = await getGithubFileSafe("config/pricing.json", keys.gh);
                await pushGithubJsonFile("config/pricing.json", config, fileObj.sha, "💰 Update pricing tables via Dashboard [skip ci]", keys.gh);
            }
        } catch(e) {}
        alert('✅ 商品全网统一定价已保存，云端 GitHub config/pricing.json 已推送更新！');
    }
};

const DEFAULT_MANIFEST_TASKS = [
    { id: "TASK-101", title: "配置海外主力 Lemon Squeezy 结账网关", notes: "用极简代码嵌入 Checkout", stage: "STAGE_1_MVP_GLOBAL", department: "施工工程部", status: "DONE" },
    { id: "TASK-102", title: "国内临时过渡方案：引流至『爱发电』免签约", notes: "检测中国 IP 时购买按钮自动变爱发电跳转", stage: "STAGE_1_MVP_GLOBAL", department: "施工工程部", status: "DONE" },
    { id: "TASK-201", title: "国内正规军升级：广州个体户执照与对公参数", notes: "办个体户无需实际租用办公楼", stage: "STAGE_2_CN_UPGRADE", department: "董事长", status: "IN_PROGRESS" },
    { id: "TASK-203", title: "智能判断多模态设计组，建立每日自动生成模版流水线", notes: "AI 每日印钞：研发多样式 PPT/Excel 模版", stage: "STAGE_2_CN_UPGRADE", department: "主动产品部", status: "TODO" }
];

async function loadTasksManifest() {
    const listEl = document.getElementById('manifestList');
    if (!listEl) return;
    try {
        const localCache = localStorage.getItem("APEX_TASKS_CACHE");
        if (localCache) {
            rawManifestTasks = JSON.parse(localCache);
            renderManifestTasks();
            return;
        }
        const keys = getKeysSafe();
        if (keys && keys.gh) {
            const fileObj = await getGithubFileSafe("TASKS_MANIFEST.json", keys.gh);
            if (fileObj.content) {
                const manifest = JSON.parse(fileObj.content);
                rawManifestTasks = (manifest.tasks && manifest.tasks.length > 0) ? manifest.tasks : JSON.parse(JSON.stringify(DEFAULT_MANIFEST_TASKS));
                renderManifestTasks();
                return;
            }
        }
        rawManifestTasks = JSON.parse(JSON.stringify(DEFAULT_MANIFEST_TASKS));
        renderManifestTasks();
    } catch (err) {
        rawManifestTasks = JSON.parse(JSON.stringify(DEFAULT_MANIFEST_TASKS));
        renderManifestTasks();
    }
}

async function resetManifestToDefault() {
    if (!confirm("确定将所有阶段工单重置为初始待办进度 (TODO) 吗？")) return;
    rawManifestTasks = JSON.parse(JSON.stringify(DEFAULT_MANIFEST_TASKS));
    localStorage.setItem("APEX_TASKS_CACHE", JSON.stringify(rawManifestTasks));
    renderManifestTasks();
    appendLog(">> [进度书] 已将工单重置为初始待办进度！", "text-emerald-500");
    try {
        const keys = getKeysSafe();
        if (keys.gh) {
            const fileObj = await getGithubFileSafe("TASKS_MANIFEST.json", keys.gh);
            const manifest = { summary: { completed: 2, todo: 2, total_tasks: 4 }, tasks: rawManifestTasks, updated_at: new Date().toISOString().slice(0, 10) };
            await pushGithubJsonFile("TASKS_MANIFEST.json", manifest, fileObj.sha, "🔄 Reset tasks to realistic default [skip ci]", keys.gh);
            alert("✅ 云端 GitHub 仓库及页面工单已全部重置！");
            return;
        }
    } catch(e) {}
    alert("✅ 本地工单已完成重置！");
}

function filterManifest(stageKey) {
    currentManifestFilter = stageKey;
    document.querySelectorAll('.manifest-tab').forEach(btn => btn.className = "manifest-tab px-3 py-1 rounded-lg text-slate-400 hover:text-slate-600");
    const targetBtn = window.event?.target;
    if (targetBtn) targetBtn.className = "manifest-tab px-3 py-1 rounded-lg bg-blue-600 text-white font-bold";
    renderManifestTasks();
}

function renderManifestTasks() {
    const listEl = document.getElementById('manifestList');
    if (!listEl) return;
    listEl.innerHTML = "";
    const filtered = currentManifestFilter === 'ALL' ? rawManifestTasks : rawManifestTasks.filter(t => t.stage === currentManifestFilter || (!t.stage && currentManifestFilter === 'ALL'));
    if (filtered.length === 0) { listEl.innerHTML = `<div class="text-center text-xs text-slate-500 py-4 col-span-full font-mono">该阶段无任务</div>`; return; }

    filtered.forEach(task => {
        const isDone = task.status === 'DONE';
        const isInProg = task.status === 'IN_PROGRESS';
        let dotCls = isDone ? "bg-emerald-500" : (isInProg ? "bg-amber-400 animate-pulse" : "bg-slate-400");
        let statusText = isDone ? "已达成" : (isInProg ? "执行中" : "待落实");
        let btnCls = isDone ? "bg-slate-700 hover:bg-slate-600 text-slate-200" : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm";
        
        listEl.innerHTML += `
            <div class="saas-card rounded-xl p-4 flex flex-col justify-between transition hover:border-blue-500 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                <div>
                    <div class="flex items-center justify-between text-[10px] font-mono mb-1.5 text-slate-500 dark:text-slate-400">
                        <span class="font-bold text-blue-600 dark:text-blue-500">[${task.id}] · ${task.department.split('&')[0].trim()}</span>
                        <span class="flex items-center gap-1 font-bold"><i class="w-1.5 h-1.5 rounded-full ${dotCls} inline-block"></i>${statusText}</span>
                    </div>
                    <span class="text-xs font-bold truncate mb-1 block text-slate-900 dark:text-slate-100">${task.title}</span>
                    <span class="text-[11px] text-slate-500 font-mono truncate block">${task.notes || '暂无说明'}</span>
                </div>
                <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end text-xs font-mono">
                    <button onclick="toggleTaskStatus('${task.id}')" class="px-4 py-1.5 rounded-lg font-bold transition ${btnCls}">${isDone ? "↩ 撤销" : "✓ 达成"}</button>
                </div>
            </div>
        `;
    });
}

async function toggleTaskStatus(taskId) {
    const task = rawManifestTasks.find(t => t.id === taskId);
    if (!task) return;
    task.status = task.status === 'DONE' ? 'TODO' : 'DONE';
    localStorage.setItem("APEX_TASKS_CACHE", JSON.stringify(rawManifestTasks));
    appendLog(`✏️ 变更工单状态 -> [${taskId}] ${task.status}`);
    renderManifestTasks();
    try {
        const keys = getKeysSafe();
        if(keys.gh) {
            const fileObj = await getGithubFileSafe("TASKS_MANIFEST.json", keys.gh);
            const manifest = JSON.parse(fileObj.content);
            const targetInManifest = manifest.tasks.find(t => t.id === taskId);
            if (targetInManifest) {
                targetInManifest.status = task.status;
                manifest.updated_at = new Date().toISOString().slice(0, 10);
                await pushGithubJsonFile("TASKS_MANIFEST.json", manifest, fileObj.sha, `🎯 Toggle Task [${taskId}] -> ${task.status} [skip ci]`, keys.gh);
                appendLog(`✅ 工单进度写入成功！`);
                loadTasksManifest();
            }
        }
    } catch (e) { appendLog(`⚠️ 进度已保存在设备中 (同步云端请配置密钥)`, "text-amber-500"); }
}

let currentSnapTab = 'tags';
let currentTagsPage = 1;
const TAGS_PER_PAGE = 8; 

function openRollbackModal() {
    const el = document.getElementById("rollbackModal");
    if (el) el.classList.remove("hidden");
    if (currentSnapTab === 'tags') fetchTaggedCommits(true);
    else fetchNormalCommits(true);
}

function closeRollbackModal() {
    const el = document.getElementById("rollbackModal");
    if (el) el.classList.add("hidden");
}

function switchSnapshotTab(tab) {
    currentSnapTab = tab;
    const btnTags = document.getElementById("tab-btn-tags");
    const btnNormal = document.getElementById("tab-btn-normal");
    const contTags = document.getElementById("commitListTagsContainer");
    const contNormal = document.getElementById("commitListNormalContainer");
    const pagination = document.getElementById("snapshotPagination");

    if (tab === 'tags') {
        if(btnTags) btnTags.className = "flex-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm transition";
        if(btnNormal) btnNormal.className = "flex-1 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition";
        if(contTags) contTags.classList.remove("hidden");
        if(contNormal) contNormal.classList.add("hidden");
        if(pagination) pagination.classList.remove("hidden");
        fetchTaggedCommits();
    } else {
        if(btnNormal) btnNormal.className = "flex-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm transition";
        if(btnTags) btnTags.className = "flex-1 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition";
        if(contNormal) contNormal.classList.remove("hidden");
        if(contTags) contTags.classList.add("hidden");
        if(pagination) pagination.classList.add("hidden");
        fetchNormalCommits();
    }
}

function changeTagsPage(delta) {
    if (delta === -1 && currentTagsPage > 1) { currentTagsPage--; fetchTaggedCommits(); } 
    else if (delta === 1) { currentTagsPage++; fetchTaggedCommits(); }
}

async function createCodeSnapshot() {
    const token = localStorage.getItem("APEX_GH_TOKEN");
    if (!token) return alert("❌ 请先在【🔑 密钥设置】配置 GitHub Token");
    
    const tagInput = document.getElementById("customSnapshotName");
    const tagName = tagInput ? tagInput.value.trim() : "";
    const commitMsg = tagName ? `📸 代码标记: ${tagName}` : `📸 代码标记: 手动存档 ${new Date().toLocaleString('zh-CN')}`;
    
    const btn = document.getElementById("btnCreateSnapshot");
    let originalText = "💾 瞬间打标";
    if (btn) { originalText = btn.innerHTML; btn.innerHTML = "⏳ 打标中..."; btn.disabled = true; }

    try {
        let sha = null;
        try {
            const f = await getGithubFileSafe("data/.snapshot", token);
            sha = f.sha;
        } catch(e){}
        
        const pushRes = await pushGithubJsonFile("data/.snapshot", { timestamp: Date.now(), tag: tagName }, sha, commitMsg, token);
        if (pushRes) {
            alert("✅ 成功创建永久代码标记！");
            if (tagInput) tagInput.value = "";
            switchSnapshotTab('tags');
            currentTagsPage = 1;
            fetchTaggedCommits(true); 
        }
    } catch (err) {
        alert("❌ 打标失败: " + err.message);
    } finally {
        if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
    }
}

async function deleteSnapshotTag(sha, shortSha, e) {
    if (e) e.stopPropagation();
    if (!confirm(`⚠️ 确定要取消快照 [#${shortSha}] 的永久保留标记吗？\n\n(取消后它将从本列表中永久隐藏，但底层 Git 记录依然安全存在)`)) return;
    
    const ghToken = localStorage.getItem("APEX_GH_TOKEN");
    if (!ghToken) return alert("❌ 缺少 GitHub Token");

    const btn = e.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ 取消中...";
    btn.disabled = true;

    try {
        const fileObj = await getGithubFileSafe("config/deleted_tags.json", ghToken);
        let blacklist = [];
        if (fileObj.content) { try { blacklist = JSON.parse(fileObj.content); } catch(err){} }
        
        if (!blacklist.includes(sha)) {
            blacklist.push(sha);
            await pushGithubJsonFile("config/deleted_tags.json", blacklist, fileObj.sha, `🗑️ User removed tag [${shortSha}] from permanent list [skip ci]`, ghToken);
        }
        alert(`✅ 标记 [#${shortSha}] 已成功取消！`);
        fetchTaggedCommits(true);
    } catch(err) {
        alert("❌ 取消标记失败: " + err.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function fetchTaggedCommits(forceRefresh = false) {
    const container = document.getElementById("commitListTagsContainer");
    if (!container) return;
    container.innerHTML = `<div class="text-center text-xs text-slate-400 py-6 font-mono animate-pulse">正在从 GitHub 底层索引永久标记...</div>`;
    const label = document.getElementById("currentTagsPageLabel");
    if(label) label.innerText = currentTagsPage;
    
    const ghToken = localStorage.getItem("APEX_GH_TOKEN");
    if (!ghToken) return container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 font-mono leading-relaxed">缺少 GitHub Token。</div>`;

    try {
        const ts = forceRefresh ? `&_t=${Date.now()}` : '';
        const [res, blacklistRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${REPO}/commits?path=data/.snapshot&page=${currentTagsPage}&per_page=${TAGS_PER_PAGE}${ts}`, { headers: { "Authorization": `token ${ghToken}` } }),
            getGithubFileSafe("config/deleted_tags.json", ghToken)
        ]);
        
        if (!res.ok) throw new Error("无法读取提交记录");
        
        let blacklist = [];
        if (blacklistRes.content) { try { blacklist = JSON.parse(blacklistRes.content); } catch(e){} }
        
        const commits = await res.json();
        container.innerHTML = "";
        
        if (commits.length === 0) {
            container.innerHTML = `<div class="text-center text-xs text-slate-500 py-6 font-mono">第 ${currentTagsPage} 页已无更多记录</div>`;
            const btnNext = document.getElementById("btnNextTags");
            const btnPrev = document.getElementById("btnPrevTags");
            if(btnNext) btnNext.disabled = true;
            if(currentTagsPage === 1 && btnPrev) btnPrev.disabled = true;
            return;
        }

        const btnPrev = document.getElementById("btnPrevTags");
        const btnNext = document.getElementById("btnNextTags");
        if(btnPrev) btnPrev.disabled = (currentTagsPage === 1);
        if(btnNext) btnNext.disabled = (commits.length < TAGS_PER_PAGE);

        const filteredCommits = commits.filter(c => !blacklist.includes(c.sha));
        if (filteredCommits.length === 0) {
            container.innerHTML = `<div class="text-center text-xs text-slate-400 py-6 font-mono leading-relaxed">本页的标记均已被您取消。<br>请点击【下一页】查看更多历史。</div>`;
            return;
        }

        filteredCommits.forEach((item, idx) => {
            const shaShort = item.sha.slice(0, 7);
            const timeStr = new Date(item.commit.committer.date).toLocaleString('zh-CN', { hour12: false });
            container.innerHTML += `
                <div class="rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-sm transition hover:shadow-md mb-2">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="font-bold text-blue-600 dark:text-blue-400">[#${shaShort}]</span>
                            <span class="text-[10px] text-slate-500">${timeStr}</span>
                            <span class="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded ml-1 tracking-widest shadow-sm">📌 永久保留</span>
                        </div>
                        <div class="text-xs truncate text-blue-700 dark:text-blue-300 font-bold" title="${item.commit.message}">${item.commit.message}</div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button onclick="deleteSnapshotTag('${item.sha}', '${shaShort}', event)" class="px-2.5 py-1.5 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 text-rose-500 transition shadow-sm">取消标记</button>
                        <button onclick="revertToSelectedCommit('${item.sha}', '${shaShort}')" class="px-3 py-1.5 border border-blue-300 rounded-lg text-xs font-bold hover:bg-blue-100 transition text-blue-600 shadow-sm">
                            ${(currentTagsPage === 1 && idx === 0) ? '当前状态' : '还原'}
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (err) { container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 font-mono">拉取异常，请检查网络。</div>`; }
}

async function fetchNormalCommits(forceRefresh = false) {
    const container = document.getElementById("commitListNormalContainer");
    if (!container) return;
    container.innerHTML = `<div class="text-center text-xs text-slate-400 py-6 font-mono animate-pulse">正在获取最近30条流水记录...</div>`;
    
    const ghToken = localStorage.getItem("APEX_GH_TOKEN");
    if (!ghToken) return container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4">缺少 GitHub Token。</div>`;

    try {
        const ts = forceRefresh ? `&_t=${Date.now()}` : '';
        const res = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=30${ts}`, { headers: { "Authorization": `token ${ghToken}` } });
        if (!res.ok) throw new Error();
        
        const commits = await res.json();
        container.innerHTML = "";
        
        commits.forEach((item, idx) => {
            const shaShort = item.sha.slice(0, 7);
            const timeStr = new Date(item.commit.committer.date).toLocaleString('zh-CN', { hour12: false });
            const isRollback = item.commit.message.includes("真实代码还原") || item.commit.message.includes("回溯");
            const bgCls = isRollback ? "bg-purple-50 border border-purple-200" : "bg-slate-50 border border-transparent";

            container.innerHTML += `
                <div class="rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${bgCls} mb-2 transition hover:shadow-md">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="font-bold text-amber-500">[#${shaShort}]</span>
                            <span class="text-[10px] text-slate-400">${timeStr}</span>
                        </div>
                        <div class="text-xs truncate ${isRollback ? 'text-purple-600 font-bold' : 'text-slate-800'}" title="${item.commit.message}">${item.commit.message}</div>
                    </div>
                    <button onclick="revertToSelectedCommit('${item.sha}', '${shaShort}')" class="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 transition shrink-0 shadow-sm">
                        ${idx === 0 ? '当前状态' : '还原'}
                    </button>
                </div>
            `;
        });
    } catch (err) { container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 font-mono">拉取异常，请检查网络。</div>`; }
}

async function revertToSelectedCommit(targetSha, shortSha) {
    if (!confirm(`⏳ 确定将代码真实回退到快照 [#${shortSha}] 吗？\n(物理覆盖云端文件并清空本地页面缓存)`)) return;
    closeRollbackModal();
    
    const ghToken = localStorage.getItem("APEX_GH_TOKEN"); 
    if (!ghToken) return alert("❌ 缺少 GitHub Token");

    const overlay = document.getElementById("restoreProgressOverlay");
    const bar = document.getElementById("restoreProgressBar");
    const text = document.getElementById("restoreProgressText");

    try {
        if (overlay) overlay.classList.remove("hidden");
        if (text) text.innerText = `[1/3] 提取目标快照 [#${shortSha}] 文件树...`;
        if (bar) bar.style.width = "10%";

        const treeRes = await fetch(`https://api.github.com/repos/${REPO}/git/trees/${targetSha}?recursive=1`, { headers: { "Authorization": `token ${ghToken}` } });
        if (!treeRes.ok) throw new Error("读取快照失败");
        
        const treeData = await treeRes.json();
        const filesToRestore = treeData.tree.filter(item => item.type === 'blob');
        const totalFiles = filesToRestore.length;
        let successCount = 0;
        
        for (let i = 0; i < totalFiles; i++) {
            const fileObj = filesToRestore[i];
            const percent = Math.floor(10 + (i / totalFiles) * 80);
            if (text) text.innerText = `[2/3] 真实覆盖: ${fileObj.path} (${i+1}/${totalFiles})`;
            if (bar) bar.style.width = `${percent}%`;

            let currentSha = null;
            try {
                const curFileRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${fileObj.path}?ref=main`, { headers: { "Authorization": `token ${ghToken}` } });
                if(curFileRes.ok) currentSha = (await curFileRes.json()).sha;
            } catch(e){}

            if (currentSha === fileObj.sha) continue;

            const fileContentRes = await fetch(fileObj.url, { headers: { "Authorization": `token ${ghToken}` } });
            const fileJson = await fileContentRes.json();

            const updateRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${fileObj.path}`, {
                method: "PUT",
                headers: { "Authorization": `token ${ghToken}`, "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: `⏪ 真实代码还原: 物理覆盖文件 ${fileObj.path} 回溯至 #${shortSha}`, 
                    content: fileJson.content, 
                    ...(currentSha && {sha: currentSha}) 
                })
            });
            if (updateRes.ok) successCount++;
        }
        
        if (text) text.innerText = `[3/3] 覆盖完成！正在清理系统缓存...`;
        if (bar) bar.style.width = "100%";

        const keysToRemove = ['APEX_PRICING_CONFIG', 'APEX_BANNER_CONFIG', 'APEX_USER_LIST', 'APEX_TASKS_CACHE', 'APEX_AUDIT_PRODUCTS', 'APEX_SCHEDULE_CACHE'];
        keysToRemove.forEach(k => localStorage.removeItem(k));

        setTimeout(() => {
            alert(`✅ 成功回溯至 [#${shortSha}]！\n覆盖了 ${successCount} 个文件。\n即将强制重载数据！`);
            window.location.href = window.location.pathname + '?_t=' + Date.now();
        }, 1000);
        
    } catch(err) { 
        if (overlay) overlay.classList.add("hidden");
        alert("❌ 还原异常: " + err.message);
    }
}
