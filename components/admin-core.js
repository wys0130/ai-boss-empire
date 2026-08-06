const REPO = "wys0130/ai-boss-empire";
let activeFilterDept = "";
let rawManifestTasks = [];
let currentManifestFilter = 'ALL';
let isCmdActive = false;

window.switchAdminTab = function(tabId) {
    const tabs = ['audit', 'config', 'overview', 'swarm'];
    const titles = {
        'audit': '业务控制台 / 作品风控审查与上架',
        'config': '业务控制台 / 主页轮播图与定价中心',
        'overview': '业务控制台 / 阶段开发工单进度书',
        'swarm': '业务控制台 / AI 智能体夜间排班与调令中心'
    };

    tabs.forEach(id => {
        const sectionEl = document.getElementById(`tab-${id}`);
        const navEl = document.getElementById(`nav-${id}`);
        if (sectionEl) sectionEl.classList.toggle('hidden', id !== tabId);
        if (navEl) navEl.classList.toggle('active', id !== tabId);
    });

    const headerTitle = document.getElementById('pageHeaderTitle');
    if (headerTitle) headerTitle.innerText = titles[tabId] || '业务控制台 / APEXWORK PRO';
};

// 👑 自动同步与读取云端排班时间表 (config/ai-schedule.json)
window.ApexScheduleManager = {
    loadScheduleFromCloud: async function() {
        try {
            const token = localStorage.getItem("APEX_GH_TOKEN");
            if (!token) return;
            const fileObj = await getGithubFileSafe("config/ai-schedule.json", token);
            if (fileObj.content) {
                const sched = JSON.parse(fileObj.content);
                if (document.getElementById("sched-start")) document.getElementById("sched-start").value = sched.start_hour || 0;
                if (document.getElementById("sched-end")) document.getElementById("sched-end").value = sched.end_hour || 8;
                if (document.getElementById("sched-enabled")) document.getElementById("sched-enabled").value = String(sched.enabled !== false);
            }
        } catch (e) {
            console.log("云端尚无自定义时间表，沿用默认 0-8 点配置。");
        }
    },

    saveScheduleToCloud: async function() {
        const start = Number(document.getElementById("sched-start").value) || 0;
        const end = Number(document.getElementById("sched-end").value) || 8;
        const enabled = document.getElementById("sched-enabled").value === "true";
        
        const payload = {
            start_hour: start,
            end_hour: end,
            enabled: enabled,
            updated_at: new Date().toISOString()
        };

        try {
            const keys = getKeys();
            const fileObj = await getGithubFileSafe("config/ai-schedule.json", keys.gh);
            await pushGithubFile(
                "config/ai-schedule.json",
                JSON.stringify(payload, null, 2),
                fileObj.sha,
                `⏱️ Config: 更新 AI 夜间自主排班时段 -> 北京时间 [${start}:00 - ${end}:00] [skip ci]`,
                keys.gh
            );
            alert(`✅ 排班表写入成功！\n\nAI 自主运行区间已被限定为北京时间 [${start}:00 至 ${end}:00]。\n白天非此区间，自动定时器直接静默退场；你在网页对话或发号施令依旧可以全天候秒起！`);
        } catch (e) {
            alert("❌ 同步时间表失败: " + e.message);
        }
    }
};

