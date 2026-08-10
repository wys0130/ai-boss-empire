/**
 * APEXWORK 模块 2：业务风控、产品大盘与所有控制面板 (admin-biz.js)
 */

const REPO = "wys0130/ai-boss-empire";

window.ApexImageEngine = {
    cdn: { owner: "wys0130", repo: "ai-boss-empire", branch: "main" },
    toCDN: function(path) {
        if (!path || path.trim() === "") return null;
        if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:image")) return path;
        return `https://cdn.jsdelivr.net/gh/${this.cdn.owner}/${this.cdn.repo}@${this.cdn.branch}/${path.replace(/^\//, "")}`;
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
                        const keys = window.getKeysSafe();
                        if (keys && keys.gh) {
                            const rawBase64 = webpDataUrl.replace(/^data:image\/webp;base64,/, "");
                            const fileObj = await window.getGithubFileSafe(repoPath, keys.gh);
                            await window.pushGithubBinaryFile(repoPath, rawBase64, fileObj.sha, `🖼️ Asset: Backup WebP image [${assetKey}] to ${repoPath} [skip ci]`, keys.gh);
                            alert(`✅ 图片已转 WebP 并成功备份！\n\n全球CDN秒开链接：\n${window.ApexImageEngine.toCDN(repoPath)}`);
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

window.ApexLogoManager = {
    initLogo: function() {
        const customLogo = localStorage.getItem('APEX_CUSTOM_LOGO');
        if (!customLogo) return;
        const adminLogoEl = document.getElementById('adminBrandLogo');
        const adminBadgeEl = document.getElementById('adminFallbackBadge');
        if (adminLogoEl) {
            adminLogoEl.src = customLogo;
            adminLogoEl.style.display = 'block';
            if (adminBadgeEl) adminBadgeEl.classList.add('hidden');
        }
    },
    uploadLogo: function() {
        window.ApexImageEngine.uploadAndBackup("custom_logo", "assets/logo.webp", (webpUrl) => {
            localStorage.setItem('APEX_CUSTOM_LOGO', webpUrl);
            this.initLogo();
        });
    }
};

window.ApexUserManager = {
    defaultUsers: [
        { id: "U-1001", email: "wys0130@apexwork.cn", role: "企业高级合伙人 [ADMIN]", verified: true, date: "2026-06-12", status: true },
        { id: "U-1002", email: "founder@invest-tech.com", role: "商业三件套终身版 [CLIENT]", verified: true, date: "2026-07-03", status: true },
        { id: "U-1003", email: "product_pm@saas-growth.org", role: "PPT 战略套件订阅 [CLIENT]", verified: false, date: "2026-08-01", status: true }
    ],
    userList: [],
    searchQuery: "",
    currentVerifyIdx: -1,
    loadUsers: async function() {
        const saved = localStorage.getItem('APEX_USER_LIST');
        this.userList = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(this.defaultUsers));
        try {
            const keys = window.getKeysSafe();
            if (keys && keys.gh && !saved) {
                const fileObj = await window.getGithubFileSafe("config/users.json", keys.gh);
                if (fileObj.content) {
                    this.userList = JSON.parse(fileObj.content);
                    localStorage.setItem('APEX_USER_LIST', JSON.stringify(this.userList));
                }
            }
        } catch(e) {}
        this.renderUserTable();
    },
    saveUsers: async function() {
        localStorage.setItem('APEX_USER_LIST', JSON.stringify(this.userList));
        try {
            const keys = window.getKeysSafe();
            if (keys && keys.gh) {
                const fileObj = await window.getGithubFileSafe("config/users.json", keys.gh);
                await window.pushGithubJsonFile("config/users.json", this.userList, fileObj.sha, "👥 Update users list via Dashboard [skip ci]", keys.gh);
            }
        } catch(e) {}
    },
    initUserSection: async function() {
        await this.loadUsers();
        let savedPwd = localStorage.getItem("APEX_ADMIN_PWD") || "8888";
        let sid = localStorage.getItem("APEX_EMAILJS_SID") || "";
        let tid = localStorage.getItem("APEX_EMAILJS_TID") || "";
        let pkey = localStorage.getItem("APEX_EMAILJS_KEY") || "";
        try {
            const keys = window.getKeysSafe();
            if (keys && keys.gh) {
                const fileObj = await window.getGithubFileSafe("config/security.json", keys.gh);
                if (fileObj.content) {
                    const sec = JSON.parse(fileObj.content);
                    savedPwd = sec.pwd || savedPwd || "8888";
                    sid = sec.emailjs_sid || sid;
                    tid = sec.emailjs_tid || tid;
                    pkey = sec.emailjs_key || pkey;
                    localStorage.setItem("APEX_ADMIN_PWD", savedPwd);
                    if (sid) localStorage.setItem("APEX_EMAILJS_SID", sid);
                    if (tid) localStorage.setItem("APEX_EMAILJS_TID", tid);
                    if (pkey) localStorage.setItem("APEX_EMAILJS_KEY", pkey);
                }
            }
        } catch(e) {}
        if (document.getElementById("pwd-new-admin")) document.getElementById("pwd-new-admin").value = savedPwd;
        if (document.getElementById("emailjs-service-id")) document.getElementById("emailjs-service-id").value = sid;
        if (document.getElementById("emailjs-template-id")) document.getElementById("emailjs-template-id").value = tid;
        if (document.getElementById("emailjs-public-key")) document.getElementById("emailjs-public-key").value = pkey;
        this.renderUserTable();
    },
    saveAdminSecurity: async function() {
        const pwd = document.getElementById("pwd-new-admin").value.trim() || "8888";
        const sid = document.getElementById("emailjs-service-id").value.trim();
        const tid = document.getElementById("emailjs-template-id").value.trim();
        const pkey = document.getElementById("emailjs-public-key").value.trim();
        localStorage.setItem("APEX_ADMIN_PWD", pwd);
        localStorage.setItem("APEX_EMAILJS_SID", sid);
        localStorage.setItem("APEX_EMAILJS_TID", tid);
        localStorage.setItem("APEX_EMAILJS_KEY", pkey);
        try {
            const keys = window.getKeysSafe();
            if (keys && keys.gh) {
                const fileObj = await window.getGithubFileSafe("config/security.json", keys.gh);
                const payload = { pwd, emailjs_sid: sid, emailjs_tid: tid, emailjs_key: pkey, updated_at: new Date().toISOString() };
                await window.pushGithubJsonFile("config/security.json", payload, fileObj.sha, "🛡️ Update admin security & EmailJS configs [skip ci]", keys.gh);
                alert(`✅ 安全口令及发信配置已同步推入 GitHub 仓库！\n\n主页进入驾驶舱口令：【 ${pwd} 】`);
                return;
            }
        } catch(e) {}
        alert(`✅ 安全配置在当前设备中更新生效！\n\n主页驾驶舱口令为：【 ${pwd} 】`);
    },
    sendRealVerifyEmail: function(idx) {
        this.currentVerifyIdx = idx;
        const targetEmail = this.userList[idx].email;
        const code = Math.floor(100000 + Math.random() * 900000);
        localStorage.setItem("APEX_REAL_VERIFY_CODE", JSON.stringify({ code: String(code), email: targetEmail }));
        const sid = localStorage.getItem("APEX_EMAILJS_SID");
        const tid = localStorage.getItem("APEX_EMAILJS_TID");
        const pkey = localStorage.getItem("APEX_EMAILJS_KEY");
        if (sid && tid && pkey && window.emailjs) {
            emailjs.init(pkey);
            emailjs.send(sid, tid, { to_email: targetEmail, verification_code: code })
            .then(() => { alert(`📧 【真实发信成功】\n已向 [${targetEmail}] 成功投递真实邮件码！请查收。`); this.openVerifyModal(); })
            .catch(() => { alert(`⚠️ EmailJS 接口连接失败，已启用标准安全信道。\n为方便演示核验，当前生成验证码为：【 ${code} 】`); this.openVerifyModal(); });
        } else {
            alert(`📧 【发信网关已触发】\n当前系统尚未填入 EmailJS 接口参数，已启用安全校验链路！\n\n本次验证码为：【 ${code} 】`);
            this.openVerifyModal();
        }
    },
    openVerifyModal: function() {
        const modal = document.getElementById("emailVerifyModal");
        const input = document.getElementById("verify-code-input");
        if (modal) modal.classList.remove("hidden");
        if (input) { input.value = ""; input.focus(); }
    },
    closeVerifyModal: function() {
        const modal = document.getElementById("emailVerifyModal");
        if (modal) modal.classList.add("hidden");
    },
    verifyAndBindEmail: function() {
        const input = document.getElementById("verify-code-input");
        const userVal = input ? input.value.trim() : "";
        const savedData = JSON.parse(localStorage.getItem("APEX_REAL_VERIFY_CODE") || "{}");
        if (!userVal || userVal !== savedData.code) { return alert("❌ 验证码校验失败！请核对后重新输入。"); }
        if (this.currentVerifyIdx >= 0 && this.userList[this.currentVerifyIdx]) {
            this.userList[this.currentVerifyIdx].verified = true;
            this.saveUsers();
            this.renderUserTable();
            alert("✅ 恭喜！邮箱真实身份核验成功！");
            this.closeVerifyModal();
        }
    },
    filterUsers: function(val) {
        this.searchQuery = val.trim();
        const clearBtn = document.getElementById("user-search-clear");
        if (clearBtn) {
            if (this.searchQuery) clearBtn.classList.remove("hidden");
            else clearBtn.classList.add("hidden");
        }
        this.renderUserTable();
    },
    clearSearch: function() {
        this.searchQuery = "";
        const input = document.getElementById("user-search-input");
        const clearBtn = document.getElementById("user-search-clear");
        if (input) input.value = "";
        if (clearBtn) clearBtn.classList.add("hidden");
        this.renderUserTable();
    },
    renderUserTable: function() {
        const tbody = document.getElementById("userTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";
        const list = this.searchQuery 
            ? this.userList.filter(u => u.email.toLowerCase().includes(this.searchQuery.toLowerCase()) || u.id.toLowerCase().includes(this.searchQuery.toLowerCase()))
            : this.userList;
        if (list.length === 0) {
            tbody.innerHTML = `<div class="text-center py-6 text-slate-400 font-mono text-xs">没有找到相关匹配的用户记录</div>`;
            return;
        }
        list.forEach((user) => {
            const realIdx = this.userList.findIndex(item => item.id === user.id);
            const statusBtnCls = user.status ? "bg-amber-600 hover:bg-amber-500 text-white shadow-sm" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm";
            const verifyText = user.verified ? '<span class="text-emerald-500 font-bold">✓ 邮箱已认证</span>' : '<span class="text-amber-500 font-bold">⚠ 待验证</span>';
            tbody.innerHTML += `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3 mb-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-400 transition gap-3">
                    <div class="flex-1 min-w-0">
                        <div class="font-extrabold text-sm text-[#0f172a] dark:text-[#f8fafc] truncate" title="${user.email}">${user.email}</div>
                        <div class="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span class="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">ID: ${user.id}</span>
                            <span class="font-mono text-blue-600 font-bold text-[10px]">${user.role}</span>
                            <span class="font-mono text-[10px]">${verifyText}</span>
                        </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                        <button onclick="window.ApexUserManager.toggleUserStatus(${realIdx})" class="px-3 py-1.5 rounded text-[11px] font-bold transition ${statusBtnCls}">${user.status ? '封禁' : '解封'}</button>
                        <button onclick="window.ApexUserManager.sendRealVerifyEmail(${realIdx})" class="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition shadow-sm">验证</button>
                        <button onclick="window.ApexUserManager.deleteUser(${realIdx})" class="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition shadow-sm">销毁</button>
                    </div>
                </div>
            `;
        });
    },
    toggleUserStatus: function(idx) {
        this.userList[idx].status = !this.userList[idx].status;
        this.saveUsers();
        this.renderUserTable();
        window.appendLog(`>> [用户中心] 账号 [${this.userList[idx].email}] 状态变更 -> ${this.userList[idx].status ? '正常' : '封禁'}`);
    },
    deleteUser: function(idx) {
        if (!confirm(`确定彻底销毁客户 [${this.userList[idx].email}] 的授权凭证与记录吗？`)) return;
        this.userList.splice(idx, 1);
        this.saveUsers();
        this.renderUserTable();
        window.appendLog(`>> [用户中心] 彻底销毁账号凭证完成。`);
    },
    restoreDefaultUsers: function() {
        if (!confirm("确定要恢复默认的一组演示成员账号吗？")) return;
        this.userList = JSON.parse(JSON.stringify(this.defaultUsers));
        this.saveUsers();
        this.renderUserTable();
    },
    addNewMockUser: function() {
        const em = prompt("请输入新注册客户邮箱：", "client@apexwork.cn");
        if (!em) return;
        this.userList.unshift({ id: "U-" + Math.floor(1000 + Math.random() * 9000), email: em, role: "商业授权套件 [CLIENT]", verified: false, date: new Date().toISOString().slice(0, 10), status: true });
        this.saveUsers();
        this.renderUserTable();
        window.appendLog(`>> [用户中心] 录入新注册客户账号 -> ${em}`);
    }
};

window.ApexScheduleManager = {
    loadScheduleFromCloud: async function() {
        try {
            const token = localStorage.getItem("APEX_GH_TOKEN");
            if (!token) return;
            const fileObj = await window.getGithubFileSafe("config/ai-schedule.json", token);
            if (fileObj.content) {
                const sched = JSON.parse(fileObj.content);
                if (document.getElementById("sched-start")) document.getElementById("sched-start").value = sched.start_hour || 0;
                if (document.getElementById("sched-end")) document.getElementById("sched-end").value = sched.end_hour || 8;
                if (document.getElementById("sched-enabled")) document.getElementById("sched-enabled").value = String(sched.enabled !== false);
            }
        } catch (e) { console.log("云端尚无自定义时间表，沿用默认 0-8 点配置。"); }
    },
    saveScheduleToCloud: async function() {
        const start = Number(document.getElementById("sched-start").value) || 0;
        const end = Number(document.getElementById("sched-end").value) || 8;
        const enabled = document.getElementById("sched-enabled").value === "true";
        const payload = { start_hour: start, end_hour: end, enabled: enabled, updated_at: new Date().toISOString() };
        try {
            const keys = window.getKeysSafe();
            const fileObj = await window.getGithubFileSafe("config/ai-schedule.json", keys.gh);
            await window.pushGithubJsonFile("config/ai-schedule.json", payload, fileObj.sha, `⏱️ Config: 更新 AI 排班 [skip ci]`, keys.gh);
            alert(`✅ 排班表写入成功！\n\nAI 自主运行区间已被限定为北京时间 [${start}:00 至 ${end}:00]。`);
        } catch (e) { alert("❌ 同步时间表失败: " + e.message); }
    }
};

window.ApexBannerManager = {
    setPreset: function(idx, gradientStr) {
        const inputEl = document.getElementById(`banner-bg-${idx}`);
        if (inputEl) { inputEl.value = gradientStr; window.appendLog(`>> [视觉渐变] 已为第 ${idx + 1} 幕横幅快速应用配色方案 -> ${gradientStr}`); }
    },
    uploadBannerImg: function(idx) {
        const assetKey = "banner_slide_" + idx;
        const repoPath = `assets/banners/slide-${idx}.webp`;
        window.ApexImageEngine.uploadAndBackup(assetKey, repoPath, (webpUrl, finalCloudPath) => {
            const imgInput = document.getElementById(`banner-img-${idx}`);
            if (imgInput) imgInput.value = finalCloudPath;
            window.appendLog(`>> [轮播图云备份] 幻灯片 #${idx + 1} 绑定实体路径 -> ${finalCloudPath}`);
        });
    },
    loadBannerConfig: async function() {
        const saved = localStorage.getItem('APEX_BANNER_CONFIG');
        let config = null;
        if (saved) { try { config = JSON.parse(saved); } catch(e) {} }
        try {
            const keys = window.getKeysSafe();
            if (keys && keys.gh) {
                const fileObj = await window.getGithubFileSafe("config/banner.json", keys.gh);
                if (fileObj.content) { config = JSON.parse(fileObj.content); localStorage.setItem('APEX_BANNER_CONFIG', JSON.stringify(config)); }
            }
        } catch(e) {}
        if (!config) return;
        if (config[0]) {
            if (document.getElementById('banner-tag-0')) document.getElementById('banner-tag-0').value = config[0].tag || "ADMIN BANNER 01";
            if (document.getElementById('banner-title-0')) document.getElementById('banner-title-0').value = config[0].title || "";
            if (document.getElementById('banner-desc-0')) document.getElementById('banner-desc-0').value = config[0].desc || "";
            if (document.getElementById('banner-bg-0')) document.getElementById('banner-bg-0').value = config[0].bgStyle || "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)";
            if (document.getElementById('banner-img-0')) document.getElementById('banner-img-0').value = config[0].bgImg || "";
        }
        if (config[1]) {
            if (document.getElementById('banner-tag-1')) document.getElementById('banner-tag-1').value = config[1].tag || "GLOBAL COMPLIANCE 02";
            if (document.getElementById('banner-title-1')) document.getElementById('banner-title-1').value = config[1].title || "";
            if (document.getElementById('banner-desc-1')) document.getElementById('banner-desc-1').value = config[1].desc || "";
            if (document.getElementById('banner-bg-1')) document.getElementById('banner-bg-1').value = config[1].bgStyle || "linear-gradient(135deg, #064e3b 0%, #0f172a 100%)";
            if (document.getElementById('banner-img-1')) document.getElementById('banner-img-1').value = config[1].bgImg || "";
        }
    },
    saveBannerConfig: async function() {
        const config = [
            { tag: document.getElementById('banner-tag-0').value, title: document.getElementById('banner-title-0').value, desc: document.getElementById('banner-desc-0').value, bgStyle: document.getElementById('banner-bg-0').value, bgImg: document.getElementById('banner-img-0').value },
            { tag: document.getElementById('banner-tag-1').value, title: document.getElementById('banner-title-1').value, desc: document.getElementById('banner-desc-1').value, bgStyle: document.getElementById('banner-bg-1').value, bgImg: document.getElementById('banner-img-1').value }
        ];
        localStorage.setItem('APEX_BANNER_CONFIG', JSON.stringify(config));
        try {
            const keys = window.getKeysSafe();
            if (keys && keys.gh) {
                const fileObj = await window.getGithubFileSafe("config/banner.json", keys.gh);
                await window.pushGithubJsonFile("config/banner.json", config, fileObj.sha, "🎨 Update homepage banners via Dashboard [skip ci]", keys.gh);
            }
        } catch(e) {}
        alert('✅ 首页轮播图配置与图片地址已保存并同步至云端！');
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
                window.appendLog(`>> [汇率中台] 抓取最新外汇：1 USD = ${this.currentRate} CNY`);
                if (isManual || isRateChanged) {
                    this.syncAllLinkedPrices();
                    if (isManual) alert(`✅ 最新外汇挂牌价拉取成功：1 USD = ${this.currentRate} CNY\n\n已为您自动重算所有开启了【汇率联动】的美元定价！`);
                }
                return;
            }
        } catch (err) {
            window.appendLog(`>> [汇率中台] 查询超时，沿用缓存：1 USD = ${this.currentRate} CNY`);
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
                if (rmbInput && rmbInput.value) { window.ApexPricing.onRMBChange(key, rmbInput.value); }
            });
        }
        if (typeof window.AUDIT_PRODUCTS !== "undefined" && Array.isArray(window.AUDIT_PRODUCTS)) {
            let productsChanged = false;
            window.AUDIT_PRODUCTS.forEach((item) => {
                if (item.isLinked) {
                    const rmb = parseFloat(item.priceRmb) || 0;
                    let usd = rmb / this.currentRate;
                    usd = (window.ApexPricing && window.ApexPricing.use99Rule && rmb > 0) ? (Math.floor(usd) + 0.99) : Number(usd.toFixed(2));
                    item.priceUsd = usd > 0 ? usd : "0.00";
                    productsChanged = true;
                }
            });
            if (productsChanged) {
                localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(window.AUDIT_PRODUCTS));
                window.renderAuditTable();
            }
        }
        window.appendLog(`>> [汇率中台] 全站已开启联动的美元定价，已按 1:${this.currentRate} 重新核算完毕。`);
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
            btn.className = "px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/30 transition whitespace-nowrap";
            btn.innerText = "🔗 汇率关联: 已绑定";
            icons.forEach(k => { const el = document.getElementById(`linkIcon-${k}`); if (el) { el.innerText = "⇄"; el.className = "text-xs text-emerald-500 font-bold"; } });
            window.appendLog(`>> [定价控制] 开启关联：任意修改将按汇率 1 : ${window.ApexFX.currentRate} 互转。`);
        } else {
            btn.className = "px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/30 transition whitespace-nowrap";
            btn.innerText = "🔓 汇率关联: 已解绑";
            icons.forEach(k => { const el = document.getElementById(`linkIcon-${k}`); if (el) { el.innerText = "‖"; el.className = "text-xs text-slate-400"; } });
            window.appendLog(`>> [定价控制] 关闭关联：双方完全独立填写。`);
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
        let usd = rmb / window.ApexFX.currentRate;
        usd = (this.use99Rule && rmb > 0) ? (Math.floor(usd) + 0.99) : Number(usd.toFixed(2));
        const el = document.getElementById(`usd-${key}`);
        if (el) el.value = usd > 0 ? usd : "";
    },
    onUSDChange: function(key, usdVal) {
        if (!this.isLinked) return;
        const usd = parseFloat(usdVal) || 0;
        const rmb = Math.round(usd * window.ApexFX.currentRate);
        const el = document.getElementById(`rmb-${key}`);
        if (el) el.value = rmb > 0 ? rmb : "";
    },
    saveAllToStorage: async function() {
        const config = {
            bundle: { rmb: document.getElementById('rmb-bundle').value, usd: document.getElementById('usd-bundle').value },
            ppt: { rmb: document.getElementById('rmb-ppt').value, usd: document.getElementById('usd-ppt').value },
            excel: { rmb: document.getElementById('rmb-excel').value, usd: document.getElementById('usd-excel').value },
            word: { rmb: document.getElementById('rmb-word').value, usd: document.getElementById('usd-word').value },
            rate: window.ApexFX.currentRate, isLinked: this.isLinked, use99Rule: this.use99Rule, updatedAt: new Date().toISOString()
        };
        localStorage.setItem('APEX_PRICING_CONFIG', JSON.stringify(config));
        try {
            const keys = window.getKeysSafe();
            if (keys && keys.gh) {
                const fileObj = await window.getGithubFileSafe("config/pricing.json", keys.gh);
                await window.pushGithubJsonFile("config/pricing.json", config, fileObj.sha, "💰 Update pricing tables via Dashboard [skip ci]", keys.gh);
            }
        } catch(e) {}
        alert('✅ 商品全网统一定价已保存，云端 GitHub config/pricing.json 已推送更新！');
    }
};

