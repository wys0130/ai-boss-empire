/**
 * APEXWORK 智能体驾驶舱核心驱动 (components/admin-core.js)
 * 1. 严格贯彻账本准则：只有点击聚焦过 #cmd 输入框，点击部门按键才会向输入框内添加词条！如果没聚焦输入框，单点仅过滤左下角日志！
 * 2. 同步全站定价策略至 LocalStorage，与前台 /components/lang-and-policy.js 全面呼应。
 */

const REPO = "wys0130/ai-boss-empire";
let activeFilterDept = "";
let rawManifestTasks = [];
let currentManifestFilter = 'ALL';
let isCmdActive = false;

const deptConfig = [
    { name: "大脑中枢", cls: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30" },
    { name: "缺陷与QA质检部", cls: "bg-rose-500/10 text-rose-300 border-rose-500/30" },
    { name: "主动产品部", cls: "bg-amber-500/10 text-amber-300 border-amber-500/30" },
    { name: "施工工程部", cls: "bg-sky-500/10 text-sky-300 border-sky-500/30" },
    { name: "视觉策划部", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" },
    { name: "审核质量部", cls: "bg-purple-500/10 text-purple-300 border-purple-500/30" },
    { name: "转化销售部", cls: "bg-pink-500/10 text-pink-300 border-pink-500/30" },
    { name: "推广营销部", cls: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30" },
    { name: "国际法务部", cls: "bg-teal-500/10 text-teal-300 border-teal-500/30" }
];

// 👑 保存全域定价策略
window.savePricingConfig = function() {
    const calcUSD = (rmb) => {
        const num = parseFloat(rmb) || 0;
        return num > 0 ? (Math.floor(num / 7.0) + 0.99).toFixed(2) : "0.00";
    };
    const config = {
        bundle: { rmb: document.getElementById('priceInput-bundle').value, usd: calcUSD(document.getElementById('priceInput-bundle').value) },
        ppt: { rmb: document.getElementById('priceInput-ppt').value, usd: calcUSD(document.getElementById('priceInput-ppt').value) },
        excel: { rmb: document.getElementById('priceInput-excel').value, usd: calcUSD(document.getElementById('priceInput-excel').value) },
        word: { rmb: document.getElementById('priceInput-word').value, usd: calcUSD(document.getElementById('priceInput-word').value) },
        updatedAt: new Date().toISOString()
    };
    localStorage.setItem('APEX_PRICING_CONFIG', JSON.stringify(config));
    appendLog(`>> [定价中台] 汇率策略同步生效，商用三件套定价为：￥${config.bundle.rmb} RMB = $${config.bundle.usd} USD`);
    alert(`✅ 全站定价策略写入成功！\n\n全套企业包：￥${config.bundle.rmb} = $${config.bundle.usd} USD\n请在前台主页查看实时生效情况。`);
};

window.openLiveSiteForceBypass = function() {
    window.open(`https://wys0130.github.io/ai-boss-empire/?nocache=${Date.now()}`, '_blank');
};

function initAdminEngine() {
    initApexTooltip();
    renderDeptButtons();
    
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
            tooltip.style.display = "block";
        }
    });
    document.addEventListener("mousemove", (e) => {
        if (tooltip.style.display === "block") {
            tooltip.style.left = (e.clientX + 14) + "px";
            tooltip.style.top = (e.clientY + 14) + "px";
        }
    });
    document.addEventListener("mouseout", (e) => {
        if (e.target.closest("[data-tooltip]")) {
            tooltip.style.display = "none";
        }
    });
}

function renderDeptButtons() {
    const container = document.getElementById("deptButtonsContainer");
    if (!container) return;
    container.innerHTML = "";
    deptConfig.forEach(dept => {
        const btn = document.createElement("button");
        btn.className = `dept-btn border rounded-xl p-2 text-left transition hover:border-slate-500 ${dept.cls}`;
        btn.innerHTML = `<div class="text-xs font-bold truncate">${dept.name}</div>`;
        btn.onclick = () => window.inspectDept(dept.name, btn);
        container.appendChild(btn);
    });
}