const AUDIT_PRODUCTS = [
    {
        id: "aerotech",
        title: "AeroTech 创投规划书",
        category: "15 SLIDES · Office PPT 战略套件",
        thumb: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=300&q=80",
        priceRmb: 69,
        priceUsd: "9.99",
        colorCls: "text-orange-600 font-bold",
        status: true
    },
    {
        id: "saas",
        title: "SaaS 增长指标盘点",
        category: "20 SLIDES · Office PPT OKR战略",
        thumb: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80",
        priceRmb: 69,
        priceUsd: "9.99",
        colorCls: "text-orange-600 font-bold",
        status: true
    },
    {
        id: "fintech",
        title: "FinTech A 轮融资方案",
        category: "12 SLIDES · Office PPT 金融路演",
        thumb: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80",
        priceRmb: 69,
        priceUsd: "9.99",
        colorCls: "text-orange-600 font-bold",
        status: true
    },
    {
        id: "excel",
        title: "全渠道 ROI 动态自适应测算模型",
        category: "XLSX MODEL · Office Excel 财务测算",
        thumb: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80",
        priceRmb: 69,
        priceUsd: "9.99",
        colorCls: "text-emerald-600 font-bold",
        status: true
    },
    {
        id: "word",
        title: "欧美企业级 ATS 智能排版合规报告",
        category: "DOCX STANDARD · Office Word 合规",
        thumb: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=300&q=80",
        priceRmb: 69,
        priceUsd: "9.99",
        colorCls: "text-indigo-600 font-bold",
        status: true
    }
];

