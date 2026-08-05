/**
 * APEXWORK 驾驶舱模块化控制内核 (js/admin-core.js)
 * 特性：
 * 1. 完整在 DOMContentLoaded 调用 renderDeptButtons，保证 9 大部门正确渲染且绝对可点！
 * 2. 严格遵循 isCmdActive 判断：未点输入框不塞字，点了才塞。
 */

const REPO = "wys0130/ai-boss-empire";
let activeFilterDept = "";
let rawManifestTasks = [];
let currentManifestFilter = 'ALL';
let isCmdActive = false;

const deptConfig = [
    { name: "大脑中枢", cls: "theme-blue" },
    { name: "缺陷与QA质检部", cls: "theme-rose" },
    { name: "主动产品部", cls: "theme-amber" },
    { name: "施工工程部", cls: "theme-sky" },
    { name: "视觉策划部", cls: "theme-emerald" },
    { name: "审核质量部", cls: "theme-purple" },
    { name: "转化销售部", cls: "theme-pink" },
    { name: "推广营销部", cls: "theme-cyan" },
    { name: "国际法务部", cls: "theme-teal" }
];

// 👑 1. 核心修复：在这里显式执行 renderDeptButtons()，保证所有按钮顺畅渲染！
window.addEventListener('DOMContentLoaded', () => {
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
                triggerSwarmAutonomousAction();
            }
            if (e.key === "Escape") hideMentionDropdown();
        });
    }

    if (localStorage.getItem("APEX_GH_TOKEN")) {
        syncAllData();
    }
});

function openLiveSiteForceBypass() {
    window.open(`https://wys0130.github.io/ai-boss-empire/?nocache=${Date.now()}`, '_blank');
}

function syncAllData() {
    loadTasksManifest();
    loadHistoryFromMemory();
}

function initApexTooltip() {
    const tooltip = document.getElementById("apexTooltip");
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
        btn.className = `dept-btn border rounded p-1.5 text-left transition ${dept.cls}`;
        btn.innerHTML = `<div class="text-[11px] font-bold truncate">${dept.name}</div>`;
        btn.onclick = () => inspectDept(dept.name, btn);
        container.appendChild(btn);
    });
}

// 👑 点击判断逻辑：没点击输入框点部门，绝不写一个字符到框里！
function inspectDept(deptName, btnEl) {
    activeFilterDept = deptName;
    document.querySelectorAll(".dept-btn").forEach(el => el.style.opacity = "0.45");
    btnEl.style.opacity = "1";
    document.getElementById("activeDeptLabel").innerText = `[${deptName}]`;

    const cmdBox = document.getElementById("cmd");
    if (isCmdActive) {
        cmdBox.focus();
        const tokenSpan = document.createElement("span");
        tokenSpan.className = "dept-token";
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
        appendLog(`🎯 插入词条 -> @${deptName}`);
    } else {
        appendLog(`🔍 聚焦部门 -> [${deptName}] (未激活输入框，不写入词条)`);
    }

    loadHistoryFromMemory();
}

function resetDeptFilter() {
    activeFilterDept = "";
    isCmdActive = false;
    document.querySelectorAll(".dept-btn").forEach(el => el.style.opacity = "1");
    document.getElementById("activeDeptLabel").innerText = `[全景视图]`;
    document.getElementById("cmd").innerHTML = "";
    appendLog(`🌐 恢复全景模式`);
    loadHistoryFromMemory();
}

async function loadTasksManifest() {
    const listEl = document.getElementById('manifestList');
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
        document.getElementById('manifestSummaryBadge').innerText = `完成度: ${sum.completed}/${sum.total_tasks}`;
        renderManifestTasks();
    } catch (err) {
        listEl.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 col-span-full font-mono">读取工单错误</div>`;
    }
}

function filterManifest(stageKey) {
    currentManifestFilter = stageKey;
    document.querySelectorAll('.manifest-tab').forEach(btn => {
        btn.className = "manifest-tab px-2.5 py-0.5 rounded text-slate-400 hover:text-white";
    });
    event.target.className = "manifest-tab px-2.5 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold";
    renderManifestTasks();
}

