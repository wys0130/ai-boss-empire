// ==========================================
// APEXWORK 模块 1：底层核心网络通信与全局状态引擎 (admin-base.js)
// ==========================================

const REPO = "wys0130/ai-boss-empire";
let activeFilterDept = "";
let currentManifestFilter = 'ALL';
let isCmdActive = false;
let isCloudSyncing = false; // 队列锁，防止删除时 GitHub 并发冲突
let AUDIT_PRODUCTS = [];
let rawManifestTasks = [];

function getKeysSafe() {
    return {
        gh: localStorage.getItem("APEX_GH_TOKEN") || "",
        ds: localStorage.getItem("APEX_DS_KEY") || ""
    };
}

function utf8_to_b64(str) { return window.btoa(unescape(encodeURIComponent(str))); }
function b64_to_utf8(str) { return decodeURIComponent(escape(window.atob(str))); }

function appendLog(msg, color = "") {
    const log = document.getElementById("historyFeed");
    if (!log) return;
    log.innerHTML += `<div class="text-[11px] font-mono text-slate-500 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 py-1.5 ${color}">> ${msg}</div>`;
    log.scrollTop = log.scrollHeight;
}

// 👑 强穿透引擎：加时间戳彻底打穿 GitHub CDN 缓存
async function getGithubFileSafe(path, token) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?_t=${Date.now()}`, { 
        headers: { "Authorization": `token ${token}`, "If-None-Match": "" }
    });
    if (!res.ok) return { content: "", sha: null };
    const data = await res.json();
    return { content: b64_to_utf8(data.content), sha: data.sha };
}

async function pushGithubJsonFile(path, jsonObj, sha, message, token) {
    const contentStr = typeof jsonObj === 'string' ? jsonObj : JSON.stringify(jsonObj, null, 2);
    const payload = { message: message, content: utf8_to_b64(contentStr) };
    if (sha) payload.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
        method: "PUT",
        headers: { "Authorization": `token ${token}`, "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`提交失败: ${res.status} ${res.statusText}`);
    return await res.json();
}

async function pushGithubBinaryFile(path, base64Raw, sha, message, token) {
    const payload = { message: message, content: base64Raw };
    if (sha) payload.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
        method: "PUT",
        headers: { "Authorization": `token ${token}`, "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`提交图片失败: ` + res.statusText);
    return await res.json();
}

function toggleThemeMode() {
    const htmlEl = document.documentElement;
    const current = htmlEl.getAttribute("data-theme") || "light";
    const target = current === "light" ? "dark" : "light";
    htmlEl.setAttribute("data-theme", target);
    localStorage.setItem("APEX_ADMIN_THEME", target);
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.innerHTML = target === "dark" ? "<span>🌞 白昼模式</span>" : "<span>🌙 极夜模式</span>";
}

function initApexTooltip() {
    const tooltip = document.getElementById("apexTooltip");
    if (!tooltip) return;
    document.addEventListener("mouseover", (e) => {
        const target = e.target.closest("[data-tooltip]");
        if (target) { tooltip.innerText = target.getAttribute("data-tooltip"); tooltip.classList.remove("hidden"); }
    });
    document.addEventListener("mousemove", (e) => {
        if (!tooltip.classList.contains("hidden")) { tooltip.style.left = (e.clientX + 14) + "px"; tooltip.style.top = (e.clientY + 14) + "px"; }
    });
    document.addEventListener("mouseout", (e) => { if (e.target.closest("[data-tooltip]")) tooltip.classList.add("hidden"); });
}

function openLiveSiteForceBypass() {
    window.open('index.html', '_blank');
}

function toggleConfig() {
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
}

function saveKeys() {
    localStorage.setItem("APEX_GH_TOKEN", document.getElementById("ghTokenInput").value.trim());
    localStorage.setItem("APEX_DS_KEY", document.getElementById("dsKeyInput").value.trim());
    localStorage.setItem("APEX_GITEE_TOKEN", document.getElementById("giteeTokenInput").value.trim());
    localStorage.setItem("APEX_GITEE_REPO", document.getElementById("giteeRepoInput").value.trim());
    toggleConfig();
    if(typeof syncAllData === "function") syncAllData();
    alert("✅ 系统密钥与 Gitee 金库节点参数已全量保存生效！");
}

function syncAllData() {
    if(typeof loadTasksManifest === "function") loadTasksManifest();
    if(typeof loadHistoryFromMemory === "function") loadHistoryFromMemory();
}