window.renderAuditTable = function() {
    const tbody = document.getElementById("auditTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    AUDIT_PRODUCTS.forEach((item, index) => {
        const badgeCls = item.status 
            ? "bg-emerald-500 text-white font-bold" 
            : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400";
        const badgeText = item.status ? "已上架 ●" : "已隐藏 ○";

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                <td class="py-3 px-4">
                    <img src="${item.thumb}" alt="快照" class="w-12 h-16 object-cover rounded-lg border border-slate-200 shadow-sm" />
                </td>
                <td class="py-3 px-4">
                    <div class="font-bold text-sm">${item.title}</div>
                    <div class="text-xs text-slate-400 font-mono mt-0.5">${item.category}</div>
                </td>
                <td class="py-3 px-4 font-mono">
                    <span class="${item.colorCls}">￥${item.priceRmb}</span> / <span class="text-blue-600 font-bold">$${item.priceUsd} USD</span>
                </td>
                <td class="py-3 px-4">
                    <button onclick="toggleAuditStatus(${index})" class="px-3 py-1 rounded-full text-xs transition ${badgeCls}">
                        ${badgeText}
                    </button>
                </td>
                <td class="py-3 px-4 text-right space-x-1.5">
                    <button onclick="alert('✏️ 进入微调参数：[${item.title}]')" class="px-2.5 py-1 rounded-lg border border-slate-300 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        参数配置
                    </button>
                    <button onclick="forceRemoveProduct(${index})" class="px-2.5 py-1 rounded-lg border border-rose-500/50 text-rose-600 text-xs hover:bg-rose-500/10 transition font-bold">
                        强制销毁
                    </button>
                </td>
            </tr>
        `;
    });
};

window.toggleAuditStatus = function(index) {
    AUDIT_PRODUCTS[index].status = !AUDIT_PRODUCTS[index].status;
    renderAuditTable();
    appendLog(`>> [风控审查] 更改作品 [${AUDIT_PRODUCTS[index].title}] 上架状态 -> ${AUDIT_PRODUCTS[index].status ? '已上架' : '下架隐藏'}`);
};

window.forceRemoveProduct = function(index) {
    if (!confirm(`⚠️ 危险操作！确定要在商城强制下架并销毁 [${AUDIT_PRODUCTS[index].title}] 吗？`)) return;
    const title = AUDIT_PRODUCTS[index].title;
    AUDIT_PRODUCTS.splice(index, 1);
    renderAuditTable();
    appendLog(`>> [风控审查] 已销毁作品: ${title}`);
};

window.toggleThemeMode = function() {
    const htmlEl = document.documentElement;
    const current = htmlEl.getAttribute("data-theme") || "light";
    const target = current === "light" ? "dark" : "light";
    htmlEl.setAttribute("data-theme", target);
    localStorage.setItem("APEX_ADMIN_THEME", target);
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.innerHTML = target === "dark" ? "<span>🌞 白昼模式</span>" : "<span>🌙 极夜模式</span>";
};

window.ApexBannerManager = {
    saveBannerConfig: function() {
        const config = [
            {
                tag: document.getElementById('banner-tag-0').value,
                title: document.getElementById('banner-title-0').value,
                desc: document.getElementById('banner-desc-0').value
            },
            {
                tag: document.getElementById('banner-tag-1').value,
                title: document.getElementById('banner-title-1').value,
                desc: document.getElementById('banner-desc-1').value
            }
        ];
        localStorage.setItem('APEX_BANNER_CONFIG', JSON.stringify(config));
        alert('✅ 轮播图大图文案已成功保存！前台商城两张横幅将绝对独立、不并排地展示！');
    }
};

window.ApexFX = {
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
    forceRefreshRate: async function() {
        const badge = document.getElementById("fxRateBadge");
        if (badge) badge.innerText = "向央行查汇中...";
        try {
            const res = await fetch("https://open.er-api.com/v6/latest/USD");
            const data = await res.json();
            if (data && data.rates && data.rates.CNY) {
                this.currentRate = Number(data.rates.CNY).toFixed(2);
                localStorage.setItem("APEX_FX_RATE_CACHE", JSON.stringify({
                    rate: this.currentRate,
                    timestamp: Date.now()
                }));
                this.updateBadge(this.currentRate, true);
                appendLog(`>> [汇率中台] 抓取最新外汇：1 USD = ${this.currentRate} CNY`);
                return;
            }
        } catch (err) {
            appendLog(`>> [汇率中台] 查询超时，沿用缓存：1 USD = ${this.currentRate} CNY`);
        }
        this.updateBadge(this.currentRate, false);
    },
    updateBadge: function(rate, isFresh) {
        const badge = document.getElementById("fxRateBadge");
        if (badge) badge.innerText = `1 : ${rate} ${isFresh ? '(最新)' : ''}`;
    }
};

window.ApexPricing = {
    isLinked: true,
    use99Rule: true,

    toggleLinkage: function() {
        this.isLinked = !this.isLinked;
        const btn = document.getElementById("btnToggleLink");
        const icons = ["bundle", "ppt", "excel", "word"];
        if (this.isLinked) {
            btn.className = "px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/30 transition";
            btn.innerText = "🔗 汇率关联: 已绑定";
            icons.forEach(k => {
                const el = document.getElementById(`linkIcon-${k}`);
                if (el) { el.innerText = "⇄"; el.className = "text-xs text-emerald-500 font-bold"; }
            });
            appendLog(`>> [定价控制] 开启关联：任意修改将按汇率 1 : ${ApexFX.currentRate} 互转。`);
        } else {
            btn.className = "px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/30 transition";
            btn.innerText = "🔓 汇率关联: 已解绑";
            icons.forEach(k => {
                const el = document.getElementById(`linkIcon-${k}`);
                if (el) { el.innerText = "‖"; el.className = "text-xs text-slate-400"; }
            });
            appendLog(`>> [定价控制] 关闭关联：双方完全独立填写。`);
        }
    },

    toggle99Rule: function() {
        this.use99Rule = !this.use99Rule;
        const btn = document.getElementById("btnToggle99");
        btn.innerText = `✨ .99尾数: ${this.use99Rule ? '开启' : '关闭'}`;
        btn.className = `px-3 py-1.5 rounded-lg font-bold border transition ${this.use99Rule ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`;
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

    saveAllToStorage: function() {
        const config = {
            bundle: { rmb: document.getElementById('rmb-bundle').value, usd: document.getElementById('usd-bundle').value },
            ppt: { rmb: document.getElementById('rmb-ppt').value, usd: document.getElementById('usd-ppt').value },
            excel: { rmb: document.getElementById('rmb-excel').value, usd: document.getElementById('usd-excel').value },
            word: { rmb: document.getElementById('rmb-word').value, usd: document.getElementById('usd-word').value },
            rate: ApexFX.currentRate,
            isLinked: this.isLinked,
            use99Rule: this.use99Rule,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('APEX_PRICING_CONFIG', JSON.stringify(config));
        alert('✅ 商品定价已锁存完毕！');
    }
};

const deptConfig = [
    { name: "大脑中枢", cls: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
    { name: "缺陷与QA质检部", cls: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
    { name: "主动产品部", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
    { name: "施工工程部", cls: "bg-sky-500/10 text-sky-600 border-sky-500/30" },
    { name: "视觉策划部", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
    { name: "审核质量部", cls: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
    { name: "转化销售部", cls: "bg-pink-500/10 text-pink-600 border-pink-500/30" },
    { name: "推广营销部", cls: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30" },
    { name: "国际法务部", cls: "bg-teal-500/10 text-teal-600 border-teal-500/30" }
];

window.openLiveSiteForceBypass = function() {
    window.open(`https://wys0130.github.io/ai-boss-empire/?nocache=${Date.now()}`, '_blank');
};

function initAdminEngine() {
    initApexTooltip();
    renderDeptButtons();
    renderAuditTable();
    ApexScheduleManager.loadScheduleFromCloud(); // 👑 读取当前设定的夜间时段
    
    const savedTheme = localStorage.getItem("APEX_ADMIN_THEME") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.innerHTML = savedTheme === "dark" ? "<span>🌞 白昼模式</span>" : "<span>🌙 极夜模式</span>";

    ApexFX.initWeeklyRate();
    
    const cmdBox = document.getElementById("cmd");
    if (cmdBox) {
        cmdBox.addEventListener("focus", () => { isCmdActive = true; });
        cmdBox.addEventListener("click", () => { isCmdActive = true; });

        cmdBox.addEventListener("input", function() {
            const sel = window.getSelection();
            if (!sel.rangeCount) return;
            const text = (sel.anchorNode.textContent || "").slice(0, sel.anchorOffset);
            const match = text.match(/@([^\s@]*)$/);
            if (match) showMentionDropdown(match[1]);
            else hideMentionDropdown();
        });

        cmdBox.addEventListener("keydown", function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                window.triggerSwarmAutonomousAction();
            }
            if (e.key === "Escape") hideMentionDropdown();
        });
    }

    if (localStorage.getItem("APEX_GH_TOKEN")) {
        window.syncAllData();
    }
}

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initAdminEngine);
} else {
    initAdminEngine();
}