function renderManifestTasks() {
    const listEl = document.getElementById('manifestList');
    listEl.innerHTML = "";

    const filtered = currentManifestFilter === 'ALL' 
        ? rawManifestTasks 
        : rawManifestTasks.filter(t => t.stage === currentManifestFilter || (!t.stage && currentManifestFilter === 'ALL'));

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="text-center text-xs text-slate-500 py-4 col-span-full font-mono">该期暂无工单</div>`;
        return;
    }

    filtered.forEach(task => {
        const isDone = task.status === 'DONE';
        const isInProg = task.status === 'IN_PROGRESS';
        let borderCls = isDone ? "border-emerald-500/40 bg-emerald-500/5 opacity-60" : "border-slate-800 bg-[#0b0f19]";
        let dotCls = isDone ? "bg-emerald-500" : (isInProg ? "bg-amber-400 animate-pulse" : "bg-slate-600");
        let statusText = isDone ? "已达成" : (isInProg ? "研发中" : "待落实");

        listEl.innerHTML += `
            <div class="border rounded-lg p-2 flex flex-col justify-between transition hover:border-slate-600 ${borderCls}" 
                 data-tooltip="【工单 #${task.id}】\n目标：${task.title}\n备注：${task.notes || '无'}\n责任人：${task.department}">
                <div>
                    <div class="flex items-center justify-between text-[10px] font-mono mb-1 text-slate-400">
                        <span class="font-bold text-indigo-400">[${task.id}] · ${task.department.split('&')[0].trim()}</span>
                        <span class="flex items-center gap-1 font-medium"><i class="w-1.5 h-1.5 rounded-full ${dotCls} inline-block"></i>${statusText}</span>
                    </div>
                    <span class="text-xs font-semibold text-white font-mono truncate-line mb-0.5">${task.title}</span>
                    <span class="text-[10px] text-slate-400 font-mono truncate-line">${task.notes || '暂无说明'}</span>
                </div>
                <div class="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-end text-[10px] font-mono">
                    <button onclick="toggleTaskStatus('${task.id}')" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition">
                        ${isDone ? '撤销' : '打勾完成'}
                    </button>
                </div>
            </div>
        `;
    });
}

async function toggleTaskStatus(taskId) {
    const task = rawManifestTasks.find(t => t.id === taskId);
    if (!task) return;
    task.status = task.status === 'DONE' ? 'TODO' : 'DONE';
    appendLog(`✏️ 进度变更 -> [${taskId}] ${task.status}`);
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
            appendLog(`✅ 进度书已写回 GitHub`);
            loadTasksManifest();
        }
    } catch (e) {
        appendLog(`❌ 更新进度异常: ${e.message}`, "text-rose-500");
    }
}

function getKeys() {
    const gh = localStorage.getItem("APEX_GH_TOKEN");
    const ds = localStorage.getItem("APEX_DS_KEY");
    if (!gh || !ds) { toggleConfig(); throw new Error("请先在顶栏配置密钥!"); }
    return { gh, ds };
}

function toggleConfig() { document.getElementById("configArea").classList.toggle("hidden"); }
function saveKeys() {
    localStorage.setItem("APEX_GH_TOKEN", document.getElementById("ghTokenInput").value.trim());
    localStorage.setItem("APEX_DS_KEY", document.getElementById("dsKeyInput").value.trim());
    toggleConfig();
    syncAllData();
}

function utf8_to_b64(str) { return window.btoa(unescape(encodeURIComponent(str))); }
function b64_to_utf8(str) { return decodeURIComponent(escape(window.atob(str))); }

function appendLog(msg, color = "") {
    const log = document.getElementById("log");
    if (color) log.className = `flex-1 text-[11px] font-mono ${color} p-2.5 bg-[#0b0f19] border border-slate-800 rounded-lg whitespace-pre-wrap leading-relaxed overflow-y-auto custom-scrollbar`;
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
    try {
        const keys = getKeys();
        const memFile = await getGithubFileSafe("MEMORY.md", keys.gh);
        let lines = (memFile.content || "").split("\n").filter(l => l.includes("[EVO-RECORD") || l.includes("[VETO-RECORD"));
        if (activeFilterDept) lines = lines.filter(l => l.includes(activeFilterDept));
        document.getElementById("historyCount").innerText = `${lines.length}条`;
        if (lines.length === 0) {
            feed.innerHTML = `<div class="p-3 text-center text-xs text-slate-500 font-mono">无记录</div>`;
            return;
        }
        feed.innerHTML = "";
        lines.reverse().forEach((line, idx) => {
            const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
            const timeStr = timeMatch ? timeMatch[1] : "归档";
            const cleanText = line.replace(/^- /, "").replace(/\[EVO-RECORD[^\]]*\]:/, "").replace(/\[VETO-RECORD[^\]]*\]:/, "").trim();
            feed.innerHTML += `
                <div class="border border-slate-800/80 rounded p-1.5 bg-[#0b0f19]">
                    <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5 border-b border-slate-800/60 pb-0.5">
                        <span>⏱️ ${timeStr}</span><span>#${lines.length - idx}</span>
                    </div>
                    <div class="text-xs text-slate-300 font-mono">${cleanText}</div>
                </div>
            `;
        });
    } catch (err) { feed.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 font-mono">读取错误</div>`; }
}

