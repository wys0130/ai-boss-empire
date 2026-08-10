/**
 * APEXWORK 模块 1：底层核心网络通信与全局状态引擎 (admin-api.js)
 */

window.REPO = "wys0130/ai-boss-empire";
window.activeFilterDept = "";
window.currentManifestFilter = 'ALL';
window.isCmdActive = false;
window.isCloudSyncing = false; // 全局异步锁，绝对防御 GitHub 并发 409 报错
window.AUDIT_PRODUCTS = [];

// ==========================================
// 👑 底层安全与编码引擎
// ==========================================
window.getKeysSafe = function() {
    return {
        gh: localStorage.getItem("APEX_GH_TOKEN") || "",
        ds: localStorage.getItem("APEX_DS_KEY") || ""
    };
};

window.utf8_to_b64 = function(str) { return window.btoa(unescape(encodeURIComponent(str))); };
window.b64_to_utf8 = function(str) { return decodeURIComponent(escape(window.atob(str))); };

window.appendLog = function(msg, color = "") {
    const log = document.getElementById("historyFeed");
    if (!log) return;
    log.innerHTML += `<div class="text-[11px] font-mono text-slate-500 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 py-1.5 ${color}">> ${msg}</div>`;
    log.scrollTop = log.scrollHeight;
};

// ==========================================
// 👑 GitHub 强穿透 I/O 引擎 (彻底打穿 CDN 缓存)
// ==========================================
window.getGithubFileSafe = async function(path, token) {
    const res = await fetch(`https://api.github.com/repos/${window.REPO}/contents/${path}?_t=${Date.now()}`, { 
        headers: { "Authorization": `token ${token}`, "If-None-Match": "" }
    });
    if (!res.ok) return { content: "", sha: null };
    const data = await res.json();
    return { content: window.b64_to_utf8(data.content), sha: data.sha };
};

window.pushGithubJsonFile = async function(path, jsonObj, sha, message, token) {
    const contentStr = typeof jsonObj === 'string' ? jsonObj : JSON.stringify(jsonObj, null, 2);
    const payload = { message: message, content: window.utf8_to_b64(contentStr) };
    if (sha) payload.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${window.REPO}/contents/${path}`, {
        method: "PUT",
        headers: { "Authorization": `token ${token}`, "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`提交失败: ${res.status} ${res.statusText}`);
    return await res.json();
};

window.pushGithubBinaryFile = async function(path, base64Raw, sha, message, token) {
    const payload = { message: message, content: base64Raw };
    if (sha) payload.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${window.REPO}/contents/${path}`, {
        method: "PUT",
        headers: { "Authorization": `token ${token}`, "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`提交图片失败: ` + res.statusText);
    return await res.json();
};

// ==========================================
// 👑 界面控制公共库
// ==========================================
window.switchAdminTab = function(tabId) {
    const tabs = ['audit', 'config', 'overview', 'swarm', 'users'];
    const titles = {
        'audit': '业务控制台 / 作品风控审查与上架',
        'config': '业务控制台 / 主页轮播图与定价中心',
        'overview': '业务控制台 / 阶段开发工单进度书',
        'swarm': '业务控制台 / AI 智能体夜间排班与调令中心',
        'users': '业务控制台 / 用户与权限管理中心'
    };

    tabs.forEach(id => {
        const sectionEl = document.getElementById(`tab-${id}`);
        const navEl = document.getElementById(`nav-${id}`);
        if (navEl) navEl.classList.toggle('active', id === tabId);
        if (sectionEl) {
            if (id === tabId) {
                sectionEl.classList.remove('hidden');
                if (window.gsap) gsap.fromTo(sectionEl, { opacity: 0, y: 15, scale: 0.99 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out" });
            } else {
                sectionEl.classList.add('hidden');
            }
        }
    });

    const headerTitle = document.getElementById('pageHeaderTitle');
    if (headerTitle) headerTitle.innerText = titles[tabId] || '业务控制台 / APEXWORK PRO';
    if (tabId === 'users' && window.ApexUserManager) window.ApexUserManager.initUserSection();
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

window.initApexTooltip = function() {
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
};