// 👑 遵守严格规约：点击输入框才给输入框追加 @词条；未点击只筛选日志
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
        tokenSpan.className = "dept-token bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.5 rounded";
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
        appendLog(`🎯 追加指令部门词条 -> @${deptName}`);
    } else {
        appendLog(`🔍 切换视图筛选 -> [${deptName}] (提示：未点击输入框，已避免自动录入词条)`);
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
    appendLog(`🌐 恢复系统全景日志视图`);
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
        if (badge) badge.innerText = `执行完成度: ${sum.completed}/${sum.total_tasks}`;
        renderManifestTasks();
    } catch (err) {
        listEl.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 col-span-full font-mono">读取工单错误: ${err.message}</div>`;
    }
}

window.filterManifest = function(stageKey) {
    currentManifestFilter = stageKey;
    document.querySelectorAll('.manifest-tab').forEach(btn => {
        btn.className = "manifest-tab px-3 py-1 rounded-lg text-slate-400 hover:text-white";
    });
    const targetBtn = window.event?.target;
    if (targetBtn) {
        targetBtn.className = "manifest-tab px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold";
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
        listEl.innerHTML = `<div class="text-center text-xs text-slate-500 py-4 col-span-full font-mono">该开发期暂无对应工单</div>`;
        return;
    }

    filtered.forEach(task => {
        const isDone = task.status === 'DONE';
        const isInProg = task.status === 'IN_PROGRESS';
        let borderCls = isDone ? "border-emerald-500/30 bg-emerald-500/5 opacity-60" : "border-slate-800 bg-slate-900/60";
        let dotCls = isDone ? "bg-emerald-500" : (isInProg ? "bg-amber-400 animate-pulse" : "bg-slate-600");
        let statusText = isDone ? "已达成" : (isInProg ? "研发中" : "待落实");

        listEl.innerHTML += `
            <div class="border rounded-xl p-3 flex flex-col justify-between transition hover:border-slate-700 ${borderCls}" 
                 data-tooltip="【工单 #${task.id}】\n目标：${task.title}\n备注：${task.notes || '无'}\n责任部门：${task.department}">
                <div>
                    <div class="flex items-center justify-between text-[10px] font-mono mb-1.5 text-slate-400">
                        <span class="font-bold text-indigo-400">[${task.id}] · ${task.department.split('&')[0].trim()}</span>
                        <span class="flex items-center gap-1 font-medium"><i class="w-1.5 h-1.5 rounded-full ${dotCls} inline-block"></i>${statusText}</span>
                    </div>
                    <span class="text-xs font-semibold text-white font-mono truncate mb-1 block">${task.title}</span>
                    <span class="text-[11px] text-slate-400 font-mono truncate block">${task.notes || '暂无详细说明'}</span>
                </div>
                <div class="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-end text-[10px] font-mono">
                    <button onclick="toggleTaskStatus('${task.id}')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition">
                        ${isDone ? '撤销标志' : '打勾落实'}
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
    appendLog(`✏️ 工单状态更新 -> [${taskId}] ${task.status}`);
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
            appendLog(`✅ 进度书变更已同步回 GitHub Main 分支`);
            loadTasksManifest();
        }
    } catch (e) {
        appendLog(`❌ 更新进度异常: ${e.message}`, "text-rose-400");
    }
};

function getKeys() {
    const gh = localStorage.getItem("APEX_GH_TOKEN");
    const ds = localStorage.getItem("APEX_DS_KEY");
    if (!gh || !ds) { window.toggleConfig(); throw new Error("请先在顶栏按键配置 API 访问密钥!"); }
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
    if (color) log.className = `flex-1 text-[11px] font-mono ${color} p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl whitespace-pre-wrap leading-relaxed overflow-y-auto custom-scroll`;
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
            feed.innerHTML = `<div class="p-4 text-center text-xs text-slate-500 font-mono">暂无历史进化记录</div>`;
            return;
        }
        feed.innerHTML = "";
        lines.reverse().forEach((line, idx) => {
            const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
            const timeStr = timeMatch ? timeMatch[1] : "归档";
            const cleanText = line.replace(/^- /, "").replace(/\[EVO-RECORD[^\]]*\]:/, "").replace(/\[VETO-RECORD[^\]]*\]:/, "").trim();
            feed.innerHTML += `
                <div class="border border-slate-800/80 rounded-xl p-2.5 bg-slate-900/40">
                    <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 border-b border-slate-800/60 pb-1">
                        <span>⏱️ ${timeStr}</span><span>#${lines.length - idx}</span>
                    </div>
                    <div class="text-xs text-slate-300 font-mono">${cleanText}</div>
                </div>
            `;
        });
    } catch (err) {
        feed.innerHTML = `<div class="text-center text-xs text-rose-400 py-4 font-mono">读取战报异常</div>`;
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
    container.innerHTML = `<div class="text-center text-xs text-slate-500 py-4 font-mono">读取 Git 日志中...</div>`;
    try {
        const keys = getKeys();
        const res = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=10`, { headers: { "Authorization": `token ${keys.gh}` } });
        const commits = await res.json();
        container.innerHTML = "";
        commits.forEach((item, idx) => {
            const shaShort = item.sha.slice(0, 7);
            const timeStr = new Date(item.commit.committer.date).toLocaleString('zh-CN', { hour12: false });
            container.innerHTML += `
                <div class="border border-slate-800/90 rounded-xl p-3 flex items-center justify-between gap-3 bg-slate-900/60">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-mono text-xs font-bold text-amber-400">[#${shaShort}]</span>
                            <span class="text-[10px] text-slate-400 font-mono">${timeStr}</span>
                        </div>
                        <div class="text-xs text-slate-300 font-mono truncate">${item.commit.message}</div>
                    </div>
                    <button onclick="revertToSelectedCommit('${item.sha}', '${shaShort}')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-bold transition">
                        ${idx === 0 ? '当前最新' : '选择还原'}
                    </button>
                </div>
            `;
        });
    } catch (err) {
        container.innerHTML = `<div class="text-center text-xs text-rose-400 py-4 font-mono">拉取 Git 历史失败</div>`;
    }
}