window.syncAllData = function() {
    loadTasksManifest();
    loadHistoryFromMemory();
};

function initApexTooltip() {
    const tooltip = document.getElementById("apexTooltip");
    if (!tooltip) return;
    document.addEventListener("mouseover", (e) => {
        const target = e.target.closest("[data-tooltip]");
        if (target) {
            tooltip.innerText = target.getAttribute("data-tooltip");
            tooltip.classList.remove("hidden");
        }
    });
    document.addEventListener("mousemove", (e) => {
        if (!tooltip.classList.contains("hidden")) {
            tooltip.style.left = (e.clientX + 14) + "px";
            tooltip.style.top = (e.clientY + 14) + "px";
        }
    });
    document.addEventListener("mouseout", (e) => {
        if (e.target.closest("[data-tooltip]")) {
            tooltip.classList.add("hidden");
        }
    });
}

function renderDeptButtons() {
    const container = document.getElementById("deptButtonsContainer");
    if (!container) return;
    container.innerHTML = "";
    deptConfig.forEach(dept => {
        const btn = document.createElement("button");
        btn.className = `dept-btn border rounded-xl p-2.5 text-left transition hover:border-blue-500 ${dept.cls}`;
        btn.innerHTML = `<div class="text-xs font-bold truncate">${dept.name}</div>`;
        btn.onclick = () => window.inspectDept(dept.name, btn);
        container.appendChild(btn);
    });
}

