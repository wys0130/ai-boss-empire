/**
 * APEXWORK 极客跨云独立金库引擎 (components/version-vault.js)
 * 1. 降维打法：采用云端原子金库账本 (APEX_VAULT_BACKUPS.json)，1 次加载即可展现全部完整自定义备注！
 * 2. 人性化双选：支持「✨ 新增存档」与「🔄 覆盖选定旧档」双模式工作！
 * 3. 20 个风控防爆：自动巡检数量，超额提示高亮清理。
 */

window.ApexVersionVault = {
    config: {
        ghOwner: "wys0130",
        ghBackupRepo: "ai-boss-archive",
        giteeOwner: "superwangwang",       // 你的 Gitee 真实用户名
        giteeBackupRepo: "ai-boss-archive",
        maxLimit: 20
    },

    getVaultTokens: function() {
        return {
            ghToken: localStorage.getItem("APEX_GH_TOKEN") || "",
            giteeToken: localStorage.getItem("APEX_GITEE_TOKEN") || ""
        };
    },

    saveVaultConfig: function(ghRepo, giteeToken, giteeRepo) {
        if (ghRepo) localStorage.setItem("APEX_VAULT_GH_REPO", ghRepo.trim());
        if (giteeToken) localStorage.setItem("APEX_GITEE_TOKEN", giteeToken.trim());
        if (giteeRepo) localStorage.setItem("APEX_VAULT_GITEE_REPO", giteeRepo.trim());
        alert("✅ 跨云金库参数已绑定！换新电脑也可直接一键同步云端独立记录！");
    },

    // 👑 核心方法 1：读取云端完整账本
    fetchVaultLedger: async function() {
        const tokens = this.getVaultTokens();
        const ghRepo = localStorage.getItem("APEX_VAULT_GH_REPO") || this.config.ghBackupRepo;
        
        // 优先读取 GitHub 独立仓库的账本
        if (tokens.ghToken) {
            try {
                const url = `https://api.github.com/repos/${this.config.ghOwner}/${ghRepo}/contents/APEX_VAULT_BACKUPS.json`;
                const res = await fetch(url, { headers: { "Authorization": `token ${tokens.ghToken}` } });
                if (res.ok) {
                    const data = await res.json();
                    const ledger = JSON.parse(this.b64ToUtf8(data.content));
                    ledger._gh_sha = data.sha;
                    return ledger;
                }
            } catch (e) {
                console.log("GitHub 账本尚未初始化:", e);
            }
        }

        // 备用读取 Gitee (码云) 独立仓库的账本
        if (tokens.giteeToken) {
            try {
                const giteeRepo = localStorage.getItem("APEX_VAULT_GITEE_REPO") || this.config.giteeBackupRepo;
                const url = `https://gitee.com/api/v5/repos/${this.config.giteeOwner}/${giteeRepo}/contents/APEX_VAULT_BACKUPS.json?access_token=${tokens.giteeToken}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    const ledger = JSON.parse(this.b64ToUtf8(data.content));
                    ledger._gitee_sha = data.sha;
                    return ledger;
                }
            } catch (e) {
                console.log("Gitee 账本尚未初始化:", e);
            }
        }

        return { versions: [] };
    },

    // 👑 核心方法 2：写入保存云端完整账本 (同步推送 GitHub + Gitee)
    pushVaultLedger: async function(ledgerObj, commitMsg) {
        const tokens = this.getVaultTokens();
        const contentBase64 = this.utf8ToB64(JSON.stringify({ versions: ledgerObj.versions }, null, 2));
        let ghOk = false;
        let giteeOk = false;

        // 推送 GitHub
        if (tokens.ghToken) {
            try {
                const ghRepo = localStorage.getItem("APEX_VAULT_GH_REPO") || this.config.ghBackupRepo;
                const url = `https://api.github.com/repos/${this.config.ghOwner}/${ghRepo}/contents/APEX_VAULT_BACKUPS.json`;
                const payload = { message: commitMsg, content: contentBase64 };
                if (ledgerObj._gh_sha) payload.sha = ledgerObj._gh_sha;

                const res = await fetch(url, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${tokens.ghToken}`,
                        "Accept": "application/vnd.github.v3+json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });
                if (res.ok) ghOk = true;
            } catch (e) {
                console.warn("GitHub 账本推送失败:", e);
            }
        }

        // 推送 Gitee
        if (tokens.giteeToken) {
            try {
                const giteeRepo = localStorage.getItem("APEX_VAULT_GITEE_REPO") || this.config.giteeBackupRepo;
                const url = `https://gitee.com/api/v5/repos/${this.config.giteeOwner}/${giteeRepo}/contents/APEX_VAULT_BACKUPS.json`;
                const payload = { access_token: tokens.giteeToken, content: contentBase64, message: commitMsg };
                if (ledgerObj._gitee_sha) payload.sha = ledgerObj._gitee_sha;

                const res = await fetch(url, {
                    method: ledgerObj._gitee_sha ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (res.ok) giteeOk = true;
            } catch (e) {
                console.warn("Gitee 账本推送失败:", e);
            }
        }

        return (ghOk || giteeOk);
    },

    // 👑 新增或覆盖存档 (overwriteId 传入时为覆盖，为空时为新增)
    saveSnapshot: async function(overwriteId = null) {
        const defaultNote = overwriteId ? "已覆盖更新此版本配置" : "例如：完成多币种汇率调校 / 更换商城LOGO";
        const note = prompt("👑 [极客跨云金库] 请为该存档输入醒目的专属自定义备注：", defaultNote);
        if (!note) return;

        const ledger = await this.fetchVaultLedger();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // 捕获全站当前全部配置数据
        const snapshotData = {
            id: overwriteId || ("SNAP-" + Date.now()),
            note: note.trim(),
            created_at: new Date().toLocaleString("zh-CN", { hour12: false }),
            data: {
                banner: JSON.parse(localStorage.getItem("APEX_BANNER_CONFIG") || "null"),
                pricing: JSON.parse(localStorage.getItem("APEX_PRICING_CONFIG") || "null"),
                users: JSON.parse(localStorage.getItem("APEX_USER_LIST") || "null"),
                tasks: JSON.parse(localStorage.getItem("APEX_TASKS_CACHE") || "null"),
                schedule: JSON.parse(localStorage.getItem("APEX_SCHEDULE_CONFIG") || "null"),
                logo: localStorage.getItem("APEX_CUSTOM_LOGO") || ""
            }
        };

        if (overwriteId) {
            // 模式 A：覆盖当前选定的旧存档
            const idx = ledger.versions.findIndex(v => v.id === overwriteId);
            if (idx !== -1) {
                ledger.versions[idx] = snapshotData;
            } else {
                ledger.versions.unshift(snapshotData);
            }
        } else {
            // 模式 B：新增存档并插入最头部
            ledger.versions.unshift(snapshotData);
        }

        // 风控防爆：超过 20 个时提醒并保留最新 20 个
        if (ledger.versions.length > this.config.maxLimit) {
            alert(`🔴 [限制提醒] 存档总数超出 ${this.config.maxLimit} 个安全限额，系统已自动剔除最底部的老旧无效记录。`);
            ledger.versions = ledger.versions.slice(0, this.config.maxLimit);
        }

        const success = await this.pushVaultLedger(ledger, `🗄️ VAULT: ${note} [skip ci]`);
        if (success) {
            alert(`✅ ${overwriteId ? "覆盖当前存档" : "新增跨云存档"}成功！\n\n专属备注：【 ${note} 】\n已同步至云端金库！`);
            this.renderVaultList("vault-snapshots-list");
        } else {
            alert("❌ 写入失败，请检查右上角是否绑定了 GitHub 或 Gitee API 密钥！");
        }
    },

    // 👑 销毁单条存档
    deleteSnapshot: async function(id, noteText) {
        if (!confirm(`⚠️ 确定要彻底销毁独立金库中的存档【 ${noteText} 】吗？`)) return;
        const ledger = await this.fetchVaultLedger();
        ledger.versions = ledger.versions.filter(v => v.id !== id);
        
        const success = await this.pushVaultLedger(ledger, `🗑️ VAULT-DEL: Delete ${noteText} [skip ci]`);
        if (success) {
            alert("✅ 该历史存档已从云端独立金库永久销毁！");
            this.renderVaultList("vault-snapshots-list");
        } else {
            alert("❌ 销毁失败，请检查网络或密钥权限。");
        }
    },

    // 👑 载入还原选定的完整配置
    restoreSnapshot: async function(id) {
        const ledger = await this.fetchVaultLedger();
        const target = ledger.versions.find(v => v.id === id);
        if (!target) {
            alert("❌ 未能在云端账本找到该快照数据！");
            return;
        }

        if (!confirm(`⏳ 警告：将从云端金库载入版本【 ${target.note} 】\n\n这会覆盖你当前网站的商品定价、轮播图及用户列表，要立刻应用吗？`)) return;

        const d = target.data;
        if (d) {
            if (d.banner) localStorage.setItem("APEX_BANNER_CONFIG", JSON.stringify(d.banner));
            if (d.pricing) localStorage.setItem("APEX_PRICING_CONFIG", JSON.stringify(d.pricing));
            if (d.users) localStorage.setItem("APEX_USER_LIST", JSON.stringify(d.users));
            if (d.tasks) localStorage.setItem("APEX_TASKS_CACHE", JSON.stringify(d.tasks));
            if (d.logo) localStorage.setItem("APEX_CUSTOM_LOGO", d.logo);
            alert(`✅ 还原完成！\n\n版本备注：${target.note}\n存档时间：${target.created_at}\n\n网站已刷新，为你显现该版本完整状态。`);
            window.location.reload();
        }
    },

    // 👑 渲染大厂设计的高阶视觉卡片列表
    renderVaultList: async function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `<div class="p-6 text-center text-xs text-blue-400 font-mono font-bold animate-pulse">正在从独立跨云仓库拉取全部备注记录...</div>`;

        const tokens = this.getVaultTokens();
        if (!tokens.ghToken && !tokens.giteeToken) {
            container.innerHTML = `<div class="p-6 text-center text-xs text-rose-500 font-mono font-bold">请先在上侧填入 Gitee 或 GitHub 密钥即可查看云端存档</div>`;
            return;
        }

        const ledger = await this.fetchVaultLedger();
        const list = ledger.versions || [];

        if (list.length === 0) {
            container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400 font-mono">当前云端金库暂无任何版本快照，点击底部即可新建！</div>`;
            return;
        }

        container.innerHTML = "";
        list.forEach((item, idx) => {
            container.innerHTML += `
                <div class="p-4 rounded-xl border border-slate-700/60 bg-slate-900/40 hover:border-blue-500/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="min-w-0 flex-1">
                        <!-- 第一行：大厂级大字号专属备注标题 -->
                        <div class="font-extrabold text-sm md:text-base text-white tracking-wide flex items-center gap-2">
                            <span class="text-blue-400 font-mono">#${list.length - idx}</span>
                            <span class="truncate">${item.note || '未填备注版本'}</span>
                        </div>
                        <!-- 第二行：时间戳与 ID 标识 -->
                        <div class="text-[11px] text-slate-400 font-mono mt-1.5 flex items-center gap-3">
                            <span>⏱️ 存档时间：${item.created_at}</span>
                            <span class="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">VER: ${item.id.slice(-6)}</span>
                        </div>
                    </div>
                    
                    <!-- 第三组：3 大极客操作按键 -->
                    <div class="flex items-center gap-2 shrink-0">
                        <button onclick="ApexVersionVault.restoreSnapshot('${item.id}')" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition">
                            📥 载入还原
                        </button>
                        <button onclick="ApexVersionVault.saveSnapshot('${item.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition" title="将当前网站最新状态覆盖保存到本条记录上">
                            🔄 覆盖此档
                        </button>
                        <button onclick="ApexVersionVault.deleteSnapshot('${item.id}', '${item.note}')" class="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 font-bold text-xs transition">
                            🗑️ 销毁
                        </button>
                    </div>
                </div>
            `;
        });
    },

    utf8ToB64: function(str) { return window.btoa(unescape(encodeURIComponent(str))); },
    b64ToUtf8: function(str) { return decodeURIComponent(escape(window.atob(str))); }
};