window.revertToSelectedCommit = async function(targetSha, shortSha) {
    if (!confirm(`⏳ 确定还原至快照 [#${shortSha}] 吗？\n\n警告：系统将把主分支物理文件全部倒回该节点的历史版本。`)) return;
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
        appendLog(`✅ 成功将整个仓库版本还原至节点 [#${shortSha}]`);
        loadHistoryFromMemory();
    } catch(err) { appendLog("❌ 快照还原异常: " + err.message, "text-rose-400"); }
};

window.triggerSwarmAutonomousAction = async function() {
    const btn = document.getElementById("runBtn");
    const cmdBox = document.getElementById("cmd");
    const rawText = cmdBox ? (cmdBox.innerText.replace(/@[^ ]+/g, "").trim() || "常规进展汇报") : "常规进展汇报";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "<span>⚙️ AI 蜂群云端推演计算中...</span>";
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
                messages: [{ role: "system", content: "极简架构中枢。" }, { role: "user", content: prompt }],
                temperature: 0.4
            })
        });
        const aiAnswer = (await dsRes.json()).choices[0].message.content;
        const swarmLogText = aiAnswer.split("===SWARM_LOG===")[1]?.split("===NEW_MEMORY===")[0].trim() || "调令执行完毕。";
        appendLog(`🤖 回复:\n${swarmLogText}`, "text-white");
        if (cmdBox) cmdBox.innerHTML = "";
        loadHistoryFromMemory();
    } catch (err) {
        appendLog("❌ 调度异常: " + err.message, "text-rose-400");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = "<span>🚀 提交至云端 AI 协同执行</span>";
        }
    }
};