window.inspectDept = function(deptName, btnEl) {
    activeFilterDept = deptName;
    document.querySelectorAll(".dept-btn").forEach(el => el.style.opacity = "0.4");
    if (btnEl) btnEl.style.opacity = "1";
    const activeLabel = document.getElementById("activeDeptLabel");
    if (activeLabel) activeLabel.innerText = `[${deptName}]`;

    const cmdBox = document.getElementById("cmd");
    if (isCmdActive && cmdBox) {
        cmdBox.focus();
        const tokenSpan = document.createElement("span");
        tokenSpan.className = "dept-token bg-blue-500/10 text-blue-600 border border-blue-500/30 px-1.5 py-0.5 rounded";
        tokenSpan.contentEditable = "false";
        tokenSpan.setAttribute("data-dept", deptName);
        tokenSpan.innerText = `@${deptName}`;

        const sel = window.getSelection();
        if (sel.rangeCount > 0 && cmdBox.contains(sel.anchorNode)) {
            const range = sel.getRangeAt(0);
            range.collapse(false);
            range.insertNode(tokenSpan);
            const space = document.createTextNode(" ");
            tokenSpan.parentNode.insertBefore(space, tokenSpan.nextSibling);
            range.setStartAfter(space);
            range.setEndAfter(space);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            cmdBox.appendChild(tokenSpan);
            cmdBox.appendChild(document.createTextNode(" "));
            cmdBox.scrollTop = cmdBox.scrollHeight;
        }
        appendLog(`🎯 追加指令 @${deptName}`);
    } else {
        appendLog(`🔍 视图切换 -> [${deptName}] (未点击聚焦文本框，不追加词条)`);
    }

    loadHistoryFromMemory();
};

window.resetDeptFilter = function() {
    activeFilterDept = "";
    isCmdActive = false;
    document.querySelectorAll(".dept-btn").forEach(el => el.style.opacity = "1");
    const activeLabel = document.getElementById("activeDeptLabel");
    if (activeLabel) activeLabel.innerText = `[全景视图]`;
    const cmdBox = document.getElementById("cmd");
    if (cmdBox) cmdBox.innerHTML = "";
    appendLog(`🌐 恢复全景视角`);
    loadHistoryFromMemory();
};

async function loadTasksManifest() {
    const listEl = document.getElementById('manifestList');
    if (!listEl) return;
    try {
        const keys = getKeys();
        const fileObj = await getGithubFileSafe("TASKS_MANIFEST.json", keys.gh);
        if (!fileObj.content) {
            listEl.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 col-span-full font-mono">未找到 TASKS_MANIFEST.json</div>`;
            return;
        }
        const manifest = JSON.parse(fileObj.content);
        rawManifestTasks = manifest.tasks || [];
        const sum = manifest.summary || { completed: 0, total_tasks: 0 };
        const badge = document.getElementById('manifestSummaryBadge');
        if (badge) badge.innerText = `完成度: ${sum.completed}/${sum.total_tasks}`;
        renderManifestTasks();
    } catch (err) {
        listEl.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 col-span-full font-mono">读取错误: ${err.message}</div>`;
    }
}

window.filterManifest = function(stageKey) {
    currentManifestFilter = stageKey;
    document.querySelectorAll('.manifest-tab').forEach(btn => {
        btn.className = "manifest-tab px-3 py-1 rounded-lg text-slate-400 hover:text-slate-600";
    });
    const targetBtn = window.event?.target;
    if (targetBtn) {
        targetBtn.className = "manifest-tab px-3 py-1 rounded-lg bg-blue-600 text-white font-bold";
    }
    renderManifestTasks();
};

