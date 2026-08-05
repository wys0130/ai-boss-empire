/**
 * APEXWORK 驾驶舱模块化控制内核
 * 特性：
 * 1. 严格控制 isCmdActive：没点过输入框，点击部门按键只做过滤和聚焦，决不塞字！
 * 2. 同步数据合并：同步一次，计划进度与战报日志同时刷新。
 * 3. 悬浮 tooltip 极速展示省略号背后的全部文字。
 */

const REPO = "wys0130/ai-boss-empire";
let activeFilterDept = "";
let rawManifestTasks = [];
let currentManifestFilter = 'ALL';

// 👑 关键规则标志位：记录用户当前到底有没有意图在输入框写字
let isCmdActive = false;

const allDeptNames = [
    "大脑中枢", "缺陷与QA质检部", "主动产品部", "施工工程部", 
    "视觉策划部", "审核质量部", "转化销售部", "推广营销部", "国际法务部"
];

// 1. 初始化页面与悬浮框
window.addEventListener('DOMContentLoaded', () => {
    initApexTooltip();
    renderDeptButtons();
    
    const cmdBox = document.getElementById("cmd");
    if (cmdBox) {
        // 只有主动聚焦或点击输入框时，才允许随后点击部门插入词条
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

// 2. 统一合并的同步按钮：一次点击，拉取计划 + 战报
function syncAllData() {
    loadTasksManifest();
    loadHistoryFromMemory();
}

// 3. 极速气泡提示
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

// 4. 渲染 9 大冷灰部门按钮
function renderDeptButtons() {
    const container = document.getElementById("deptButtonsContainer");
    if (!container) return;
    container.innerHTML = "";
    allDeptNames.forEach(dept => {
        const btn = document.createElement("button");
        btn.className = "dept-btn themed-inner border border-zinc-800 hover:border-zinc-500 rounded p-1.5 text-left transition";
        btn.innerHTML = `<div class="text-[11px] font-medium text-zinc-300 truncate">${dept}</div>`;
        btn.onclick = () => inspectDept(dept, btn);
        container.appendChild(btn);
    });
}

// 👑 5. 绝对严谨的部门按键点击逻辑！
function inspectDept(deptName, btnEl) {
    activeFilterDept = deptName;
    document.querySelectorAll(".dept-btn").forEach(el => el.classList.remove("border-zinc-400", "bg-zinc-800/60"));
    btnEl.classList.add("border-zinc-400", "bg-zinc-800/60");
    document.getElementById("activeDeptLabel").innerText = `[${deptName}]`;

    const cmdBox = document.getElementById("cmd");

    // 【核心鉴别】：你点没点过输入框？
    if (isCmdActive) {
        // 先点击过输入框：精准在光标位置插入词条，并将光标移动到末尾
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
        appendLog(`🎯 追加部门词条 -> @${deptName}`);
    } else {
        // 没点击过输入框：只做视图切换和战报筛选，绝不往输入框里塞任何字！
        appendLog(`🔍 视图聚焦至 [${deptName}] (未激活输入框，不插入词条)`);
    }

    loadHistoryFromMemory();
}

function resetDeptFilter() {
    activeFilterDept = "";
    isCmdActive = false;
    document.querySelectorAll(".dept-btn").forEach(el => el.classList.remove("border-zinc-400", "bg-zinc-800/60"));
    document.getElementById("activeDeptLabel").innerText = `[全景视图]`;
    document.getElementById("cmd").innerHTML = "";
    appendLog(`🌐 恢复全景模式`);
    loadHistoryFromMemory();
}

// 6. 计划进度读取与打勾
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
        document.getElementById('manifestSummaryBadge').innerText = `${sum.completed}/${sum.total_tasks}`;
        renderManifestTasks();
    } catch (err) {
        listEl.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 col-span-full font-mono">读取任务错误</div>`;
    }
}

function filterManifest(stageKey) {
    currentManifestFilter = stageKey;
    document.querySelectorAll('.manifest-tab').forEach(btn => {
        btn.className = "manifest-tab px-2 py-0.5 rounded text-zinc-500 hover:text-zinc-300";
    });
    event.target.className = "manifest-tab px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold border border-zinc-700";
    renderManifestTasks();
}

function renderManifestTasks() {
    const listEl = document.getElementById('manifestList');
    listEl.innerHTML = "";

    const filtered = currentManifestFilter === 'ALL' 
        ? rawManifestTasks 
        : rawManifestTasks.filter(t => t.stage === currentManifestFilter || (!t.stage && currentManifestFilter === 'ALL'));

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="text-center text-xs text-zinc-500 py-4 col-span-full font-mono">该目标期暂无工单</div>`;
        return;
    }

    filtered.forEach(task => {
        const isDone = task.status === 'DONE';
        const isInProg = task.status === 'IN_PROGRESS';
        let borderCls = isDone ? "border-zinc-700/80 bg-zinc-900/40 opacity-50" : "border-zinc-800 bg-[#0d0d0f]";
        let dotCls = isDone ? "bg-emerald-500" : (isInProg ? "bg-amber-400 animate-pulse" : "bg-zinc-600");
        let statusText = isDone ? "已完成" : (isInProg ? "研发中" : "待处理");

        listEl.innerHTML += `
            <div class="border rounded-md p-2 flex flex-col justify-between transition hover:border-zinc-600 ${borderCls}" 
                 data-tooltip="【工单 #${task.id}】\n目标：${task.title}\n备注：${task.notes || '无'}\n部门：${task.department}">
                <div>
                    <div class="flex items-center justify-between text-[10px] font-mono mb-1 text-zinc-500">
                        <span>#${task.id} · ${task.department.split('&')[0].trim()}</span>
                        <span class="flex items-center gap-1 font-medium text-zinc-400"><i class="w-1.5 h-1.5 rounded-full ${dotCls} inline-block"></i>${statusText}</span>
                    </div>
                    <span class="text-xs font-semibold text-zinc-200 font-mono truncate-line mb-0.5">${task.title}</span>
                    <span class="text-[10px] text-zinc-500 font-mono truncate-line">${task.notes || '暂无说明'}</span>
                </div>
                <div class="mt-1 pt-1 border-t border-zinc-800/80 flex items-center justify-end text-[10px] font-mono">
                    <button onclick="toggleTaskStatus('${task.id}')" class="px-2 py-0.5 rounded border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium">
                        ${isDone ? '撤销' : '打选完成'}
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
    appendLog(`✏️ 提交进度变更 -> [${taskId}] ${task.status}`);
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
            appendLog(`✅ 进度书已写入 GitHub`);
            loadTasksManifest();
        }
    } catch (e) {
        appendLog(`❌ 更新进度异常: ${e.message}`, "text-rose-500");
    }
}

