/**
 * APEXWORK 独立跨云存档金库引擎 (components/version-vault.js)
 * 1. 物理隔离：与 ai-boss-empire 主项目解耦，推送到独立备份仓库 (GitHub + Gitee)
 * 2. 风控限额：严格监控存档数量，超出 20 个立即高亮提醒并支持页面一键清理
 * 3. 完整快照：一次性锁存主站全部 localStorage 业务参数与备注
 */

window.ApexVersionVault = {
    // 默认独立备份仓库配置 (与主项目 ai-boss-empire 物理隔离)
    config: {
        ghOwner: "wys0130",
        ghBackupRepo: "ai-boss-archive",       // GitHub 独立备份专用仓库
        giteeOwner: "wys0130",
        giteeBackupRepo: "ai-boss-archive",    // Gitee 独立备份专用仓库
        maxLimit: 20                           // 最大保留 20 个存档
    },

    // 1. 获取当前存储的第三方跨云 Token
    getVaultTokens: function() {
        return {
            ghToken: localStorage.getItem("APEX_GH_TOKEN") || "",
            giteeToken: localStorage.getItem("APEX_GITEE_TOKEN") || ""
        };
    },

    // 2. 绑定或修改跨云独立金库配置
    saveVaultConfig: function(ghRepo, giteeToken, giteeRepo) {
        if (ghRepo) localStorage.setItem("APEX_VAULT_GH_REPO", ghRepo.trim());
        if (giteeToken) localStorage.setItem("APEX_GITEE_TOKEN", giteeToken.trim());
        if (giteeRepo) localStorage.setItem("APEX_VAULT_GITEE_REPO", giteeRepo.trim());
        alert("✅ 跨云独立金库 API 参数已锁存！\n\n主项目被删也可直接从备份库拉取。");
    },

    // 3. 👑 核心：创建自定义备注的跨云独立存档
    createSnapshot: async function() {
        const note = prompt("👑 [跨云独立金库] 请输入本次版本存档的自定义专属备注：", "例如：完成支付网关优化/改动商品定价");
        if (!note) return;

        const tokens = this.getVaultTokens();
        if (!tokens.ghToken && !tokens.giteeToken) {
            alert("❌ 无法存档：请在后台【🔑 密钥设置】或金库配置中至少填入一个 GitHub 或 Gitee Token！");
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `snapshot_${timestamp}.json`;

        // 全量搜集当前主站所有重要业务参数
        const vaultPayload = {
            note: note,
            created_at: new Date().toLocaleString("zh-CN"),
            version_id: timestamp,
            data: {
                banner: JSON.parse(localStorage.getItem("APEX_BANNER_CONFIG") || "null"),
                pricing: JSON.parse(localStorage.getItem("APEX_PRICING_CONFIG") || "null"),
                users: JSON.parse(localStorage.getItem("APEX_USER_LIST") || "null"),
                tasks: JSON.parse(localStorage.getItem("APEX_TASKS_CACHE") || "null"),
                schedule: JSON.parse(localStorage.getItem("APEX_SCHEDULE_CONFIG") || "null"),
                logo: localStorage.getItem("APEX_CUSTOM_LOGO") || ""
            }
        };

        const contentBase64 = this.utf8ToB64(JSON.stringify(vaultPayload, null, 2));
        let ghSuccess = false;
        let giteeSuccess = false;

        // --- 写入独立 GitHub 备份仓库 ---
        if (tokens.ghToken) {
            try {
                const ghRepo = localStorage.getItem("APEX_VAULT_GH_REPO") || this.config.ghBackupRepo;
                const url = `https://api.github.com/repos/${this.config.ghOwner}/${ghRepo}/contents/snapshots/${fileName}`;
                const res = await fetch(url, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${tokens.ghToken}`,
                        "Accept": "application/vnd.github.v3+json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: `🗄️ VAULT: ${note} [skip ci]`,
                        content: contentBase64
                    })
                });
                if (res.ok) ghSuccess = true;
            } catch (e) {
                console.warn("GitHub 备份库推送异常:", e);
            }
        }

        // --- 写入独立 Gitee (码云) 备份仓库 ---
        if (tokens.giteeToken) {
            try {
                const giteeRepo = localStorage.getItem("APEX_VAULT_GITEE_REPO") || this.config.giteeBackupRepo;
                const url = `https://gitee.com/api/v5/repos/${this.config.giteeOwner}/${giteeRepo}/contents/snapshots/${fileName}`;
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        access_token: tokens.giteeToken,
                        content: contentBase64,
                        message: `🗄️ GITEE-VAULT: ${note}`
                    })
                });
                if (res.ok) giteeSuccess = true;
            } catch (e) {
                console.warn("Gitee 备份库推送异常:", e);
            }
        }

        if (ghSuccess || giteeSuccess) {
            alert(`✅ 跨云独立存档成功！\n\n备注：【${note}】\nGitHub独立备份：${ghSuccess ? '✓ 成功' : '─ 跳过'}\nGitee独立备份：${giteeSuccess ? '✓ 成功' : '─ 跳过'}`);
            this.checkAndWarnRetentionLimit();
        } else {
            alert("❌ 跨云独立备份写入失败，请检查独立仓库名称或 API Token 权限！");
        }
    },

    // 4. 👑 巡检存档数量：超过 20 个强力高亮警告，要求清理
    checkAndWarnRetentionLimit: async function() {
        const tokens = this.getVaultTokens();
        const ghRepo = localStorage.getItem("APEX_VAULT_GH_REPO") || this.config.ghBackupRepo;
        if (!tokens.ghToken) return;

        try {
            const url = `https://api.github.com/repos/${this.config.ghOwner}/${ghRepo}/contents/snapshots`;
            const res = await fetch(url, {
                headers: { "Authorization": `token ${tokens.ghToken}` }
            });
            if (!res.ok) return;
            const files = await res.json();
            
            if (Array.isArray(files) && files.length > this.config.maxLimit) {
                const extraCount = files.length - this.config.maxLimit;
                const confirmOpen = confirm(
                    `🔴 [独立金库警报] 检测到跨云存档版本数量已达 ${files.length} 个（安全阈值为 20 个）！\n\n有 ${extraCount} 个旧版本超出限制，强烈建议立刻清理以保持备份库高精可用。\n\n要立刻打开【跨云存档版本控制台】删除旧版本吗？`
                );
                if (confirmOpen && window.openVaultModal) {
                    window.openVaultModal();
                }
            }
        } catch (e) {
            console.log("巡检异常，可能是初始空仓库:", e);
        }
    },

    // 5. 渲染管理列表 (可在网页后台一键删除指定版本)
    renderVaultList: async function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 font-mono">从跨云独立金库拉取存档中...</div>`;

        const tokens = this.getVaultTokens();
        const ghRepo = localStorage.getItem("APEX_VAULT_GH_REPO") || this.config.ghBackupRepo;
        if (!tokens.ghToken) {
            container.innerHTML = `<div class="p-4 text-center text-xs text-rose-500 font-mono">请填入 GitHub / Gitee 密钥后查看独立备份</div>`;
            return;
        }

        try {
            const url = `https://api.github.com/repos/${this.config.ghOwner}/${ghRepo}/contents/snapshots`;
            const res = await fetch(url, { headers: { "Authorization": `token ${tokens.ghToken}` } });
            if (!res.ok) {
                container.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 font-mono">独立仓库暂无 snapshots/ 快照记录</div>`;
                return;
            }
            const files = await res.json();
            if (!Array.isArray(files) || files.length === 0) {
                container.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 font-mono">当前独立仓库为空</div>`;
                return;
            }

            // 倒序：新的在前面
            files.reverse();
            container.innerHTML = "";

            const isWarning = files.length > 20;
            if (isWarning) {
                container.innerHTML += `
                    <div class="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 font-bold text-xs flex items-center justify-between">
                        <span>🔴 当前共 ${files.length} 个独立版本！超出安全阈值 (20个)，请点击右侧删除清理旧档：</span>
                        <span class="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px]">限额超载</span>
                    </div>
                `;
            }

            files.forEach((file, index) => {
                const isOverLimit = index >= 20;
                const rowStyle = isOverLimit 
                    ? "border-rose-500/40 bg-rose-500/5" 
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900";
                
                container.innerHTML += `
                    <div class="p-3 rounded-xl border ${rowStyle} flex items-center justify-between gap-3 text-xs font-mono">
                        <div class="min-w-0 flex-1">
                            <div class="font-bold text-[#0f172a] dark:text-[#f8fafc] truncate">${file.name}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>#${files.length - index}</span>
                                <span>SHA: ${file.sha.slice(0, 7)}</span>
                                ${isOverLimit ? '<span class="text-rose-500 font-bold">[超过保留阈值建议删除]</span>' : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            <button onclick="ApexVersionVault.restoreSnapshot('${file.path}', '${file.sha}')" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm">
                                📥 载入恢复
                            </button>
                            <button onclick="ApexVersionVault.deleteSnapshot('${file.name}', '${file.sha}')" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm">
                                🗑️ 销毁
                            </button>
                        </div>
                    </div>
                `;
            });
        } catch (e) {
            container.innerHTML = `<div class="p-4 text-center text-xs text-rose-500 font-mono">读取列表失败: ${e.message}</div>`;
        }
    },

    // 6. 销毁指定存档快照
    deleteSnapshot: async function(fileName, sha) {
        if (!confirm(`⚠️ 确定要从跨云独立金库中永久销毁存档【${fileName}】吗？`)) return;
        const tokens = this.getVaultTokens();
        const ghRepo = localStorage.getItem("APEX_VAULT_GH_REPO") || this.config.ghBackupRepo;

        try {
            const url = `https://api.github.com/repos/${this.config.ghOwner}/${ghRepo}/contents/snapshots/${fileName}`;
            const res = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Authorization": `token ${tokens.ghToken}`,
                    "Accept": "application/vnd.github.v3+json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: `🗑️ VAULT-DEL: Delete ${fileName} [skip ci]`,
                    sha: sha
                })
            });
            if (res.ok) {
                alert("✅ 该存档已被永久删除！");
                this.renderVaultList("vault-snapshots-list");
            } else {
                alert("❌ 删除失败！");
            }
        } catch (e) {
            alert("❌ 删除发生异常: " + e.message);
        }
    },

    // 7. 从独立备份一键重置当前网站参数
    restoreSnapshot: async function(filePath, sha) {
        if (!confirm("⏳ 警告：将从独立金库读取该快照，并覆盖当前后台的定价、轮播图及系统配置，继续吗？")) return;
        const tokens = this.getVaultTokens();
        const ghRepo = localStorage.getItem("APEX_VAULT_GH_REPO") || this.config.ghBackupRepo;

        try {
            const url = `https://api.github.com/repos/${this.config.ghOwner}/${ghRepo}/contents/${filePath}`;
            const res = await fetch(url, { headers: { "Authorization": `token ${tokens.ghToken}` } });
            const data = await res.json();
            const jsonStr = this.b64ToUtf8(data.content);
            const vaultObj = JSON.parse(jsonStr);

            if (vaultObj.data) {
                if (vaultObj.data.banner) localStorage.setItem("APEX_BANNER_CONFIG", JSON.stringify(vaultObj.data.banner));
                if (vaultObj.data.pricing) localStorage.setItem("APEX_PRICING_CONFIG", JSON.stringify(vaultObj.data.pricing));
                if (vaultObj.data.users) localStorage.setItem("APEX_USER_LIST", JSON.stringify(vaultObj.data.users));
                if (vaultObj.data.tasks) localStorage.setItem("APEX_TASKS_CACHE", JSON.stringify(vaultObj.data.tasks));
                if (vaultObj.data.logo) localStorage.setItem("APEX_CUSTOM_LOGO", vaultObj.data.logo);
                alert(`✅ 独立金库快照读取成功！\n\n存档备注：【${vaultObj.note}】\n生成时间：${vaultObj.created_at}\n\n系统立刻刷新以载入全站最新状态。`);
                window.location.reload();
            }
        } catch (e) {
            alert("❌ 恢复失败: " + e.message);
        }
    },

    utf8ToB64: function(str) { return window.btoa(unescape(encodeURIComponent(str))); },
    b64ToUtf8: function(str) { return decodeURIComponent(escape(window.atob(str))); }
};