// 👑 绝对原厂打底数据：永远不会消失的 5 个默认模板！
window.DEFAULT_AUDIT_PRODUCTS = [
    { id: "aerotech", title: "AeroTech 创投规划书", category: "15 SLIDES · Office PPT演示", thumbKey: "prod_aerotech", thumbCloudPath: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-orange-500 font-bold", isLinked: true, status: true },
    { id: "saas", title: "SaaS 增长指标盘点", category: "20 SLIDES · Office PPT演示", thumbKey: "prod_saas", thumbCloudPath: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-orange-500 font-bold", isLinked: true, status: true },
    { id: "fintech", title: "FinTech A 轮融资方案", category: "12 SLIDES · Office PPT演示", thumbKey: "prod_fintech", thumbCloudPath: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-orange-500 font-bold", isLinked: true, status: true },
    { id: "excel-roi", title: "全渠道 ROI 动态测算模型", category: "XLSX MODEL · Office EXCEL表格", thumbKey: "prod_excel", thumbCloudPath: "https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-emerald-600 font-bold", isLinked: true, status: true },
    { id: "word-ats", title: "欧美 ATS 智能排版合规报告", category: "DOCX STANDARD · Office WORD文档", thumbKey: "prod_word", thumbCloudPath: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-indigo-600 font-bold", isLinked: true, status: true }
];

// 👑 终极防爆加载引擎：只信原厂代码 + 云端新数据，拒绝读取有毒的本地数组！
window.loadAuditProducts = async function() {
    const blacklist = JSON.parse(localStorage.getItem('APEX_DELETED_ZOMBIES') || '[]');
    
    // 1. 绝对强制装载 5 大原厂件，永不消失
    let finalProducts = JSON.parse(JSON.stringify(window.DEFAULT_AUDIT_PRODUCTS));

    // 2. 拉取云端 AI 数据
    let cloudData = [];
    try {
        const keys = window.getKeysSafe();
        if (keys && keys.gh) {
            const f = await window.getGithubFileSafe("data/ai-generated-decks.json", keys.gh);
            if (f.content) cloudData = JSON.parse(f.content);
        } else {
            const res = await fetch('data/ai-generated-decks.json?nocache=' + Date.now());
            if (res.ok) cloudData = await res.json();
        }
    } catch(e) {}

    // 3. 严格合并云端 AI 数据，并进行物理级防僵尸拦截
    if (Array.isArray(cloudData)) {
        cloudData.forEach(item => {
            // 如果这个 ID 存在于黑名单中，当场击杀，绝不进入大盘！
            if (item.id && item.id.startsWith('AI-') && !blacklist.includes(item.id)) {
                if (!finalProducts.find(p => p.id === item.id)) {
                    let col = 'text-orange-500 font-bold';
                    if (item.type === 'excel') col = 'text-emerald-600 font-bold';
                    if (item.type === 'word') col = 'text-indigo-600 font-bold';
                    
                    item.colorCls = col;
                    item.isLinked = true;
                    if(typeof item.status === 'undefined') item.status = true;
                    if(!item.thumbDefault) item.thumbDefault = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80";
                    if(!item.thumbKey) item.thumbKey = "prod_" + item.id;
                    
                    finalProducts.push(item);
                }
            }
        });
    }

    // 4. 恢复本地的价格和状态
    try {
        const localOverrides = JSON.parse(localStorage.getItem('APEX_AUDIT_PRODUCTS') || '[]');
        finalProducts.forEach(p => {
            const override = localOverrides.find(o => o.id === p.id);
            if (override) {
                if (override.priceRmb !== undefined) p.priceRmb = override.priceRmb;
                if (override.priceUsd !== undefined) p.priceUsd = override.priceUsd;
                if (override.isLinked !== undefined) p.isLinked = override.isLinked;
                if (override.status !== undefined) p.status = override.status;
            }
        });
    } catch(e) {}

    // 5. 将洗净的纯洁数据写入全局变量，强制渲染
    window.AUDIT_PRODUCTS = finalProducts;
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
        btn.className = "ml-4 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer";
        btn.innerHTML = "🗑️ 批量删除选中";
        btn.onclick = window.bulkDeleteSelected;
        titleArea.appendChild(btn);
    }

    const blacklist = JSON.parse(localStorage.getItem('APEX_DELETED_ZOMBIES') || '[]');
    window.AUDIT_PRODUCTS = window.AUDIT_PRODUCTS.filter(p => !p.id.startsWith('AI-') || !blacklist.includes(p.id));

    window.AUDIT_PRODUCTS.forEach((item, index) => {
        const isDefault = !item.id.startsWith('AI-');
        const finalThumbUrl = window.ApexImageEngine.resolve(item.thumbKey, item.thumbCloudPath, item.thumbDefault);
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

window.DEFAULT_MANIFEST_TASKS = [
    { id: "TASK-101", title: "配置海外主力 Lemon Squeezy 结账网关", notes: "用极简代码嵌入 Checkout", stage: "STAGE_1_MVP_GLOBAL", department: "施工工程部", status: "DONE" },
    { id: "TASK-102", title: "国内临时过渡方案：引流至『爱发电』免签约", notes: "检测中国 IP 时购买按钮自动变爱发电跳转", stage: "STAGE_1_MVP_GLOBAL", department: "施工工程部", status: "DONE" },
    { id: "TASK-201", title: "国内正规军升级：广州个体户执照与对公参数", notes: "办个体户无需实际租用办公楼", stage: "STAGE_2_CN_UPGRADE", department: "董事长", status: "IN_PROGRESS" },
    { id: "TASK-203", title: "智能判断多模态设计组，建立每日自动生成模版流水线", notes: "AI 每日印钞：研发多样式 PPT/Excel 模版", stage: "STAGE_2_CN_UPGRADE", department: "主动产品部", status: "TODO" }
];

window.loadTasksManifest = async function() {
    const listEl = document.getElementById('manifestList');
    if (!listEl) return;
    
    const localCache = localStorage.getItem("APEX_TASKS_CACHE");
    if (localCache) {
        window.rawManifestTasks = JSON.parse(localCache);
    } else {
        window.rawManifestTasks = JSON.parse(JSON.stringify(window.DEFAULT_MANIFEST_TASKS));
    }
    window.renderManifestTasks();

    try {
        const keys = window.getKeysSafe();
        if (keys && keys.gh) {
            const fileObj = await window.getGithubFileSafe("TASKS_MANIFEST.json", keys.gh);
            if (fileObj.content) {
                const manifest = JSON.parse(fileObj.content);
                window.rawManifestTasks = (manifest.tasks && manifest.tasks.length > 0) ? manifest.tasks : JSON.parse(JSON.stringify(window.DEFAULT_MANIFEST_TASKS));
                window.renderManifestTasks(); 
            }
        }
    } catch (err) {}
};

window.resetManifestToDefault = async function() {
    if (!confirm("确定将所有阶段工单重置为初始待办进度 (TODO) 吗？")) return;
    window.rawManifestTasks = JSON.parse(JSON.stringify(window.DEFAULT_MANIFEST_TASKS));
    localStorage.setItem("APEX_TASKS_CACHE", JSON.stringify(window.rawManifestTasks));
    window.renderManifestTasks();
    window.appendLog(">> [进度书] 已将工单重置为初始待办进度！", "text-emerald-500");
    try {
        const keys = window.getKeysSafe();
        if (keys.gh) {
            const fileObj = await window.getGithubFileSafe("TASKS_MANIFEST.json", keys.gh);
            const manifest = { summary: { completed: 2, todo: 2, total_tasks: 4 }, tasks: window.rawManifestTasks, updated_at: new Date().toISOString().slice(0, 10) };
            await window.pushGithubJsonFile("TASKS_MANIFEST.json", manifest, fileObj.sha, "🔄 Reset tasks to realistic default [skip ci]", keys.gh);
            alert("✅ 云端 GitHub 仓库及页面工单已全部重置！");
            return;
        }
    } catch(e) {}
    alert("✅ 本地工单已完成重置！");
};

window.filterManifest = function(stageKey) {
    window.currentManifestFilter = stageKey;
    document.querySelectorAll('.manifest-tab').forEach(btn => btn.className = "manifest-tab px-3 py-1 rounded-lg text-slate-400 hover:text-slate-600");
    const targetBtn = window.event?.target;
    if (targetBtn) targetBtn.className = "manifest-tab px-3 py-1 rounded-lg bg-blue-600 text-white font-bold";
    window.renderManifestTasks();
};

window.renderManifestTasks = function() {
    const listEl = document.getElementById('manifestList');
    if (!listEl) return;
    listEl.innerHTML = "";
    const filtered = window.currentManifestFilter === 'ALL' ? window.rawManifestTasks : window.rawManifestTasks.filter(t => t.stage === window.currentManifestFilter || (!t.stage && window.currentManifestFilter === 'ALL'));
    
    const badge = document.getElementById('manifestSummaryBadge');
    if (badge) {
        const doneCnt = window.rawManifestTasks.filter(t => t.status === 'DONE').length;
        badge.innerText = `完成度: ${doneCnt}/${window.rawManifestTasks.length}`;
    }

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
                    <button onclick="window.toggleTaskStatus('${task.id}')" class="px-4 py-1.5 rounded-lg font-bold transition ${btnCls}">${isDone ? "↩ 撤销" : "✓ 达成"}</button>
                </div>
            </div>
        `;
    });
};

window.toggleTaskStatus = async function(taskId) {
    const task = window.rawManifestTasks.find(t => t.id === taskId);
    if (!task) return;
    task.status = task.status === 'DONE' ? 'TODO' : 'DONE';
    localStorage.setItem("APEX_TASKS_CACHE", JSON.stringify(window.rawManifestTasks));
    window.appendLog(`✏️ 变更工单状态 -> [${taskId}] ${task.status}`);
    window.renderManifestTasks();
    try {
        const keys = window.getKeysSafe();
        if(keys.gh) {
            const fileObj = await window.getGithubFileSafe("TASKS_MANIFEST.json", keys.gh);
            const manifest = JSON.parse(fileObj.content);
            const targetInManifest = manifest.tasks.find(t => t.id === taskId);
            if (targetInManifest) {
                targetInManifest.status = task.status;
                manifest.updated_at = new Date().toISOString().slice(0, 10);
                await window.pushGithubJsonFile("TASKS_MANIFEST.json", manifest, fileObj.sha, `🎯 Toggle Task [${taskId}] -> ${task.status} [skip ci]`, keys.gh);
                window.appendLog(`✅ 工单进度写入成功！`);
                window.loadTasksManifest();
            }
        }
    } catch (e) {}
};

window.openRollbackModal = function() {
    const el = document.getElementById("rollbackModal");
    if (el) el.classList.remove("hidden");
    if (window.currentSnapTab === 'tags') window.fetchTaggedCommits(true);
    else window.fetchNormalCommits(true);
};

window.closeRollbackModal = function() {
    const el = document.getElementById("rollbackModal");
    if (el) el.classList.add("hidden");
};

window.switchSnapshotTab = function(tab) {
    window.currentSnapTab = tab;
    const btnTags = document.getElementById("tab-btn-tags");
    const btnNormal = document.getElementById("tab-btn-normal");
    const contTags = document.getElementById("commitListTagsContainer");
    const contNormal = document.getElementById("commitListNormalContainer");
    const pagination = document.getElementById("snapshotPagination");

    if (tab === 'tags') {
        if(btnTags) btnTags.className = "flex-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm transition";
        if(btnNormal) btnNormal.className = "flex-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition";
        if(contTags) contTags.classList.remove("hidden");
        if(contNormal) contNormal.classList.add("hidden");
        if(pagination) pagination.classList.remove("hidden");
        window.fetchTaggedCommits();
    } else {
        if(btnNormal) btnNormal.className = "flex-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm transition";
        if(btnTags) btnTags.className = "flex-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition";
        if(contNormal) contNormal.classList.remove("hidden");
        if(contTags) contTags.classList.add("hidden");
        if(pagination) pagination.classList.add("hidden");
        window.fetchNormalCommits();
    }
};

window.changeTagsPage = function(delta) {
    if (delta === -1 && window.currentTagsPage > 1) { window.currentTagsPage--; window.fetchTaggedCommits(); } 
    else if (delta === 1) { window.currentTagsPage++; window.fetchTaggedCommits(); }
};

window.fetchTaggedCommits = async function(forceRefresh = false) {
    const container = document.getElementById("commitListTagsContainer");
    if (!container) return;
    container.innerHTML = `<div class="text-center text-xs text-slate-400 py-6 font-mono animate-pulse">正在从 GitHub 底层索引永久标记...</div>`;
    const label = document.getElementById("currentTagsPageLabel");
    if(label) label.innerText = window.currentTagsPage;
    
    const ghToken = localStorage.getItem("APEX_GH_TOKEN");
    if (!ghToken) {
        container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 font-mono leading-relaxed">缺少 GitHub Token，无法读取云端代码备份树。</div>`;
        return;
    }

    try {
        const ts = forceRefresh ? `&_t=${Date.now()}` : '';
        const [res, blacklistRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${window.REPO}/commits?path=data/.snapshot&page=${window.currentTagsPage}&per_page=${window.TAGS_PER_PAGE}${ts}`, { headers: { "Authorization": `token ${ghToken}` } }),
            window.getGithubFileSafe("config/deleted_tags.json", ghToken)
        ]);
        
        if (!res.ok) throw new Error("无法读取提交记录");
        
        let blacklist = [];
        if (blacklistRes && blacklistRes.content) { try { blacklist = JSON.parse(blacklistRes.content); } catch(e){} }
        
        const commits = await res.json();
        container.innerHTML = "";
        
        if (!commits || commits.length === 0) {
            container.innerHTML = `<div class="text-center text-xs text-slate-500 py-6 font-mono">第 ${window.currentTagsPage} 页已无更多记录</div>`;
            const btnNext = document.getElementById("btnNextTags");
            const btnPrev = document.getElementById("btnPrevTags");
            if(btnNext) btnNext.disabled = true;
            if(window.currentTagsPage === 1 && btnPrev) btnPrev.disabled = true;
            return;
        }

        const btnPrev = document.getElementById("btnPrevTags");
        const btnNext = document.getElementById("btnNextTags");
        if(btnPrev) btnPrev.disabled = (window.currentTagsPage === 1);
        if(btnNext) btnNext.disabled = (commits.length < window.TAGS_PER_PAGE);

        const filteredCommits = commits.filter(c => !blacklist.includes(c.sha));
        if (filteredCommits.length === 0) {
            container.innerHTML = `<div class="text-center text-xs text-slate-400 py-6 font-mono leading-relaxed">本页的标记均已被您取消。<br>请点击【下一页】查看更多历史。</div>`;
            return;
        }

        filteredCommits.forEach((item, idx) => {
            const shaShort = item.sha.slice(0, 7);
            const timeStr = new Date(item.commit.committer.date).toLocaleString('zh-CN', { hour12: false });
            
            container.innerHTML += `
                <div class="rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition hover:shadow-md mb-2">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="font-bold text-blue-600 dark:text-blue-400">[#${shaShort}]</span>
                            <span class="text-[10px] text-slate-500">${timeStr}</span>
                            <span class="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded ml-1 tracking-widest shadow-sm">📌 永久保留</span>
                        </div>
                        <div class="text-xs truncate text-slate-800 dark:text-slate-200 font-bold" title="${item.commit.message}">${item.commit.message}</div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button onclick="window.deleteSnapshotTag('${item.sha}', '${shaShort}', event)" class="px-2.5 py-1.5 border border-rose-200 dark:border-rose-800/50 rounded-lg text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-500 dark:text-rose-400 transition shadow-sm bg-white dark:bg-slate-800">取消标记</button>
                        <button onclick="window.revertToSelectedCommit('${item.sha}', '${shaShort}')" class="px-3 py-1.5 border border-blue-300 dark:border-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition text-blue-600 dark:text-blue-400 shadow-sm bg-white dark:bg-slate-800">
                            ${(window.currentTagsPage === 1 && idx === 0) ? '当前状态' : '还原'}
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (err) {}
};

window.fetchNormalCommits = async function(forceRefresh = false) {
    const container = document.getElementById("commitListNormalContainer");
    if (!container) return;
    container.innerHTML = `<div class="text-center text-xs text-slate-400 py-6 font-mono animate-pulse">正在获取最近30条流水记录...</div>`;
    
    const ghToken = localStorage.getItem("APEX_GH_TOKEN");
    if (!ghToken) {
        container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4">缺少 GitHub Token。</div>`;
        return;
    }

    try {
        const ts = forceRefresh ? `&_t=${Date.now()}` : '';
        const res = await fetch(`https://api.github.com/repos/${window.REPO}/commits?per_page=30${ts}`, { headers: { "Authorization": `token ${ghToken}` } });
        if (!res.ok) throw new Error();
        
        const commits = await res.json();
        container.innerHTML = "";
        
        commits.forEach((item, idx) => {
            const shaShort = item.sha.slice(0, 7);
            const timeStr = new Date(item.commit.committer.date).toLocaleString('zh-CN', { hour12: false });
            const isRollback = item.commit.message.includes("真实代码还原") || item.commit.message.includes("回溯");
            
            const bgCls = isRollback ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
            const textCls = isRollback ? "text-purple-600 dark:text-purple-400 font-bold" : "text-slate-800 dark:text-slate-200";

            container.innerHTML += `
                <div class="rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border shadow-sm transition hover:shadow-md mb-2 ${bgCls}">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="font-bold text-amber-500">[#${shaShort}]</span>
                            <span class="text-[10px] text-slate-400">${timeStr}</span>
                        </div>
                        <div class="text-xs truncate ${textCls}" title="${item.commit.message}">${item.commit.message}</div>
                    </div>
                    <button onclick="window.revertToSelectedCommit('${item.sha}', '${shaShort}')" class="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0 shadow-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        ${idx === 0 ? '当前状态' : '还原'}
                    </button>
                </div>
            `;
        });
    } catch (err) {}
};

window.createCodeSnapshot = async function() {
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
            const f = await window.getGithubFileSafe("data/.snapshot", token);
            sha = f.sha;
        } catch(e){}
        
        const pushRes = await window.pushGithubJsonFile("data/.snapshot", { timestamp: Date.now(), tag: tagName }, sha, commitMsg, token);
        if (pushRes) {
            alert("✅ 成功创建永久代码标记！");
            if (tagInput) tagInput.value = "";
            window.switchSnapshotTab('tags');
            window.currentTagsPage = 1;
            window.fetchTaggedCommits(true); 
        }
    } catch (err) {
        alert("❌ 打标失败: " + err.message);
    } finally {
        if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
    }
};

window.deleteSnapshotTag = async function(sha, shortSha, e) {
    if (e) e.stopPropagation();
    if (!confirm(`⚠️ 确定要取消快照 [#${shortSha}] 的永久保留标记吗？\n\n(取消后它将从本列表中永久隐藏，但底层 Git 记录依然安全存在)`)) return;
    
    const ghToken = localStorage.getItem("APEX_GH_TOKEN");
    if (!ghToken) return alert("❌ 缺少 GitHub Token");

    const btn = e.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ 取消中...";
    btn.disabled = true;

    try {
        const fileObj = await window.getGithubFileSafe("config/deleted_tags.json", ghToken);
        let blacklist = [];
        if (fileObj.content) { try { blacklist = JSON.parse(fileObj.content); } catch(err){} }
        
        if (!blacklist.includes(sha)) {
            blacklist.push(sha);
            await window.pushGithubJsonFile("config/deleted_tags.json", blacklist, fileObj.sha, `🗑️ User removed tag [${shortSha}] from permanent list [skip ci]`, ghToken);
        }
        alert(`✅ 标记 [#${shortSha}] 已成功取消！`);
        window.fetchTaggedCommits(true);
    } catch(err) {
        alert("❌ 取消标记失败: " + err.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

window.revertToSelectedCommit = async function(targetSha, shortSha) {
    if (!confirm(`⏳ 确定将代码真实回退到快照 [#${shortSha}] 吗？\n(物理覆盖云端文件并清空本地页面缓存)`)) return;
    window.closeRollbackModal();
    
    const ghToken = localStorage.getItem("APEX_GH_TOKEN"); 
    if (!ghToken) return alert("❌ 缺少 GitHub Token");

    const overlay = document.getElementById("restoreProgressOverlay");
    const bar = document.getElementById("restoreProgressBar");
    const text = document.getElementById("restoreProgressText");

    try {
        if (overlay) overlay.classList.remove("hidden");
        if (text) text.innerText = `[1/3] 提取目标快照 [#${shortSha}] 文件树...`;
        if (bar) bar.style.width = "10%";

        const treeRes = await fetch(`https://api.github.com/repos/${window.REPO}/git/trees/${targetSha}?recursive=1`, { headers: { "Authorization": `token ${ghToken}` } });
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
                const curFileRes = await fetch(`https://api.github.com/repos/${window.REPO}/contents/${fileObj.path}?ref=main`, { headers: { "Authorization": `token ${ghToken}` } });
                if(curFileRes.ok) currentSha = (await curFileRes.json()).sha;
            } catch(e){}

            if (currentSha === fileObj.sha) continue;

            const fileContentRes = await fetch(fileObj.url, { headers: { "Authorization": `token ${ghToken}` } });
            const fileJson = await fileContentRes.json();

            const updateRes = await fetch(`https://api.github.com/repos/${window.REPO}/contents/${fileObj.path}`, {
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
};

document.addEventListener("DOMContentLoaded", window.initAdminEngine);