// 7. 战报与 GitHub 底层通信
function getKeys() {
    const gh = localStorage.getItem("APEX_GH_TOKEN");
    const ds = localStorage.getItem("APEX_DS_KEY");
    if (!gh || !ds) { toggleConfig(); throw new Error("请在顶栏设置密钥!"); }
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
    if (color) log.className = `flex-1 text-[11px] font-mono ${color} p-2 bg-[#0d0d0f] border border-zinc-800/80 rounded whitespace-pre-wrap leading-relaxed overflow-y-auto custom-scrollbar`;
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
            feed.innerHTML = `<div class="p-3 text-center text-xs text-zinc-600 font-mono">无记录</div>`;
            return;
        }
        feed.innerHTML = "";
        lines.reverse().forEach((line, idx) => {
            const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
            const timeStr = timeMatch ? timeMatch[1] : "归档";
            const cleanText = line.replace(/^- /, "").replace(/\[EVO-RECORD[^\]]*\]:/, "").replace(/\[VETO-RECORD[^\]]*\]:/, "").trim();
            feed.innerHTML += `
                <div class="border border-zinc-800/80 rounded p-1.5 bg-[#0d0d0f]">
                    <div class="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-0.5 border-b border-zinc-800/60 pb-0.5">
                        <span>⏱️ ${timeStr}</span><span>#${lines.length - idx}</span>
                    </div>
                    <div class="text-xs text-zinc-300 font-mono">${cleanText}</div>
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
    container.innerHTML = `<div class="text-center text-xs text-zinc-500 py-4 font-mono">加载中...</div>`;
    try {
        const keys = getKeys();
        const res = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=10`, { headers: { "Authorization": `token ${keys.gh}` } });
        const commits = await res.json();
        container.innerHTML = "";
        commits.forEach((item, idx) => {
            const shaShort = item.sha.slice(0, 7);
            const timeStr = new Date(item.commit.committer.date).toLocaleString('zh-CN', { hour12: false });
            container.innerHTML += `
                <div class="border border-zinc-800 rounded p-1.5 flex items-center justify-between gap-2 bg-[#0d0d0f]">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5 mb-0.5">
                            <span class="font-mono text-xs font-bold text-amber-500">[#${shaShort}]</span>
                            <span class="text-[10px] text-zinc-500 font-mono">${timeStr}</span>
                        </div>
                        <div class="text-xs text-zinc-300 font-mono truncate">${item.commit.message}</div>
                    </div>
                    <button onclick="revertToSelectedCommit('${item.sha}', '${shaShort}')" class="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded text-[10px] font-bold">
                        ${idx === 0 ? '当前' : '还原'}
                    </button>
                </div>
            `;
        });
    } catch (err) { container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 font-mono">获取失败</div>`; }
}