function renderManifestTasks() {
    const listEl = document.getElementById('manifestList');
    if (!listEl) return;
    listEl.innerHTML = "";

    const filtered = currentManifestFilter === 'ALL' 
        ? rawManifestTasks 
        : rawManifestTasks.filter(t => t.stage === currentManifestFilter || (!t.stage && currentManifestFilter === 'ALL'));

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="text-center text-xs text-slate-500 py-4 col-span-full font-mono">该阶段无对应任务</div>`;
        return;
    }

    filtered.forEach(task => {
        const isDone = task.status === 'DONE';
        const isInProg = task.status === 'IN_PROGRESS';
        let borderCls = isDone ? "border-emerald-500/40 bg-emerald-500/5 opacity-60" : "border-slate-200 dark:border-slate-800";
        let dotCls = isDone ? "bg-emerald-500" : (isInProg ? "bg-amber-400 animate-pulse" : "bg-slate-400");
        let statusText = isDone ? "已达成" : (isInProg ? "执行中" : "待落实");

        listEl.innerHTML += `
            <div class="saas-card rounded-xl p-3.5 flex flex-col justify-between transition hover:border-blue-500" 
                 data-tooltip="【工单 #${task.id}】\n目标：${task.title}\n备注：${task.notes || '无'}\n部门：${task.department}">
                <div>
                    <div class="flex items-center justify-between text-[10px] font-mono mb-1.5 text-slate-400">
                        <span class="font-bold text-blue-600">[${task.id}] · ${task.department.split('&')[0].trim()}</span>
                        <span class="flex items-center gap-1 font-medium"><i class="w-1.5 h-1.5 rounded-full ${dotCls} inline-block"></i>${statusText}</span>
                    </div>
                    <span class="text-xs font-semibold truncate mb-1 block">${task.title}</span>
                    <span class="text-[11px] text-slate-400 font-mono truncate block">${task.notes || '暂无说明'}</span>
                </div>
                <div class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end text-[10px] font-mono">
                    <button onclick="toggleTaskStatus('${task.id}')" class="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-medium transition">
                        ${isDone ? '撤销打勾' : '勾选完成'}
                    </button>
                </div>
            </div>
        `;
    });
}

window.toggleTaskStatus = async function(taskId) {
    const task = rawManifestTasks.find(t => t.id === taskId);
    if (!task) return;
    task.status = task.status === 'DONE' ? 'TODO' : 'DONE';
    appendLog(`✏️ 变更任务 -> [${taskId}] ${task.status}`);
    try {
        const keys = getKeys();
        const fileObj = await getGithubFileSafe("TASKS_MANIFEST.json", keys.gh);
        const manifest = JSON.parse(fileObj.content);
        const targetInManifest = manifest.tasks.find(t => t.id === taskId);
        if (targetInManifest) {
            targetInManifest.status = task.status;
            manifest.summary.completed = manifest.tasks.filter(t => t.status === 'DONE').length;
            manifest.summary.todo = manifest.tasks.filter(t => t.status === 'TODO').length;
            manifest.updated_at = new Date().toISOString().slice(0, 10);
            await pushGithubFile("TASKS_MANIFEST.json", JSON.stringify(manifest, null, 2), fileObj.sha, `🎯 Toggle Task [${taskId}] -> ${task.status}`, keys.gh);
            appendLog(`✅ 新版进度已直接推回 main 分支`);
            loadTasksManifest();
        }
    } catch (e) {
        appendLog(`❌ 更新异常: ${e.message}`, "text-rose-500");
    }
};

function getKeys() {
    const gh = localStorage.getItem("APEX_GH_TOKEN");
    const ds = localStorage.getItem("APEX_DS_KEY");
    if (!gh || !ds) { window.toggleConfig(); throw new Error("请在右上角填写配置密钥!"); }
    return { gh, ds };
}

window.toggleConfig = function() {
    const el = document.getElementById("configArea");
    if (el) el.classList.toggle("hidden");
};

window.saveKeys = function() {
    localStorage.setItem("APEX_GH_TOKEN", document.getElementById("ghTokenInput").value.trim());
    localStorage.setItem("APEX_DS_KEY", document.getElementById("dsKeyInput").value.trim());
    window.toggleConfig();
    window.syncAllData();
};

function utf8_to_b64(str) { return window.btoa(unescape(encodeURIComponent(str))); }
function b64_to_utf8(str) { return decodeURIComponent(escape(window.atob(str))); }

function appendLog(msg, color = "") {
    const log = document.getElementById("log");
    if (!log) return;
    if (color) log.className = `flex-1 text-[11px] font-mono ${color} p-3 saas-input rounded-xl whitespace-pre-wrap leading-relaxed overflow-y-auto custom-scroll`;
    log.innerText += `\n>> ${msg}`;
    log.scrollTop = log.scrollHeight;
}

async function getGithubFileSafe(path, token) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, { headers: { "Authorization": `token ${token}` } });
    if (!res.ok) return { content: "", sha: null };
    const data = await res.json();
    return { content: b64_to_utf8(data.content), sha: data.sha };
}

async function pushGithubFile(path, content, sha, message, token) {
    const payload = { message: message, content: utf8_to_b64(content) };
    if (sha) payload.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
        method: "PUT",
        headers: { "Authorization": `token ${token}`, "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`写回 ${path} 失败`);
    return await res.json();
}

async function loadHistoryFromMemory() {
    const feed = document.getElementById("historyFeed");
    if (!feed) return;
    try {
        const keys = getKeys();
        const memFile = await getGithubFileSafe("MEMORY.md", keys.gh);
        let lines = (memFile.content || "").split("\n").filter(l => l.includes("[EVO-RECORD") || l.includes("[VETO-RECORD"));
        if (activeFilterDept) lines = lines.filter(l => l.includes(activeFilterDept));
        const countBadge = document.getElementById("historyCount");
        if (countBadge) countBadge.innerText = `${lines.length}条`;
        if (lines.length === 0) {
            feed.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 font-mono">暂无日志</div>`;
            return;
        }
        feed.innerHTML = "";
        lines.reverse().forEach((line, idx) => {
            const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
            const timeStr = timeMatch ? timeMatch[1] : "归档";
            const cleanText = line.replace(/^- /, "").replace(/\[EVO-RECORD[^\]]*\]:/, "").replace(/\[VETO-RECORD[^\]]*\]:/, "").trim();
            feed.innerHTML += `
                <div class="border rounded-xl p-2.5 saas-input">
                    <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 border-b pb-1">
                        <span>⏱️ ${timeStr}</span><span>#${lines.length - idx}</span>
                    </div>
                    <div class="text-xs font-mono">${cleanText}</div>
                </div>
            `;
        });
    } catch (err) {
        feed.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 font-mono">读取异常</div>`;
    }
}

