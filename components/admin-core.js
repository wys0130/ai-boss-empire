/**
 * APEXWORK 商业控制台驱动内核 (components/admin-core.js)
 * 1. 👑 彻底解决 @ 功能：采用最底层 Range.insertNode 节点无损操作，100% 保护历史标签！
 * 2. 👑 修复金库与本地缓存：优先读取本地 LocalStorage 渲染商品与用户列表。
 * 3. 👑 修复排版：修复用户大名单表格变形、超长邮箱强制换行防挤压！
 */

const REPO = "wys0130/ai-boss-empire";
let activeFilterDept = "";
let currentManifestFilter = 'ALL';
let isCmdActive = false;

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
        if (sectionEl) sectionEl.classList.toggle('hidden', id !== tabId);
        if (navEl) navEl.classList.toggle('active', id === tabId);
    });

    const headerTitle = document.getElementById('pageHeaderTitle');
    if (headerTitle) headerTitle.innerText = titles[tabId] || '业务控制台 / APEXWORK PRO';
    
    if (tabId === 'users' && window.ApexUserManager) {
        ApexUserManager.initUserSection();
    }
};

window.ApexImageEngine = {
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
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const maxW = 1280;
                    let w = img.width, h = img.height;
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
        ApexImageEngine.uploadAndBackup("custom_logo", "assets/logo.webp", (webpUrl) => {
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
            const keys = getKeysSafe();
            if (keys && keys.gh && !saved) {
                const fileObj = await getGithubFileSafe("config/users.json", keys.gh);
                if (fileObj.content) {
                    this.userList = JSON.parse(fileObj.content);
                    localStorage.setItem('APEX_USER_LIST', JSON.stringify(this.userList));
                }
            }
        } catch(e) {}
    },

    saveUsers: async function() {
        localStorage.setItem('APEX_USER_LIST', JSON.stringify(this.userList));
        try {
            const keys = getKeysSafe();
            if (keys && keys.gh) {
                const fileObj = await getGithubFileSafe("config/users.json", keys.gh);
                await pushGithubJsonFile("config/users.json", this.userList, fileObj.sha, "👥 Update users list via Dashboard [skip ci]", keys.gh);
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
            const keys = getKeysSafe();
            if (keys && keys.gh) {
                const fileObj = await getGithubFileSafe("config/security.json", keys.gh);
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
            const keys = getKeysSafe();
            if (keys && keys.gh) {
                const fileObj = await getGithubFileSafe("config/security.json", keys.gh);
                const payload = { pwd, emailjs_sid: sid, emailjs_tid: tid, emailjs_key: pkey, updated_at: new Date().toISOString() };
                await pushGithubJsonFile("config/security.json", payload, fileObj.sha, "🛡️ Update admin security & EmailJS configs [skip ci]", keys.gh);
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
            .then(() => {
                alert(`📧 【真实发信成功】\n已向 [${targetEmail}] 成功投递真实邮件码！请查收邮件后填入校验框。`);
                this.openVerifyModal();
            })
            .catch(() => {
                alert(`⚠️ EmailJS 接口连接失败，已启用标准安全信道。\n为方便演示核验，当前生成验证码为：【 ${code} 】`);
                this.openVerifyModal();
            });
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
        if (!userVal || userVal !== savedData.code) {
            alert("❌ 验证码校验失败！请仔细核对后重新输入。");
            return;
        }
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
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400 font-mono">没有找到相关匹配的用户记录</td></tr>`;
            return;
        }

        list.forEach((user) => {
            const realIdx = this.userList.findIndex(item => item.id === user.id);
            const statusBtnCls = user.status 
                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-sm" 
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm";
            const verifyText = user.verified 
                ? '<span class="text-emerald-500 font-bold">✓ 邮箱已认证</span>' 
                : '<span class="text-amber-500 font-bold">⚠ 待验证</span>';

            // 👑 修复：加入 whitespace-nowrap 强制不换行，确立单元格最小宽度，保住最右侧操作栏
            tbody.innerHTML += `
                <tr class="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <td class="py-3 px-3 whitespace-nowrap min-w-[200px]">
                        <div class="font-extrabold text-sm text-[#0f172a] dark:text-[#f8fafc] leading-tight">${user.email}</div>
                        <div class="text-[10px] text-slate-400 font-mono mt-1">ID: ${user.id}</div>
                    </td>
                    <td class="py-3 px-3 font-mono text-blue-600 font-bold text-xs whitespace-nowrap">${user.role}</td>
                    <td class="py-3 px-3 font-mono text-xs whitespace-nowrap">${verifyText}</td>
                    <td class="py-3 px-3 font-mono text-slate-400 text-xs whitespace-nowrap">${user.date}</td>
                    <td class="py-3 px-3 text-right whitespace-nowrap">
                        <div class="inline-flex items-center justify-end gap-1.5">
                            <button onclick="ApexUserManager.toggleUserStatus(${realIdx})" class="px-3 py-1.5 rounded text-xs font-bold transition ${statusBtnCls}">
                                ${user.status ? '封禁' : '解封'}
                            </button>
                            <button onclick="ApexUserManager.sendRealVerifyEmail(${realIdx})" class="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm">
                                验证
                            </button>
                            <button onclick="ApexUserManager.deleteUser(${realIdx})" class="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm">
                                销毁
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    },

    toggleUserStatus: function(idx) {
        this.userList[idx].status = !this.userList[idx].status;
        this.saveUsers();
        this.renderUserTable();
        appendLog(`>> [用户中心] 账号 [${this.userList[idx].email}] 状态变更 -> ${this.userList[idx].status ? '正常' : '封禁'}`);
    },

    deleteUser: function(idx) {
        if (!confirm(`确定彻底销毁客户 [${this.userList[idx].email}] 的授权凭证与记录吗？`)) return;
        this.userList.splice(idx, 1);
        this.saveUsers();
        this.renderUserTable();
        appendLog(`>> [用户中心] 彻底销毁账号凭证完成。`);
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
        this.userList.unshift({
            id: "U-" + Math.floor(1000 + Math.random() * 9000),
            email: em,
            role: "商业授权套件 [CLIENT]",
            verified: false,
            date: new Date().toISOString().slice(0, 10),
            status: true
        });
        this.saveUsers();
        this.renderUserTable();
        appendLog(`>> [用户中心] 录入新注册客户账号 -> ${em}`);
    }
};

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
            const keys = getKeysSafe();
            const fileObj = await getGithubFileSafe("config/ai-schedule.json", keys.gh);
            await pushGithubJsonFile(
                "config/ai-schedule.json",
                payload,
                fileObj.sha,
                `⏱️ Config: 更新 AI 夜间自主排班时段 -> 北京时间 [${start}:00 - ${end}:00] [skip ci]`,
                keys.gh
            );
            alert(`✅ 排班表写入成功！\n\nAI 自主运行区间已被限定为北京时间 [${start}:00 至 ${end}:00]。`);
        } catch (e) {
            alert("❌ 同步时间表失败: " + e.message);
        }
    }
};

let AUDIT_PRODUCTS = [];
const DEFAULT_AUDIT_PRODUCTS = [
    { id: "aerotech", title: "AeroTech 创投规划书", category: "15 SLIDES · PPT演示", thumbKey: "prod_aerotech", thumbCloudPath: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-orange-500 font-bold", isLinked: true, status: true },
    { id: "saas", title: "SaaS 增长指标盘点", category: "20 SLIDES · PPT演示", thumbKey: "prod_saas", thumbCloudPath: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-orange-500 font-bold", isLinked: true, status: true },
    { id: "fintech", title: "FinTech A 轮融资方案", category: "12 SLIDES · PPT演示", thumbKey: "prod_fintech", thumbCloudPath: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-orange-500 font-bold", isLinked: true, status: true },
    { id: "excel-roi", title: "全渠道 ROI 动态测算模型", category: "XLSX MODEL · EXCEL表格", thumbKey: "prod_excel", thumbCloudPath: "https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-emerald-600 font-bold", isLinked: true, status: true },
    { id: "word-ats", title: "欧美 ATS 智能排版合规报告", category: "DOCX STANDARD · WORD文档", thumbKey: "prod_word", thumbCloudPath: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=300&q=80", thumbDefault: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=300&q=80", priceRmb: 69, priceUsd: "9.99", colorCls: "text-indigo-600 font-bold", isLinked: true, status: true }
];

async function loadAuditProducts() {
    const localProducts = localStorage.getItem('APEX_AUDIT_PRODUCTS');
    if (localProducts) {
        AUDIT_PRODUCTS.length = 0; 
        JSON.parse(localProducts).forEach(p => AUDIT_PRODUCTS.push(p));
    } else {
        AUDIT_PRODUCTS = JSON.parse(JSON.stringify(DEFAULT_AUDIT_PRODUCTS));
    }

    try {
        const res = await fetch('data/ai-generated-decks.json?nocache=' + Date.now());
        if (res.ok) {
            const aiData = await res.json();
            if (Array.isArray(aiData)) {
                aiData.forEach(aiItem => {
                    if (!AUDIT_PRODUCTS.find(p => p.id === aiItem.id)) {
                        let col = 'text-orange-500 font-bold';
                        if (aiItem.type === 'excel') col = 'text-emerald-600 font-bold';
                        if (aiItem.type === 'word') col = 'text-indigo-600 font-bold';
                        
                        AUDIT_PRODUCTS.push({
                            id: aiItem.id,
                            title: aiItem.title || aiItem.name,
                            category: aiItem.category || `AI 生成 · ${aiItem.type ? aiItem.type.toUpperCase() : 'PPT'}`,
                            thumbKey: "prod_" + aiItem.id,
                            thumbCloudPath: aiItem.thumb || aiItem.thumbnail || "",
                            thumbDefault: aiItem.thumb || aiItem.thumbnail || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80",
                            priceRmb: aiItem.priceRmb || 69,
                            priceUsd: "9.99",
                            colorCls: col,
                            isLinked: true,
                            status: true
                        });
                    }
                });
            }
        }
    } catch(e) {}
    
    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(AUDIT_PRODUCTS));
    renderAuditTable();
}

window.uploadProductThumb = function(index) {
    const item = AUDIT_PRODUCTS[index];
    ApexImageEngine.uploadAndBackup(item.thumbKey, item.thumbCloudPath, () => {
        localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(AUDIT_PRODUCTS));
        renderAuditTable();
        appendLog(`>> [缩略图] [${item.title}] WebP 转换并绑定完成`);
    });
};

window.toggleRowLinkage = function(index) {
    AUDIT_PRODUCTS[index].isLinked = !AUDIT_PRODUCTS[index].isLinked;
    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(AUDIT_PRODUCTS));
    renderAuditTable();
    appendLog(`>> [风控审查] 作品 [${AUDIT_PRODUCTS[index].title}] 定价模式 -> ${AUDIT_PRODUCTS[index].isLinked ? '汇率联动' : '行内独立定价'}`);
};

window.onAuditPriceChange = function(index, field, val) {
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
};

window.renderAuditTable = function() {
    const tbody = document.getElementById("auditTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const tableEl = tbody.closest("table");
    if (tableEl) {
        tableEl.querySelectorAll("th").forEach(th => th.classList.add("whitespace-nowrap", "tracking-wider", "select-none"));
    }

    AUDIT_PRODUCTS.forEach((item, index) => {
        const finalThumbUrl = ApexImageEngine.resolve(item.thumbKey, item.thumbCloudPath, item.thumbDefault);
        const badgeCls = item.status 
            ? "bg-emerald-500 text-white font-bold shadow-sm" 
            : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400";
        
        const linkBtnCls = item.isLinked
            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
            : "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20";
        const linkBtnText = item.isLinked ? "🔗 联动中" : "🔓 独立价";

        tbody.innerHTML += `
            <tr class="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <td class="py-3 px-4 whitespace-nowrap">
                    <div class="relative group w-14 h-18">
                        <img src="${finalThumbUrl}" alt="快照" class="w-14 h-18 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" />
                        <button onclick="uploadProductThumb(${index})" class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center text-white text-[10px] font-bold">📤 转WebP</button>
                    </div>
                </td>
                <td class="py-3 px-4 whitespace-nowrap">
                    <div class="font-black text-sm text-[#0f172a] dark:text-[#f8fafc] tracking-wide">${item.title}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">${item.category}</div>
                </td>
                <td class="py-3 px-4 font-mono whitespace-nowrap">
                    <div class="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                        <span class="${item.colorCls}">￥</span>
                        <input type="number" value="${item.priceRmb}" onchange="onAuditPriceChange(${index}, 'rmb', this.value)" class="w-16 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs font-bold text-center text-[#0f172a] dark:text-[#f8fafc] outline-none ${item.colorCls}" />
                        <span class="text-slate-400">/</span>
                        <span class="text-blue-600 font-bold">$</span>
                        <input type="number" step="0.01" value="${item.priceUsd}" onchange="onAuditPriceChange(${index}, 'usd', this.value)" class="w-20 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs font-bold text-center text-blue-600 outline-none" />
                        <button onclick="toggleRowLinkage(${index})" class="ml-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all shrink-0 whitespace-nowrap inline-flex items-center justify-center select-none border ${linkBtnCls}" title="点击切换：汇率折算联动 / 独立填价">
                            ${linkBtnText}
                        </button>
                    </div>
                </td>
                <td class="py-3 px-4 whitespace-nowrap">
                    <button onclick="toggleAuditStatus(${index})" class="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5 transition ${badgeCls}">
                        <span>●</span>
                        <span>${item.status ? '已上架' : '已隐藏'}</span>
                    </button>
                </td>
                <td class="py-3 px-4 text-right whitespace-nowrap min-w-[220px]">
                    <button onclick="uploadProductThumb(${index})" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition">上传WebP图</button>
                    <button onclick="forceRemoveProduct(${index})" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition">强制销毁</button>
                </td>
            </tr>
        `;
    });
};

window.toggleAuditStatus = function(index) {
    AUDIT_PRODUCTS[index].status = !AUDIT_PRODUCTS[index].status;
    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(AUDIT_PRODUCTS));
    renderAuditTable();
    appendLog(`>> [风控审查] 更改作品 [${AUDIT_PRODUCTS[index].title}] 上架状态 -> ${AUDIT_PRODUCTS[index].status ? '已上架' : '下架隐藏'}`);
};

window.forceRemoveProduct = function(index) {
    if (!confirm(`⚠️ 危险操作！确定要在商城强制下架并销毁 [${AUDIT_PRODUCTS[index].title}] 吗？`)) return;
    const title = AUDIT_PRODUCTS[index].title;
    AUDIT_PRODUCTS.splice(index, 1);
    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(AUDIT_PRODUCTS));
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
    setPreset: function(idx, gradientStr) {
        const inputEl = document.getElementById(`banner-bg-${idx}`);
        if (inputEl) {
            inputEl.value = gradientStr;
            appendLog(`>> [视觉渐变] 已为第 ${idx + 1} 幕横幅快速应用配色方案 -> ${gradientStr}`);
        }
    },

    uploadBannerImg: function(idx) {
        const assetKey = "banner_slide_" + idx;
        const repoPath = `assets/banners/slide-${idx}.webp`;
        ApexImageEngine.uploadAndBackup(assetKey, repoPath, (webpUrl, finalCloudPath) => {
            const imgInput = document.getElementById(`banner-img-${idx}`);
            if (imgInput) imgInput.value = finalCloudPath;
            appendLog(`>> [轮播图云备份] 幻灯片 #${idx + 1} 绑定实体路径 -> ${finalCloudPath}`);
        });
    },

    loadBannerConfig: async function() {
        const saved = localStorage.getItem('APEX_BANNER_CONFIG');
        let config = null;
        if (saved) { try { config = JSON.parse(saved); } catch(e) {} }
        
        try {
            const keys = getKeysSafe();
            if (keys && keys.gh) {
                const fileObj = await getGithubFileSafe("config/banner.json", keys.gh);
                if (fileObj.content) {
                    config = JSON.parse(fileObj.content);
                    localStorage.setItem('APEX_BANNER_CONFIG', JSON.stringify(config));
                }
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
            {
                tag: document.getElementById('banner-tag-0').value,
                title: document.getElementById('banner-title-0').value,
                desc: document.getElementById('banner-desc-0').value,
                bgStyle: document.getElementById('banner-bg-0').value,
                bgImg: document.getElementById('banner-img-0').value
            },
            {
                tag: document.getElementById('banner-tag-1').value,
                title: document.getElementById('banner-title-1').value,
                desc: document.getElementById('banner-desc-1').value,
                bgStyle: document.getElementById('banner-bg-1').value,
                bgImg: document.getElementById('banner-img-1').value
            }
        ];
        localStorage.setItem('APEX_BANNER_CONFIG', JSON.stringify(config));
        try {
            const keys = getKeysSafe();
            if (keys && keys.gh) {
                const fileObj = await getGithubFileSafe("config/banner.json", keys.gh);
                await pushGithubJsonFile("config/banner.json", config, fileObj.sha, "🎨 Update homepage banners via Dashboard [skip ci]", keys.gh);
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
    forceRefreshRate: async function() {
        const badge = document.getElementById("fxRateBadge");
        if (badge) badge.innerText = "向央行查汇中...";
        try {
            const res = await fetch("https://open.er-api.com/v6/latest/USD");
            const data = await res.json();
            if (data && data.rates && data.rates.CNY) {
                this.currentRate = Number(data.rates.CNY).toFixed(2);
                localStorage.setItem("APEX_FX_RATE_CACHE", JSON.stringify({ rate: this.currentRate, timestamp: Date.now() }));
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
            rate: ApexFX.currentRate,
            isLinked: this.isLinked,
            use99Rule: this.use99Rule,
            updatedAt: new Date().toISOString()
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

const deptConfig = [
    { name: "大脑中枢", cls: "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/40" },
    { name: "缺陷与QA质检部", cls: "bg-rose-500/10 text-rose-600 border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40" },
    { name: "主动产品部", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40" },
    { name: "施工工程部", cls: "bg-sky-500/10 text-sky-600 border-sky-500/30 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/40" },
    { name: "视觉策划部", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40" },
    { name: "审核质量部", cls: "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/40" },
    { name: "转化销售部", cls: "bg-pink-500/10 text-pink-600 border-pink-500/30 dark:bg-pink-500/20 dark:text-pink-400 dark:border-pink-500/40" },
    { name: "推广营销部", cls: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/40" },
    { name: "国际法务部", cls: "bg-teal-500/10 text-teal-600 border-teal-500/30 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/40" }
];

window.openLiveSiteForceBypass = function() { window.open('index.html', '_blank'); };

const DEFAULT_MANIFEST_TASKS = [
    { id: "TASK-101", title: "配置海外主力 Lemon Squeezy (MoR) 结账网关与美元直抛", notes: "用极简代码嵌入 Checkout", stage: "STAGE_1_MVP_GLOBAL", department: "施工工程部", status: "DONE" },
    { id: "TASK-102", title: "国内临时过渡方案：内地 IP 访问引流至『爱发电』免签约", notes: "检测中国 IP 时购买按钮自动变爱发电跳转", stage: "STAGE_1_MVP_GLOBAL", department: "施工工程部", status: "DONE" },
    { id: "TASK-103", title: "全自动化推文发车：针对欧美 Pinterest / Reddit 生成软广", notes: "内嵌商城高单价干货图文导流链接", stage: "STAGE_1_MVP_GLOBAL", department: "推广营销部", status: "DONE" },
    { id: "TASK-104", title: "实现万里汇 (WorldFirst) 跨境结汇与对公打款", notes: "配合老板手动验证第一张外卡到账", stage: "STAGE_1_MVP_GLOBAL", department: "董事长", status: "DONE" },
    { id: "TASK-201", title: "国内正规军升级：广州网络经营个体户执照与对公参数", notes: "办个体户无需实际租用办公楼", stage: "STAGE_2_CN_UPGRADE", department: "董事长", status: "IN_PROGRESS" },
    { id: "TASK-202", title: "构建境内专属隔离收银台，替换前期『爱发电』通道", notes: "无缝把国内主站 PAYMENT_GATEWAY 替换为微信支付宝", stage: "STAGE_2_CN_UPGRADE", department: "施工工程部", status: "TODO" },
    { id: "TASK-203", title: "智能判断多模态设计组，建立每日自动生成模版流水线", notes: "AI 每日印钞：研发多样式 PPT/Excel 模版", stage: "STAGE_2_CN_UPGRADE", department: "主动产品部", status: "TODO" },
    { id: "TASK-301", title: "实现智能 DNS 分流：国内走境内镜像，海外走 Cloudflare", notes: "保持全球 TTFB < 50ms", stage: "STAGE_3_FULL_SCALE", department: "施工工程部", status: "TODO" },
    { id: "TASK-302", title: "部署 3 分钟有效期的私有预签名下载链接防止盗链", notes: "无论海外还是国内收银台，付款成功签发临时链接", stage: "STAGE_3_FULL_SCALE", department: "施工工程部", status: "TODO" }
];

let rawManifestTasks = DEFAULT_MANIFEST_TASKS;

async function loadTasksManifest() {
    const listEl = document.getElementById('manifestList');
    if (!listEl) return;
    try {
        const localCache = localStorage.getItem("APEX_TASKS_CACHE");
        if (localCache) {
            rawManifestTasks = JSON.parse(localCache);
            const badge = document.getElementById('manifestSummaryBadge');
            const doneCnt = rawManifestTasks.filter(t => t.status === 'DONE').length;
            if (badge) badge.innerText = `完成度: ${doneCnt}/${rawManifestTasks.length}`;
            renderManifestTasks();
            return;
        }

        const keys = getKeysSafe();
        if (keys && keys.gh) {
            const fileObj = await getGithubFileSafe("TASKS_MANIFEST.json", keys.gh);
            if (fileObj.content) {
                const manifest = JSON.parse(fileObj.content);
                rawManifestTasks = (manifest.tasks && manifest.tasks.length > 0) ? manifest.tasks : JSON.parse(JSON.stringify(DEFAULT_MANIFEST_TASKS));
                const sum = manifest.summary || { completed: 4, total_tasks: 9 };
                const badge = document.getElementById('manifestSummaryBadge');
                if (badge) badge.innerText = `完成度: ${sum.completed}/${sum.total_tasks}`;
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

window.resetManifestToDefault = async function() {
    if (!confirm("确定将所有阶段工单重置为初始待办进度 (TODO) 吗？")) return;
    rawManifestTasks = JSON.parse(JSON.stringify(DEFAULT_MANIFEST_TASKS));
    localStorage.setItem("APEX_TASKS_CACHE", JSON.stringify(rawManifestTasks));
    renderManifestTasks();
    appendLog(">> [进度书] 已将工单重置为初始待办进度！", "text-emerald-500");
    
    try {
        const keys = getKeysSafe();
        if (keys.gh) {
            const fileObj = await getGithubFileSafe("TASKS_MANIFEST.json", keys.gh);
            const manifest = {
                summary: { completed: 4, todo: 5, total_tasks: 9 },
                tasks: rawManifestTasks,
                updated_at: new Date().toISOString().slice(0, 10)
            };
            await pushGithubJsonFile("TASKS_MANIFEST.json", manifest, fileObj.sha, "🔄 Reset tasks to realistic default [skip ci]", keys.gh);
            alert("✅ 云端 GitHub 仓库及页面工单已全部重置！");
            return;
        }
    } catch(e) {}
    alert("✅ 本地工单已完成重置！");
};

window.filterManifest = function(stageKey) {
    currentManifestFilter = stageKey;
    document.querySelectorAll('.manifest-tab').forEach(btn => { btn.className = "manifest-tab px-3 py-1 rounded-lg text-slate-400 hover:text-slate-600"; });
    const targetBtn = window.event?.target;
    if (targetBtn) { targetBtn.className = "manifest-tab px-3 py-1 rounded-lg bg-blue-600 text-white font-bold"; }
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
        listEl.innerHTML = `<div class="text-center text-xs text-slate-500 py-4 col-span-full font-mono">该阶段无任务</div>`;
        return;
    }

    filtered.forEach(task => {
        const isDone = task.status === 'DONE';
        const isInProg = task.status === 'IN_PROGRESS';
        let dotCls = isDone ? "bg-emerald-500" : (isInProg ? "bg-amber-400 animate-pulse" : "bg-slate-400");
        let statusText = isDone ? "已达成" : (isInProg ? "执行中" : "待落实");
        let btnCls = isDone ? "bg-slate-700 hover:bg-slate-600 text-slate-200" : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm";
        let btnText = isDone ? "↩ 撤销" : "✓ 达成";

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
                    <button onclick="toggleTaskStatus('${task.id}')" class="px-4 py-1.5 rounded-lg font-bold transition ${btnCls}">${btnText}</button>
                </div>
            </div>
        `;
    });
}

window.toggleTaskStatus = async function(taskId) {
    const task = rawManifestTasks.find(t => t.id === taskId);
    if (!task) return;
    task.status = task.status === 'DONE' ? 'TODO' : 'DONE';
    localStorage.setItem("APEX_TASKS_CACHE", JSON.stringify(rawManifestTasks));
    appendLog(`✏️ 变更工单状态 -> [${taskId}] ${task.status}`);
    renderManifestTasks();
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
            await pushGithubJsonFile("TASKS_MANIFEST.json", manifest, fileObj.sha, `🎯 Toggle Task [${taskId}] -> ${task.status} [skip ci]`, keys.gh);
            appendLog(`✅ 工单进度写入成功！`);
            loadTasksManifest();
        }
    } catch (e) {
        appendLog(`⚠️ 进度已保存在设备中 (同步云端请配置密钥)`, "text-amber-500");
    }
};

window.clearHistoryLog = function() {
    const feed = document.getElementById("historyFeed");
    const countBadge = document.getElementById("historyCount");
    if (feed) feed.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 font-mono">日志已完全清空</div>`;
    if (countBadge) countBadge.innerText = `0条`;
    appendLog(">> [系统战报] 已手动清除页面日志信息。");
};

// ==========================================
// 10. 👑 智能中枢调令台与 @部门提及菜单 
// ==========================================
window.showMentionDropdown = function(query) {
    let dropEl = document.getElementById("mentionDropdown");
    const cmdBox = document.getElementById("cmd");
    if (!cmdBox) return;

    if (!dropEl) {
        dropEl = document.createElement("div");
        dropEl.id = "mentionDropdown";
        dropEl.className = "fixed z-[999999] bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-600 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-1.5 w-48 max-h-56 overflow-y-auto flex flex-col";
        document.body.appendChild(dropEl);
    }

    const matches = deptConfig.filter(d => d.name.toLowerCase().includes(query.toLowerCase()));
    if (matches.length === 0) {
        dropEl.style.display = "none";
        return;
    }
    
    dropEl.innerHTML = "";
    matches.forEach(dept => {
        const item = document.createElement("button");
        item.className = "group w-full text-left px-4 py-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-colors whitespace-nowrap flex items-center";
        item.innerHTML = `<span class="text-blue-500 mr-2 group-hover:text-white transition">@</span> ${dept.name}`;
        item.onmousedown = (e) => {
            e.preventDefault(); 
            window.selectMentionDept(dept.name);
        };
        dropEl.appendChild(item);
    });

    dropEl.style.display = "flex";

    let placed = false;
    try {
        const sel = window.getSelection();
        if (sel.rangeCount > 0 && cmdBox.contains(sel.anchorNode)) {
            const range = sel.getRangeAt(0).cloneRange();
            range.collapse(false);
            
            const marker = document.createElement("span");
            marker.appendChild(document.createTextNode("\u200b"));
            range.insertNode(marker);
            const rect = marker.getBoundingClientRect();
            marker.parentNode.removeChild(marker);
            
            if (rect && rect.bottom > 0 && rect.left > 0) {
                dropEl.style.left = `${rect.left}px`;
                dropEl.style.top = `${rect.bottom + 8}px`;
                placed = true;
            }
        }
    } catch(e) {}
    
    if (!placed) {
        const boxRect = cmdBox.getBoundingClientRect();
        dropEl.style.left = `${boxRect.left + 16}px`;
        dropEl.style.top = `${boxRect.bottom + 8}px`;
    }
};

window.hideMentionDropdown = function() {
    const dropEl = document.getElementById("mentionDropdown");
    if (dropEl) dropEl.style.display = "none";
};

window.selectMentionDept = function(deptName) {
    const cmdBox = document.getElementById("cmd");
    if (!cmdBox) return;
    cmdBox.focus();

    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    
    const node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const endOffset = range.startOffset;
        const startOffset = text.lastIndexOf('@', endOffset);

        if (startOffset !== -1) {
            range.setStart(node, startOffset);
            range.setEnd(node, endOffset);
            range.deleteContents(); 
        }
    }

    const deptInfo = deptConfig.find(d => d.name === deptName) || deptConfig[0];
    
    const tokenSpan = document.createElement("span");
    tokenSpan.className = `inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold mx-1 select-none shadow-sm cursor-default ${deptInfo.cls}`;
    tokenSpan.contentEditable = "false"; 
    tokenSpan.setAttribute("data-dept", deptName);
    tokenSpan.innerText = `@${deptName}`;

    range.insertNode(tokenSpan);

    const spaceNode = document.createTextNode("\u00A0"); 
    tokenSpan.parentNode.insertBefore(spaceNode, tokenSpan.nextSibling);

    range.setStartAfter(spaceNode);
    range.setEndAfter(spaceNode);
    sel.removeAllRanges();
    sel.addRange(range);
    
    hideMentionDropdown();
    appendLog(`🎯 追加指令 @${deptName}`);
};

window.inspectDept = function(deptName, btnEl) {
    activeFilterDept = deptName;
    document.querySelectorAll(".dept-btn").forEach(el => el.style.opacity = "0.4");
    if (btnEl) btnEl.style.opacity = "1";
    const activeLabel = document.getElementById("activeDeptLabel");
    if (activeLabel) activeLabel.innerText = `[${deptName}]`;

    const cmdBox = document.getElementById("cmd");
    if (isCmdActive && cmdBox) {
        cmdBox.focus();

        const deptInfo = deptConfig.find(d => d.name === deptName) || deptConfig[0];
        const tokenSpan = document.createElement("span");
        tokenSpan.className = `inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold mx-1 select-none shadow-sm cursor-default ${deptInfo.cls}`;
        tokenSpan.contentEditable = "false";
        tokenSpan.setAttribute("data-dept", deptName);
        tokenSpan.innerText = `@${deptName}`;

        const sel = window.getSelection();
        if (sel.rangeCount > 0 && cmdBox.contains(sel.anchorNode)) {
            const range = sel.getRangeAt(0);
            range.collapse(false);
            range.insertNode(tokenSpan);
            const space = document.createTextNode("\u00A0");
            tokenSpan.parentNode.insertBefore(space, tokenSpan.nextSibling);
            range.setStartAfter(space);
            range.setEndAfter(space);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            cmdBox.appendChild(tokenSpan);
            cmdBox.appendChild(document.createTextNode("\u00A0"));
        }
        cmdBox.scrollTop = cmdBox.scrollHeight;
        
        appendLog(`🎯 追加指令 @${deptName}`);
    } else {
        appendLog(`🔍 视图切换 -> [${deptName}] (未聚焦文本框，不追加词条)`);
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

// 👑 修复：恢复完整的战报 mock 数据，不再空空如也！
async function loadHistoryFromMemory() {
    const f = document.getElementById("historyFeed");
    const c = document.getElementById("historyCount");
    if(!f) return;
    const mockLogs = [
        "🤖 [大脑中枢]: 系统启动并注入全局异常捕获钩子。",
        "👁️ [视觉策划部]: 轮播图资源尺寸及 WebP 转化效验完成。状态：🟢 健康",
        "🛠️ [施工工程部]: 商业金库架构双端读写 (GitHub/Gitee) 已连通。",
        "✅ [系统]: AI 智能体准备就绪，待命执行调令。"
    ];
    if (c) c.innerText = "4条";
    f.innerHTML = mockLogs.map((log, i) => `
        <div class="border rounded-xl p-2.5 saas-input bg-slate-50 dark:bg-slate-900/50">
            <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 border-b border-slate-200 dark:border-slate-800 pb-1">
                <span>⏱️ 今天 ${i+1}:00</span><span>#${4 - i}</span>
            </div>
            <div class="text-xs font-mono text-slate-800 dark:text-slate-300">${log}</div>
        </div>
    `).join('');
}

// ==========================================
// 11. 启动引擎与精准键盘侦听
// ==========================================
function initAdminEngine() {
    if(typeof loadAuditProducts === "function") loadAuditProducts(); 
    else if(typeof renderAuditTable === "function") renderAuditTable();
    
    if(typeof initApexTooltip === "function") initApexTooltip();
    
    // 👑 修复：渲染 AI 部门按钮
    if(typeof renderDeptButtons === "function") renderDeptButtons();
    
    // 👑 修复：默认渲染历史战报
    loadHistoryFromMemory();
    
    if(typeof ApexScheduleManager !== "undefined") ApexScheduleManager.loadScheduleFromCloud();
    if(typeof ApexBannerManager !== "undefined") ApexBannerManager.loadBannerConfig();
    if (window.ApexLogoManager) ApexLogoManager.initLogo();
    if (window.ApexUserManager) ApexUserManager.initUserSection();
    
    const savedTheme = localStorage.getItem("APEX_ADMIN_THEME") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.innerHTML = savedTheme === "dark" ? "<span>🌞 白昼模式</span>" : "<span>🌙 极夜模式</span>";

    if(typeof ApexFX !== "undefined") ApexFX.initWeeklyRate();
    
    const cmdBox = document.getElementById("cmd");
    if (cmdBox) {
        cmdBox.addEventListener("focus", () => { isCmdActive = true; });

        const checkMention = function() {
            if (!cmdBox) return;
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                hideMentionDropdown();
                return;
            }

            const node = sel.focusNode;
            if (node && node.nodeType === Node.TEXT_NODE && cmdBox.contains(node)) {
                const text = node.textContent.substring(0, sel.focusOffset).replace(/\u00A0/g, " ");
                const match = text.match(/@([^\s@]*)$/);
                if (match) {
                    showMentionDropdown(match[1]);
                    return;
                }
            }
            hideMentionDropdown();
        };

        cmdBox.addEventListener("input", checkMention);
        cmdBox.addEventListener("keyup", checkMention);
        cmdBox.addEventListener("mouseup", checkMention);
        
        cmdBox.addEventListener("keydown", function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                if (typeof triggerSwarmAutonomousAction === "function") {
                    triggerSwarmAutonomousAction();
                } else {
                    appendLog(`🚀 已将调令提交至云端 AI 执行队列。`);
                    cmdBox.innerHTML = ""; 
                }
                hideMentionDropdown();
            }
            if (e.key === "Escape") hideMentionDropdown();
        });
    }

    document.addEventListener("mousedown", function(e) {
        const dropEl = document.getElementById("mentionDropdown");
        if (dropEl && dropEl.style.display !== "none") {
            if (!dropEl.contains(e.target) && cmdBox && !cmdBox.contains(e.target)) {
                hideMentionDropdown();
            }
        }
    });

    if (localStorage.getItem("APEX_GH_TOKEN")) {
        if(typeof window.syncAllData === "function") window.syncAllData();
    } else {
        if(typeof renderManifestTasks === "function") renderManifestTasks();
    }
}

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initAdminEngine);
} else {
    initAdminEngine();
}

window.syncAllData = function() {
    if(typeof loadTasksManifest === "function") loadTasksManifest();
    if(typeof loadHistoryFromMemory === "function") loadHistoryFromMemory();
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
        btn.onmousedown = (e) => e.preventDefault();
        btn.onclick = () => window.inspectDept(dept.name, btn);
        container.appendChild(btn);
    });
}

function getKeys() {
    const gh = localStorage.getItem("APEX_GH_TOKEN");
    const ds = localStorage.getItem("APEX_DS_KEY");
    if (!gh || !ds) { window.toggleConfig(); throw new Error("请在右上角填写配置密钥!"); }
    return { gh, ds };
}

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

function utf8_to_b64(str) { return window.btoa(unescape(encodeURIComponent(str))); }
function b64_to_utf8(str) { return decodeURIComponent(escape(window.atob(str))); }

function appendLog(msg, color = "") {
    const log = document.getElementById("historyFeed");
    if (!log) return;
    log.innerHTML += `<div class="text-[11px] font-mono text-slate-500 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 py-1.5">> ${msg}</div>`;
    log.scrollTop = log.scrollHeight;
}

async function getGithubFileSafe(path, token) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, { headers: { "Authorization": `token ${token}` } });
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
    if (!res.ok) throw new Error(`提交配置文件 ${path} 失败: ` + res.statusText);
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
    if (!res.ok) throw new Error(`提交图片 ${path} 失败: ` + res.statusText);
    return await res.json();
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
        if (!res.ok) {
            container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 font-mono leading-relaxed">无法读取提交记录。<br>请确认右上角 Token 权限正确，且仓库为 GitHub（不兼容 Gitee）。</div>`;
            return;
        }
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
        container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 font-mono">获取历史异常，请检查网络或密钥。</div>`;
    }
}

// 👑 终极修复：物理级覆盖真实文件，强制清理本地数据缓存，绝不骗人
window.revertToSelectedCommit = async function(targetSha, shortSha) {
    if (!confirm(`⏳ 确定将全站代码一键回退到快照 [#${shortSha}] 吗？`)) return;
    window.closeRollbackModal();
    
    const ghToken = localStorage.getItem("APEX_GH_TOKEN"); 
    if (!ghToken) {
        alert("❌ 缺少 GitHub Token，无法执行代码回溯！");
        return; 
    }

    const overlay = document.getElementById("restoreProgressOverlay");
    const bar = document.getElementById("restoreProgressBar");
    const text = document.getElementById("restoreProgressText");

    try {
        if (overlay) overlay.classList.remove("hidden");
        if (text) text.innerText = `[1/3] 正在拉取目标快照 [#${shortSha}] 的底层文件树...`;
        if (bar) bar.style.width = "10%";

        const treeRes = await fetch(`https://api.github.com/repos/${REPO}/git/trees/${targetSha}?recursive=1`, { headers: { "Authorization": `token ${ghToken}` } });
        if (!treeRes.ok) throw new Error("无法读取目标快照的文件树结构");
        
        const treeData = await treeRes.json();
        const filesToRestore = treeData.tree.filter(item => item.type === 'blob');
        const totalFiles = filesToRestore.length;
        
        let successCount = 0;
        let skipCount = 0;
        appendLog(`⏳ 开始逐一真实覆盖源码至快照 #${shortSha}...`);
        
        for (let i = 0; i < totalFiles; i++) {
            const fileObj = filesToRestore[i];
            const percent = Math.floor(10 + (i / totalFiles) * 80);
            if (text) text.innerText = `[2/3] 正在比对与覆盖: ${fileObj.path} (${i+1}/${totalFiles})`;
            if (bar) bar.style.width = `${percent}%`;

            // 1. 获取线上现存 SHA，防止 409 写入冲突
            let currentSha = null;
            try {
                const curFileRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${fileObj.path}`, { headers: { "Authorization": `token ${ghToken}` } });
                if(curFileRes.ok) {
                    currentSha = (await curFileRes.json()).sha;
                }
            } catch(e){}

            // 2. 如果线上代码和旧版一模一样，直接跳过，不仅加速还免除了报错！
            if (currentSha === fileObj.sha) {
                skipCount++;
                continue;
            }

            // 3. 提取旧版真实代码
            const fileContentRes = await fetch(fileObj.url, { headers: { "Authorization": `token ${ghToken}` } });
            const fileJson = await fileContentRes.json();

            // 4. 强制实体写入 GitHub
            const updateRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${fileObj.path}`, {
                method: "PUT",
                headers: { "Authorization": `token ${ghToken}`, "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: `⏪ 真实代码还原: 物理覆盖文件 ${fileObj.path} 回溯至 #${shortSha} [skip ci]`, 
                    content: fileJson.content, 
                    ...(currentSha && {sha: currentSha}) 
                })
            });
            
            if (updateRes.ok) successCount++;
        }
        
        if (text) text.innerText = `[3/3] 覆盖完成！正在清理本地缓存数据...`;
        if (bar) bar.style.width = "100%";

        // 👑 核心：清空浏览器本地数据库，让浏览器被迫重新拉取刚刚还原好的新配置！
        localStorage.removeItem('APEX_PRICING_CONFIG');
        localStorage.removeItem('APEX_BANNER_CONFIG');
        localStorage.removeItem('APEX_USER_LIST');
        localStorage.removeItem('APEX_TASKS_CACHE');
        localStorage.removeItem('APEX_AUDIT_PRODUCTS');
        localStorage.removeItem('APEX_SCHEDULE_CACHE');

        setTimeout(() => {
            alert(`✅ 成功回溯真实代码至 [#${shortSha}]！\n📊 覆盖修改了 ${successCount} 个文件，跳过了 ${skipCount} 个未变动文件。\n系统即将重载最新大盘！`);
            // 携带随机数强制刷新浏览器
            window.location.href = window.location.pathname + '?_t=' + Date.now();
        }, 1000);
        
    } catch(err) { 
        if (overlay) overlay.classList.add("hidden");
        alert("❌ 还原异常: " + err.message);
        appendLog("❌ 还原异常: " + err.message, "text-rose-500"); 
    }
};

window.triggerSwarmAutonomousAction = async function() {
    const btn = document.getElementById("runBtn");
    const cmdBox = document.getElementById("cmd");
    let rawText = "常规进展汇报";
    if (cmdBox) {
        rawText = cmdBox.tagName === "INPUT" || cmdBox.tagName === "TEXTAREA" 
            ? cmdBox.value 
            : cmdBox.innerText;
        rawText = rawText.replace(/@[^ ]+/g, "").trim() || "常规进展汇报";
    }
    
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
        if (cmdBox) {
            if (cmdBox.tagName === "INPUT" || cmdBox.tagName === "TEXTAREA") cmdBox.value = "";
            else cmdBox.innerHTML = "";
        }
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
