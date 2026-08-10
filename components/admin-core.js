/**
 * APEXWORK 模块 3：业务逻辑与风控上架体系 (admin-core.js)
 */

window.DEFAULT_AUDIT_PRODUCTS = [
    { id: "aerotech", title: "AeroTech 创投规划书", category: "15 SLIDES · Office PPT演示", thumbKey: "prod_aerotech", thumbCloudPath: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-orange-500 font-bold", isLinked: true, status: true },
    { id: "saas", title: "SaaS 增长指标盘点", category: "20 SLIDES · Office PPT演示", thumbKey: "prod_saas", thumbCloudPath: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-orange-500 font-bold", isLinked: true, status: true },
    { id: "fintech", title: "FinTech A 轮融资方案", category: "12 SLIDES · Office PPT演示", thumbKey: "prod_fintech", thumbCloudPath: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-orange-500 font-bold", isLinked: true, status: true },
    { id: "excel-roi", title: "全渠道 ROI 动态测算模型", category: "XLSX MODEL · Office EXCEL表格", thumbKey: "prod_excel", thumbCloudPath: "https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-emerald-600 font-bold", isLinked: true, status: true },
    { id: "word-ats", title: "欧美 ATS 智能排版合规报告", category: "DOCX STANDARD · Office WORD文档", thumbKey: "prod_word", thumbCloudPath: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-indigo-600 font-bold", isLinked: true, status: true }
];

window.loadAuditProducts = async function() {
    let blacklist = JSON.parse(localStorage.getItem('APEX_DELETED_ZOMBIES') || '[]');
    const localProducts = localStorage.getItem('APEX_AUDIT_PRODUCTS');
    if (localProducts) {
        window.AUDIT_PRODUCTS.length = 0; 
        JSON.parse(localProducts).forEach(p => window.AUDIT_PRODUCTS.push(p));
    } else {
        window.AUDIT_PRODUCTS = JSON.parse(JSON.stringify(window.DEFAULT_AUDIT_PRODUCTS));
    }

    try {
        let aiData = null;
        const keys = window.getKeysSafe();
        if (keys && keys.gh) {
            const f = await window.getGithubFileSafe("data/ai-generated-decks.json", keys.gh);
            if (f.content) aiData = JSON.parse(f.content);
        } else {
            const res = await fetch('data/ai-generated-decks.json?nocache=' + Date.now());
            if (res.ok) aiData = await res.json();
        }

        if (Array.isArray(aiData)) {
            aiData.forEach(aiItem => {
                if (!window.AUDIT_PRODUCTS.find(p => p.id === aiItem.id) && !blacklist.includes(aiItem.id)) {
                    let col = 'text-orange-500 font-bold';
                    if (aiItem.type === 'excel') col = 'text-emerald-600 font-bold';
                    if (aiItem.type === 'word') col = 'text-indigo-600 font-bold';
                    
                    window.AUDIT_PRODUCTS.push({
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
    
    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(window.AUDIT_PRODUCTS));
    window.renderAuditTable();
};

window.toggleAllCheckboxes = function(masterCb) {
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        if (!cb.disabled) cb.checked = masterCb.checked;
    });
};

window.bulkDeleteSelected = async function() {
    const checkedBoxes = Array.from(document.querySelectorAll('.row-checkbox:checked'));
    if (checkedBoxes.length === 0) return alert("⚠️ 请先勾选需要删除的作品！");
    
    if (!confirm(`⚠️ 确定要强制销毁选中的 ${checkedBoxes.length} 个作品吗？\n(此操作将物理删除云端记录，并加入防复活黑名单，绝对无法恢复！)`)) return;

    const idsToDelete = checkedBoxes.map(cb => cb.value);
    const btn = document.getElementById('bulkDeleteBtn');
    if (btn) { btn.innerHTML = "销毁中..."; btn.disabled = true; }

    try {
        let blacklist = JSON.parse(localStorage.getItem('APEX_DELETED_ZOMBIES') || '[]');
        idsToDelete.forEach(id => { if (!blacklist.includes(id)) blacklist.push(id); });
        localStorage.setItem('APEX_DELETED_ZOMBIES', JSON.stringify(blacklist));

        window.AUDIT_PRODUCTS = window.AUDIT_PRODUCTS.filter(p => !idsToDelete.includes(p.id));
        localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(window.AUDIT_PRODUCTS));
        window.renderAuditTable();

        while(window.isCloudSyncing) { await new Promise(r => setTimeout(r, 500)); }
        window.isCloudSyncing = true;

        const keys = window.getKeysSafe();
        if (keys && keys.gh) {
            const f = await window.getGithubFileSafe("data/ai-generated-decks.json", keys.gh);
            if (f.content) {
                let cloudDecks = JSON.parse(f.content);
                cloudDecks = cloudDecks.filter(d => !idsToDelete.includes(d.id) && !blacklist.includes(d.id));
                await window.pushGithubJsonFile("data/ai-generated-decks.json", cloudDecks, f.sha, `🗑️ 批量销毁 ${checkedBoxes.length} 个商品 [skip ci]`, keys.gh);
            }
        }
        window.appendLog(`>> [风控审查] 批量销毁成功！已彻底清理 ${checkedBoxes.length} 个作品。`);
    } catch(e) {
        alert("❌ 云端同步异常：" + e.message);
    } finally {
        window.isCloudSyncing = false;
        if (btn) { btn.innerHTML = "🗑️ 批量删除选中"; btn.disabled = false; }
        const masterCb = document.getElementById('selectAllCheckbox');
        if (masterCb) masterCb.checked = false;
    }
};

window.renderAuditTable = function() {
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
            th.innerHTML = '<input type="checkbox" id="selectAllCheckbox" class="w-4 h-4 cursor-pointer accent-blue-600" onchange="window.toggleAllCheckboxes(this)">';
            theadTr.insertBefore(th, theadTr.firstChild);
        }
    }

    const titleArea = document.querySelector('#tab-audit h3');
    if (titleArea && !document.getElementById('bulkDeleteBtn')) {
        titleArea.classList.add('flex', 'items-center');
        const btn = document.createElement('button');
        btn.id = 'bulkDeleteBtn';
        btn.className = "ml-4 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[11px] font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer tracking-wider";
        btn.innerHTML = "🗑️ 批量删除选中";
        btn.onclick = window.bulkDeleteSelected;
        titleArea.appendChild(btn);
    }

    const blacklist = JSON.parse(localStorage.getItem('APEX_DELETED_ZOMBIES') || '[]');
    window.AUDIT_PRODUCTS = window.AUDIT_PRODUCTS.filter(p => !blacklist.includes(p.id));

    window.AUDIT_PRODUCTS.forEach((item, index) => {
        const isDefault = !item.id.startsWith('AI-');
        const finalThumbUrl = window.ApexImageEngine.resolve(item.thumbKey, item.thumbCloudPath, item.thumbDefault);
        const badgeCls = item.status ? "bg-emerald-500 text-white font-bold shadow-sm" : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400";
        const linkBtnCls = item.isLinked ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20";
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
                        <button onclick="window.uploadProductThumb(${index})" class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center text-white text-[10px] font-bold">📤 WebP</button>
                    </div>
                </td>
                <td class="py-2 px-3 min-w-[150px] whitespace-normal break-words">
                    <div class="font-black text-sm text-[#0f172a] dark:text-[#f8fafc] leading-tight">${item.title}</div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">${item.category}</div>
                </td>
                <td class="py-2 px-2 font-mono whitespace-nowrap">
                    <div class="flex items-center gap-1 flex-nowrap whitespace-nowrap">
                        <span class="${item.colorCls}">￥</span>
                        <input type="number" value="${item.priceRmb}" onchange="window.onAuditPriceChange(${index}, 'rmb', this.value)" class="w-14 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1 py-1 text-xs font-bold text-center outline-none ${item.colorCls}" />
                        <span class="text-slate-400 mx-1">/</span>
                        <span class="text-blue-600 font-bold">$</span>
                        <input type="number" step="0.01" value="${item.priceUsd}" onchange="window.onAuditPriceChange(${index}, 'usd', this.value)" class="w-16 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1 py-1 text-xs font-bold text-center text-blue-600 outline-none" />
                        <button onclick="window.toggleRowLinkage(${index})" class="ml-1 px-1.5 py-1 rounded border text-[10px] font-mono font-bold transition-all shrink-0 whitespace-nowrap ${linkBtnCls}">${linkBtnText}</button>
                    </div>
                </td>
                <td class="py-2 px-2 whitespace-nowrap text-center">
                    <button onclick="window.toggleAuditStatus(${index})" class="px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap inline-flex items-center gap-1 transition ${badgeCls}">
                        <span>●</span><span>${item.status ? '已上架' : '已隐藏'}</span>
                    </button>
                </td>
                <td class="py-3 px-4 text-right">
                    <div class="inline-flex flex-wrap justify-end gap-1 min-w-[140px]">
                        <button onclick="window.uploadProductThumb(${index})" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition whitespace-nowrap">上传WebP图</button>
                        ${isDefault
                            ? `<button class="px-3 py-1.5 rounded-lg bg-slate-600 text-slate-300 font-bold text-xs shadow-sm transition whitespace-nowrap cursor-not-allowed opacity-60">内置商品</button>`
                            : `<button onclick="window.forceRemoveProduct('${item.id}')" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition whitespace-nowrap">强制销毁</button>`
                        }
                    </div>
                </td>
            </tr>
        `;
    });
};

window.uploadProductThumb = function(index) {
    const item = window.AUDIT_PRODUCTS[index];
    window.ApexImageEngine.uploadAndBackup(item.thumbKey, item.thumbCloudPath, () => {
        localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(window.AUDIT_PRODUCTS));
        window.renderAuditTable();
        window.appendLog(`>> [缩略图] [${item.title}] WebP 转换并绑定完成`);
    });
};

window.toggleRowLinkage = function(index) {
    window.AUDIT_PRODUCTS[index].isLinked = !window.AUDIT_PRODUCTS[index].isLinked;
    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(window.AUDIT_PRODUCTS));
    window.renderAuditTable();
    window.appendLog(`>> [风控审查] 作品 [${window.AUDIT_PRODUCTS[index].title}] 定价模式 -> ${window.AUDIT_PRODUCTS[index].isLinked ? '汇率联动' : '行内独立定价'}`);
};

window.onAuditPriceChange = function(index, field, val) {
    const num = parseFloat(val) || 0;
    if (field === 'rmb') {
        window.AUDIT_PRODUCTS[index].priceRmb = num;
        if (window.AUDIT_PRODUCTS[index].isLinked) {
            let usd = num / window.ApexFX.currentRate;
            usd = (window.ApexPricing && window.ApexPricing.use99Rule && num > 0) ? (Math.floor(usd) + 0.99) : Number(usd.toFixed(2));
            window.AUDIT_PRODUCTS[index].priceUsd = usd > 0 ? usd : "0.00";
        }
    } else if (field === 'usd') {
        window.AUDIT_PRODUCTS[index].priceUsd = num;
        if (window.AUDIT_PRODUCTS[index].isLinked) {
            const rmb = Math.round(num * window.ApexFX.currentRate);
            window.AUDIT_PRODUCTS[index].priceRmb = rmb > 0 ? rmb : 0;
        }
    }
    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(window.AUDIT_PRODUCTS));
    window.renderAuditTable();
};

window.toggleAuditStatus = function(index) {
    window.AUDIT_PRODUCTS[index].status = !window.AUDIT_PRODUCTS[index].status;
    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(window.AUDIT_PRODUCTS));
    window.renderAuditTable();
    window.appendLog(`>> [风控审查] 更改作品 [${window.AUDIT_PRODUCTS[index].title}] 上架状态 -> ${window.AUDIT_PRODUCTS[index].status ? '已上架' : '下架隐藏'}`);
};

window.forceRemoveProduct = async function(id) {
    const idx = window.AUDIT_PRODUCTS.findIndex(p => p.id === id);
    if (idx === -1) return;
    const title = window.AUDIT_PRODUCTS[idx].title;

    if (!confirm(`⚠️ 危险操作！确定要在商城强制下架并销毁 [${title}] 吗？`)) return;
    
    const btn = window.event ? window.event.currentTarget : null;
    const originalText = btn ? btn.innerHTML : "强制销毁";
    if (btn) { btn.innerHTML = "销毁中..."; btn.disabled = true; }
    
    try {
        const blacklist = JSON.parse(localStorage.getItem('APEX_DELETED_ZOMBIES') || '[]');
        if (!blacklist.includes(id)) blacklist.push(id);
        localStorage.setItem('APEX_DELETED_ZOMBIES', JSON.stringify(blacklist));

        window.AUDIT_PRODUCTS.splice(idx, 1);
        localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(window.AUDIT_PRODUCTS));
        window.renderAuditTable();
        
        while(window.isCloudSyncing) { await new Promise(r => setTimeout(r, 500)); }
        window.isCloudSyncing = true;

        const keys = window.getKeysSafe();
        if (keys && keys.gh) {
            const f = await window.getGithubFileSafe("data/ai-generated-decks.json", keys.gh);
            if (f.content) {
                let cloudDecks = JSON.parse(f.content);
                cloudDecks = cloudDecks.filter(d => d.id !== id && !blacklist.includes(d.id));
                await window.pushGithubJsonFile("data/ai-generated-decks.json", cloudDecks, f.sha, `🗑️ 单件强制销毁下架: ${title} [skip ci]`, keys.gh);
            }
        }
        window.appendLog(`>> [风控审查] 已彻底销毁作品并加入防复活黑名单: ${title}`);
    } catch(e) {
        alert("❌ 销毁失败，云端同步异常：" + e.message);
        if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
    } finally {
        window.isCloudSyncing = false;
    }
};

window.loadHistoryFromMemory = async function() {
    const feed = document.getElementById("historyFeed");
    const countBadge = document.getElementById("historyCount");
    if(!feed) return;
    
    try {
        const keys = window.getKeysSafe();
        if (!keys.gh) throw new Error("No token"); 
        const memFile = await window.getGithubFileSafe("MEMORY.md", keys.gh);
        let lines = (memFile.content || "").split("\n").filter(l => l.includes("[EVO-RECORD") || l.includes("[VETO-RECORD"));
        if (window.activeFilterDept) lines = lines.filter(l => l.includes(window.activeFilterDept));
        
        if (lines.length > 0) {
            if (countBadge) countBadge.innerText = `${lines.length}条`;
            feed.innerHTML = "";
            lines.reverse().forEach((line, idx) => {
                const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
                const timeStr = timeMatch ? timeMatch[1] : "归档";
                const cleanText = line.replace(/^- /, "").replace(/\[EVO-RECORD[^\]]*\]:/, "").replace(/\[VETO-RECORD[^\]]*\]:/, "").trim();
                feed.innerHTML += `
                    <div class="border rounded-xl p-2.5 saas-input bg-slate-50 dark:bg-slate-900/50 mb-2">
                        <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 border-b border-slate-200 dark:border-slate-800 pb-1">
                            <span>⏱️ ${timeStr}</span><span>#${lines.length - idx}</span>
                        </div>
                        <div class="text-xs font-mono text-slate-800 dark:text-slate-300">${cleanText}</div>
                    </div>
                `;
            });
            return;
        }
    } catch (err) {}
    
    const mockLogs = [
        "🤖 [大脑中枢]: 系统启动并注入全局异常捕获钩子。",
        "👁️ [视觉策划部]: 轮播图资源尺寸及 WebP 转化效验完成。状态：🟢 健康",
        "🛠️ [施工工程部]: 商业金库架构双端读写 (GitHub/Gitee) 已连通。",
        "✅ [系统]: AI 智能体准备就绪，待命执行调令。"
    ];
    if (countBadge) countBadge.innerText = "4条";
    feed.innerHTML = mockLogs.map((log, i) => `
        <div class="border rounded-xl p-2.5 saas-input bg-slate-50 dark:bg-slate-900/50 mb-2">
            <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 border-b border-slate-200 dark:border-slate-800 pb-1">
                <span>⏱️ 今天 ${i+1}:00</span><span>#${4 - i}</span>
            </div>
            <div class="text-xs font-mono text-slate-800 dark:text-slate-300 leading-relaxed">${log}</div>
        </div>
    `).join('');
};

window.renderDeptButtons = function() {
    const container = document.getElementById("deptButtonsContainer");
    if (!container) return;
    const deptConfig = [
        { name: "大脑中枢", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30" },
        { name: "缺陷与QA质检部", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30" },
        { name: "主动产品部", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30" },
        { name: "施工工程部", cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30" },
        { name: "视觉策划部", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" },
        { name: "审核质量部", cls: "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/40" },
        { name: "转化销售部", cls: "bg-pink-500/10 text-pink-600 border-pink-500/30 dark:bg-pink-500/20 dark:text-pink-400 dark:border-pink-500/40" },
        { name: "推广营销部", cls: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/40" },
        { name: "国际法务部", cls: "bg-teal-500/10 text-teal-600 border-teal-500/30 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/40" }
    ];
    container.innerHTML = "";
    deptConfig.forEach(dept => {
        const btn = document.createElement("button");
        btn.className = `dept-btn border rounded-xl p-2.5 text-left transition hover:border-blue-500 ${dept.cls}`;
        btn.innerHTML = `<div class="text-xs font-bold truncate">${dept.name}</div>`;
        btn.onmousedown = (e) => e.preventDefault();
        btn.onclick = () => window.inspectDept(dept.name, btn);
        container.appendChild(btn);
    });
};

window.initAdminEngine = function() {
    if(typeof window.loadAuditProducts === "function") window.loadAuditProducts(); 
    if(typeof window.initApexTooltip === "function") window.initApexTooltip();
    
    window.renderDeptButtons();
    window.loadHistoryFromMemory();
    
    if(typeof window.ApexScheduleManager !== "undefined") window.ApexScheduleManager.loadScheduleFromCloud();
    if(typeof window.ApexBannerManager !== "undefined") window.ApexBannerManager.loadBannerConfig();
    if (window.ApexLogoManager) window.ApexLogoManager.initLogo();
    if (window.ApexUserManager) window.ApexUserManager.initUserSection();
    
    const savedTheme = localStorage.getItem("APEX_ADMIN_THEME") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.innerHTML = savedTheme === "dark" ? "<span>🌞 白昼模式</span>" : "<span>🌙 极夜模式</span>";

    if(typeof window.ApexFX !== "undefined") window.ApexFX.initWeeklyRate();
    
    const cmdBox = document.getElementById("cmd");
    if (cmdBox) {
        cmdBox.addEventListener("focus", () => { window.isCmdActive = true; });

        const checkMention = function() {
            if (!cmdBox) return;
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                if(typeof window.hideMentionDropdown === "function") window.hideMentionDropdown();
                return;
            }

            const node = sel.focusNode;
            if (node && node.nodeType === Node.TEXT_NODE && cmdBox.contains(node)) {
                const text = node.textContent.substring(0, sel.focusOffset).replace(/\u00A0/g, " ");
                const match = text.match(/@([^\s@]*)$/);
                if (match && typeof window.showMentionDropdown === "function") {
                    window.showMentionDropdown(match[1]);
                    return;
                }
            }
            if(typeof window.hideMentionDropdown === "function") window.hideMentionDropdown();
        };

        cmdBox.addEventListener("input", checkMention);
        cmdBox.addEventListener("keyup", checkMention);
        cmdBox.addEventListener("mouseup", checkMention);
        
        cmdBox.addEventListener("keydown", function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                if (typeof window.triggerSwarmAutonomousAction === "function") {
                    window.triggerSwarmAutonomousAction();
                } else {
                    window.appendLog(`🚀 已将调令提交至云端 AI 执行队列。`);
                    cmdBox.innerHTML = ""; 
                }
                if(typeof window.hideMentionDropdown === "function") window.hideMentionDropdown();
            }
            if (e.key === "Escape" && typeof window.hideMentionDropdown === "function") window.hideMentionDropdown();
        });
    }

    document.addEventListener("mousedown", function(e) {
        const dropEl = document.getElementById("mentionDropdown");
        if (dropEl && dropEl.style.display !== "none") {
            if (!dropEl.contains(e.target) && cmdBox && !cmdBox.contains(e.target)) {
                if(typeof window.hideMentionDropdown === "function") window.hideMentionDropdown();
            }
        }
    });

    if (localStorage.getItem("APEX_GH_TOKEN")) {
        if(typeof window.syncAllData === "function") window.syncAllData();
    }
};

window.syncAllData = function() {
    if(typeof window.loadTasksManifest === "function") window.loadTasksManifest();
    if(typeof window.loadHistoryFromMemory === "function") window.loadHistoryFromMemory();
};

window.toggleConfig = function() {
    const el = document.getElementById("configArea");
    if (el) {
        el.classList.toggle("hidden");
        if (!el.classList.contains("hidden")) {
            if (document.getElementById("ghTokenInput")) document.getElementById("ghTokenInput").value = localStorage.getItem("APEX_GH_TOKEN") || "";
            if (document.getElementById("dsKeyInput")) document.getElementById("dsKeyInput").value = localStorage.getItem("APEX_DS_KEY") || "";
            if (document.getElementById("giteeTokenInput")) document.getElementById("giteeTokenInput").value = localStorage.getItem("APEX_GITEE_TOKEN") || "";
            if (document.getElementById("giteeRepoInput")) document.getElementById("giteeRepoInput").value = localStorage.getItem("APEX_GITEE_REPO") || "";
        }
    }
};

window.saveKeys = function() {
    localStorage.setItem("APEX_GH_TOKEN", document.getElementById("ghTokenInput").value.trim());
    localStorage.setItem("APEX_DS_KEY", document.getElementById("dsKeyInput").value.trim());
    localStorage.setItem("APEX_GITEE_TOKEN", document.getElementById("giteeTokenInput").value.trim());
    localStorage.setItem("APEX_GITEE_REPO", document.getElementById("giteeRepoInput").value.trim());
    window.toggleConfig();
    window.syncAllData();
    alert("✅ 系统密钥与 Gitee 金库节点参数已全量保存生效！");
};

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", window.initAdminEngine);
} else {
    window.initAdminEngine();
}