window.openRollbackModal = function() {
    const el = document.getElementById("rollbackModal");
    if (el) el.classList.remove("hidden");
    fetchCommitHistory();
};

window.closeRollbackModal = function() {
    const el = document.getElementById("rollbackModal");
    if (el) el.classList.add("hidden");
};

async function fetchCommitHistory() {
    const container = document.getElementById("commitListContainer");
    if (!container) return;
    container.innerHTML = `<div class="text-center text-xs text-slate-400 py-4 font-mono">获取发布快照中...</div>`;
    try {
        const keys = getKeys();
        const res = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=10`, { headers: { "Authorization": `token ${keys.gh}` } });
        const commits = await res.json();
        container.innerHTML = "";
        commits.forEach((item, idx) => {
            const shaShort = item.sha.slice(0, 7);
            const timeStr = new Date(item.commit.committer.date).toLocaleString('zh-CN', { hour12: false });
            container.innerHTML += `
                <div class="border rounded-xl p-3 flex items-center justify-between gap-3 saas-input">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-mono text-xs font-bold text-amber-500">[#${shaShort}]</span>
                            <span class="text-[10px] text-slate-400 font-mono">${timeStr}</span>
                        </div>
                        <div class="text-xs font-mono truncate">${item.commit.message}</div>
                    </div>
                    <button onclick="revertToSelectedCommit('${item.sha}', '${shaShort}')" class="px-3 py-1.5 saas-card rounded-lg text-xs font-mono font-bold hover:opacity-80">
                        ${idx === 0 ? '当前状态' : '还原'}
                    </button>
                </div>
            `;
        });
    } catch (err) {
        container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 font-mono">获取历史异常</div>`;
    }
}