async function revertToSelectedCommit(targetSha, shortSha) {
    if (!confirm(`⏳ 确定还原至版本 [#${shortSha}] 吗？`)) return;
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
                body: JSON.stringify({ message: `⏳ VETO: Rollback to #${shortSha} (${fileObj.path})`, content: fileJson.content })
            });
        }
        appendLog(`✅ 还原成功 [#${shortSha}]`);
        loadHistoryFromMemory();
    } catch(err) { appendLog("❌ 还原异常: " + err.message, "text-rose-500"); }
}

async function triggerSwarmAutonomousAction() {
    const btn = document.getElementById("runBtn");
    const cmdBox = document.getElementById("cmd");
    const rawText = cmdBox.innerText.replace(/@[^ ]+/g, "").trim() || "常规汇报";
    btn.disabled = true;
    btn.innerHTML = "<span>⚙️ 蜂群协同会商中...</span>";
    try {
        const keys = getKeys();
        const [memoryFile, repoTreeRes] = await Promise.all([
            getGithubFileSafe("MEMORY.md", keys.gh),
            fetch(`https://api.github.com/repos/${REPO}/git/trees/main?recursive=1`, { headers: { "Authorization": `token ${keys.gh}` } }).then(r => r.json())
        ]);
        const treeSummary = (repoTreeRes.tree || []).map(n => node.path).join("\n");

        const prompt = `你是 APEXWORK 智能体中枢。
目录树：\n${treeSummary}
记忆：\n${memoryFile.content || "无"}
董事长指令："${rawText}"
要求：仅输出 ===SWARM_LOG=== 答复和 ===NEW_MEMORY=== 带有 [EVO-RECORD | 部门]: 的记忆。不准随性改代码。`;

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
        appendLog(`🤖 回复:\n${swarmLogText}`, "text-zinc-200");
        cmdBox.innerHTML = "";
        loadHistoryFromMemory();
    } catch (err) {
        appendLog("❌ 异常: " + err.message, "text-rose-500");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "<span>🚀 提交至云端蜂群协同执行</span>";
    }
}