function openRollbackModal() {
    document.getElementById("rollbackModal").classList.remove("hidden");
    fetchCommitHistory();
}
function closeRollbackModal() { document.getElementById("rollbackModal").classList.add("hidden"); }

async function fetchCommitHistory() {
    const container = document.getElementById("commitListContainer");
    container.innerHTML = `<div class="text-center text-xs text-slate-500 py-4 font-mono">加载中...</div>`;
    try {
        const keys = getKeys();
        const res = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=10`, { headers: { "Authorization": `token ${keys.gh}` } });
        const commits = await res.json();
        container.innerHTML = "";
        commits.forEach((item, idx) => {
            const shaShort = item.sha.slice(0, 7);
            const timeStr = new Date(item.commit.committer.date).toLocaleString('zh-CN', { hour12: false });
            container.innerHTML += `
                <div class="border border-slate-800 rounded p-1.5 flex items-center justify-between gap-2 bg-[#0b0f19]">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5 mb-0.5">
                            <span class="font-mono text-xs font-bold text-amber-500">[#${shaShort}]</span>
                            <span class="text-[10px] text-slate-400 font-mono">${timeStr}</span>
                        </div>
                        <div class="text-xs text-slate-300 font-mono truncate">${item.commit.message}</div>
                    </div>
                    <button onclick="revertToSelectedCommit('${item.sha}', '${shaShort}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[10px] font-bold">
                        ${idx === 0 ? '当前' : '还原'}
                    </button>
                </div>
            `;
        });
    } catch (err) { container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 font-mono">获取失败</div>`; }
}

async function revertToSelectedCommit(targetSha, shortSha) {
    if (!confirm(`⏳ 确定还原至快照 [#${shortSha}] 吗？`)) return;
    closeRollbackModal();
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
        appendLog(`✅ 快照还原成功 [#${shortSha}]`);
        loadHistoryFromMemory();
    } catch(err) { appendLog("❌ 还原异常: " + err.message, "text-rose-500"); }
}

async function triggerSwarmAutonomousAction() {
    const btn = document.getElementById("runBtn");
    const cmdBox = document.getElementById("cmd");
    const rawText = cmdBox.innerText.replace(/@[^ ]+/g, "").trim() || "常规进展汇报";
    btn.disabled = true;
    btn.innerHTML = "<span>⚙️ 蜂群协同执行中...</span>";
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
        const swarmLogText = aiAnswer.split("===SWARM_LOG===")[1]?.split("===NEW_MEMORY===")[0].trim() || "完毕。";
        appendLog(`🤖 回复:\n${swarmLogText}`, "text-white");
        cmdBox.innerHTML = "";
        loadHistoryFromMemory();
    } catch (err) {
        appendLog("❌ 异常: " + err.message, "text-rose-500");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "<span>🚀 提交至云端蜂群协同执行</span>";
    }
}