window.revertToSelectedCommit = async function(targetSha, shortSha) {
    if (!confirm(`⏳ 确定还原至快照 [#${shortSha}] 吗？`)) return;
    window.closeRollbackModal();
    try {
        const keys = getKeys();
        const treeRes = await fetch(`https://api.github.com/repos/${REPO}/git/trees/${targetSha}?recursive=1`, { headers: { "Authorization": `token ${keys.gh}` } });
        const treeData = await treeRes.json();
        const filesToRestore = treeData.tree.filter(item => item.type === 'blob');
        for (const fileObj of filesToRestore) {
            const fileContentRes = await fetch(fileObj.url, { headers: { "Authorization": `token ${keys.gh}` } });
            const fileJson = await fileContentRes.json();
            await fetch(`https://api.github.com/repos/${REPO}/contents/${fileObj.path}`, {
                method: "PUT",
                headers: { "Authorization": `token ${keys.gh}`, "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json" },
                body: JSON.stringify({ message: `⏳ VETO: Rollback repo to #${shortSha} (${fileObj.path})`, content: fileJson.content })
            });
        }
        appendLog(`✅ 成功还原主仓库到快照 [#${shortSha}]`);
        loadHistoryFromMemory();
    } catch(err) { appendLog("❌ 还原异常: " + err.message, "text-rose-500"); }
};

window.triggerSwarmAutonomousAction = async function() {
    const btn = document.getElementById("runBtn");
    const cmdBox = document.getElementById("cmd");
    const rawText = cmdBox ? (cmdBox.innerText.replace(/@[^ ]+/g, "").trim() || "常规进展汇报") : "常规进展汇报";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "<span>⚙️ AI 智能体推演中...</span>";
    }
    try {
        const keys = getKeys();
        const [memoryFile, repoTreeRes] = await Promise.all([
            getGithubFileSafe("MEMORY.md", keys.gh),
            fetch(`https://api.github.com/repos/${REPO}/git/trees/main?recursive=1`, { headers: { "Authorization": `token ${keys.gh}` } }).then(r => r.json())
        ]);
        const treeSummary = (repoTreeRes.tree || []).map(n => n.path).join("\n");

        const prompt = `你是 APEXWORK 智能体中枢。
目录树：\n${treeSummary}
记忆：\n${memoryFile.content || "无"}
董事长指令："${rawText}"
要求：仅输出 ===SWARM_LOG=== 答复和 ===NEW_MEMORY=== 带有 [EVO-RECORD | 部门]: 的记忆。不准随性改写无关文件。`;

        const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${keys.ds}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "system", content: "极简商务平台后台架构中枢。" }, { role: "user", content: prompt }],
                temperature: 0.4
            })
        });
        const aiAnswer = (await dsRes.json()).choices[0].message.content;
        const swarmLogText = aiAnswer.split("===SWARM_LOG===")[1]?.split("===NEW_MEMORY===")[0].trim() || "调令执行完毕。";
        appendLog(`🤖 回复:\n${swarmLogText}`);
        if (cmdBox) cmdBox.innerHTML = "";
        loadHistoryFromMemory();
    } catch (err) {
        appendLog("❌ 调令执行异常: " + err.message, "text-rose-500");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = "<span>🚀 提交至云端 AI 协同执行</span>";
        }
    }
};
