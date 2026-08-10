/**
 * APEXWORK 模块 2：AI 大模型生产车间与 Git 源码时空快照 (admin-ai.js)
 */

let currentSnapTab = 'tags';
let currentTagsPage = 1;
const TAGS_PER_PAGE = 8; 

// ==========================================
// 👑 终极 AI 引擎：深度差异化内页 + 匹配顶级商业实拍图库
// ==========================================
window.triggerSwarmAutonomousAction = async function() {
    const btn = document.getElementById("runBtn");
    const cmdBox = document.getElementById("cmd");
    let rawText = "常规进展汇报";
    if (cmdBox) {
        rawText = cmdBox.tagName === "INPUT" || cmdBox.tagName === "TEXTAREA" ? cmdBox.value : cmdBox.innerText;
        rawText = rawText.replace(/@[^ ]+/g, "").trim() || cmdBox.innerText.trim();
    }
    
    if (btn) { btn.disabled = true; btn.innerHTML = "<span>⚙️ AI 大脑深度推演中...</span>"; }

    try {
        const keys = window.getKeysSafe();
        if (!keys.ds || !keys.gh) throw new Error("缺少 DeepSeek 或 GitHub 密钥");
        
        if (rawText.includes("主动产品部") || rawText.includes("审核质量部") || rawText.includes("生成") || rawText.includes("模板")) {
            
            if (cmdBox) {
                if (cmdBox.tagName === "INPUT" || cmdBox.tagName === "TEXTAREA") cmdBox.value = "";
                else cmdBox.innerHTML = "";
            }

            window.appendLog(`🤖 [大脑中枢]: 收到深度生成指令，正在构建完全差异化的业务骨架与文案...`);
            
            // 👑 深度生成结构：不仅要外壳，连里面的 5 个子页面数据都要 AI 一次性想好！
            const aiPrompt = `你是一个顶尖SaaS产品经理。请自动生成3个完全不同的全新商业模板作品（1个PPT, 1个Excel, 1个Word）。
请严格返回JSON数组格式，绝不包含任何 markdown 符号。
要求字段："type" (ppt/excel/word), "name" (大气的模板名称), "category" (如 30 SLIDES · 高级路演), "priceRmb" (数字), "priceUsd" (字符串), "slides" (如果是ppt或excel，请务必生成5个差异化的页面骨架对象数组，每个对象包含: "title" 标题, "sub" 副标题, "kpi" 百分比或金额数据, "label" 指标名称, "progress" 进度数字)。
样例：[{"type":"ppt", "name":"星舰战略舱", "category":"5 SLIDES", "priceRmb":129, "priceUsd":"19.99", "slides":[{"title":"执行摘要","sub":"核心痛点与解法","kpi":"+200%","label":"增长率","progress":85}]}]`;
            
            const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST", headers: { "Authorization": `Bearer ${keys.ds}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: aiPrompt }], temperature: 0.85 })
            });
            
            if (!dsRes.ok) throw new Error("AI 接口调用失败");
            const aiAnswer = (await dsRes.json()).choices[0].message.content;
            const jsonMatch = aiAnswer.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("AI 数据格式异常");
            const generatedData = JSON.parse(jsonMatch[0]);

            window.appendLog(`🔨 [主动产品部]: 深度结构创作完毕！产出：《${generatedData.map(d=>d.name).join('》、《')}》。`);
            await new Promise(r => setTimeout(r, 1000));
            window.appendLog(`🎨 [视觉策划部]: 正在从顶级商业图库匹配 95分+ 质感的实景封面...`);

            // 👑 顶级无损实拍图库，摒弃辣眼睛的 AI 乱码图
            const premiumImages = {
                ppt: [
                    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=90",
                    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=90",
                    "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=90",
                    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=90",
                    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=90"
                ],
                excel: [
                    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=90",
                    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=90",
                    "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=90",
                    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=90",
                    "https://images.unsplash.com/photo-1531538512162-262fac7fb818?auto=format&fit=crop&w=800&q=90"
                ],
                word: [
                    "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=90",
                    "https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&w=800&q=90",
                    "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=90",
                    "https://images.unsplash.com/photo-1618044733300-9472054094ee?auto=format&fit=crop&w=800&q=90"
                ]
            };

            const newTemplates = generatedData.map((t) => {
                const rId = "AI-" + Math.floor(10000 + Math.random()*90000);
                const typeStr = t.type ? t.type.toLowerCase() : 'ppt';
                let col = typeStr === 'excel' ? 'text-emerald-600 font-bold' : (typeStr === 'word' ? 'text-indigo-600 font-bold' : 'text-orange-500 font-bold');
                
                const imgPool = premiumImages[typeStr] || premiumImages.ppt;
                const imgUrl = imgPool[Math.floor(Math.random() * imgPool.length)];

                return {
                    id: rId, title: t.name, name: t.name, category: t.category, type: typeStr,
                    thumb: imgUrl, thumbnail: imgUrl, thumbKey: "prod_" + rId, 
                    thumbCloudPath: imgUrl, thumbDefault: imgUrl,
                    priceRmb: t.priceRmb || 99, priceUsd: t.priceUsd || "14.99", colorCls: col,
                    isLinked: true, status: true,
                    slides: t.slides || null // 保存深度数据供前台解析
                };
            });

            // 👑 安全队列锁定
            while(window.isCloudSyncing) { await new Promise(r => setTimeout(r, 500)); }
            window.isCloudSyncing = true;
            
            try {
                let existingDecks = [];
                let decksSha = null;
                const blacklist = JSON.parse(localStorage.getItem('APEX_DELETED_ZOMBIES') || '[]');
                try {
                    const f = await window.getGithubFileSafe("data/ai-generated-decks.json", keys.gh);
                    if (f.content) { const parsed = JSON.parse(f.content); if (Array.isArray(parsed)) existingDecks = parsed; }
                    decksSha = f.sha;
                } catch(e){}
                
                existingDecks = existingDecks.filter(d => !blacklist.includes(d.id));
                const combinedDecks = [...newTemplates, ...existingDecks];
                await window.pushGithubJsonFile("data/ai-generated-decks.json", combinedDecks, decksSha, "🤖 AI Worker: 上架 3 款差异化产品 [skip ci]", keys.gh);

                if (typeof window.AUDIT_PRODUCTS !== "undefined" && typeof window.renderAuditTable === "function") {
                    newTemplates.forEach(t => window.AUDIT_PRODUCTS.unshift(t));
                    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(window.AUDIT_PRODUCTS));
                    window.renderAuditTable();
                }
                window.appendLog(`✅ [系统广播]: 自动化生产完毕！商品已成功写入云端数据库！`);
            } finally {
                window.isCloudSyncing = false;
            }

        } else {
            const prompt = `董事长指令：${rawText}。简短回复，带部门前缀。`;
            const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST", headers: { "Authorization": `Bearer ${keys.ds}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.4 })
            });
            window.appendLog(`🤖 回复: ${(await dsRes.json()).choices[0].message.content}`);
            if (cmdBox) { cmdBox.tagName === "INPUT" || cmdBox.tagName === "TEXTAREA" ? cmdBox.value = "" : cmdBox.innerHTML = ""; }
        }
    } catch (err) {
        window.appendLog(`❌ 执行异常: ${err.message}`, "text-rose-500");
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = "<span>🚀 提交至云端 AI 协同执行</span>"; }
    }
};

// ==========================================
// Git 源码快照与回溯引擎
// ==========================================
window.openRollbackModal = function() {
    const el = document.getElementById("rollbackModal");
    if (el) el.classList.remove("hidden");
    if (currentSnapTab === 'tags') window.fetchTaggedCommits(true);
    else window.fetchNormalCommits(true);
};

window.closeRollbackModal = function() {
    const el = document.getElementById("rollbackModal");
    if (el) el.classList.add("hidden");
};

window.switchSnapshotTab = function(tab) {
    currentSnapTab = tab;
    const btnTags = document.getElementById("tab-btn-tags");
    const btnNormal = document.getElementById("tab-btn-normal");
    const contTags = document.getElementById("commitListTagsContainer");
    const contNormal = document.getElementById("commitListNormalContainer");
    const pagination = document.getElementById("snapshotPagination");

    if (tab === 'tags') {
        if(btnTags) btnTags.className = "flex-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm transition";
        if(btnNormal) btnNormal.className = "flex-1 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition";
        if(contTags) contTags.classList.remove("hidden");
        if(contNormal) contNormal.classList.add("hidden");
        if(pagination) pagination.classList.remove("hidden");
        window.fetchTaggedCommits();
    } else {
        if(btnNormal) btnNormal.className = "flex-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm transition";
        if(btnTags) btnTags.className = "flex-1 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition";
        if(contNormal) contNormal.classList.remove("hidden");
        if(contTags) contTags.classList.add("hidden");
        if(pagination) pagination.classList.add("hidden");
        window.fetchNormalCommits();
    }
};

window.changeTagsPage = function(delta) {
    if (delta === -1 && currentTagsPage > 1) { currentTagsPage--; window.fetchTaggedCommits(); } 
    else if (delta === 1) { currentTagsPage++; window.fetchTaggedCommits(); }
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
            currentTagsPage = 1;
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

window.fetchTaggedCommits = async function(forceRefresh = false) {
    const container = document.getElementById("commitListTagsContainer");
    if (!container) return;
    container.innerHTML = `<div class="text-center text-xs text-slate-400 py-6 font-mono animate-pulse">正在从 GitHub 底层索引永久标记...</div>`;
    const label = document.getElementById("currentTagsPageLabel");
    if(label) label.innerText = currentTagsPage;
    
    const ghToken = localStorage.getItem("APEX_GH_TOKEN");
    if (!ghToken) return container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 font-mono leading-relaxed">缺少 GitHub Token。</div>`;

    try {
        const ts = forceRefresh ? `&_t=${Date.now()}` : '';
        const [res, blacklistRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${window.REPO}/commits?path=data/.snapshot&page=${currentTagsPage}&per_page=${TAGS_PER_PAGE}${ts}`, { headers: { "Authorization": `token ${ghToken}` } }),
            window.getGithubFileSafe("config/deleted_tags.json", ghToken)
        ]);
        
        if (!res.ok) throw new Error("无法读取提交记录");
        
        let blacklist = [];
        if (blacklistRes.content) { try { blacklist = JSON.parse(blacklistRes.content); } catch(e){} }
        
        const commits = await res.json();
        container.innerHTML = "";
        
        if (commits.length === 0) {
            container.innerHTML = `<div class="text-center text-xs text-slate-500 py-6 font-mono">第 ${currentTagsPage} 页已无更多记录</div>`;
            const btnNext = document.getElementById("btnNextTags");
            const btnPrev = document.getElementById("btnPrevTags");
            if(btnNext) btnNext.disabled = true;
            if(currentTagsPage === 1 && btnPrev) btnPrev.disabled = true;
            return;
        }

        const btnPrev = document.getElementById("btnPrevTags");
        const btnNext = document.getElementById("btnNextTags");
        if(btnPrev) btnPrev.disabled = (currentTagsPage === 1);
        if(btnNext) btnNext.disabled = (commits.length < TAGS_PER_PAGE);

        const filteredCommits = commits.filter(c => !blacklist.includes(c.sha));
        if (filteredCommits.length === 0) {
            container.innerHTML = `<div class="text-center text-xs text-slate-400 py-6 font-mono leading-relaxed">本页的标记均已被您取消。<br>请点击【下一页】查看更多历史。</div>`;
            return;
        }

        filteredCommits.forEach((item, idx) => {
            const shaShort = item.sha.slice(0, 7);
            const timeStr = new Date(item.commit.committer.date).toLocaleString('zh-CN', { hour12: false });
            container.innerHTML += `
                <div class="rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-sm transition hover:shadow-md mb-2">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="font-bold text-blue-600 dark:text-blue-400">[#${shaShort}]</span>
                            <span class="text-[10px] text-slate-500">${timeStr}</span>
                            <span class="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded ml-1 tracking-widest shadow-sm">📌 永久保留</span>
                        </div>
                        <div class="text-xs truncate text-blue-700 dark:text-blue-300 font-bold" title="${item.commit.message}">${item.commit.message}</div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button onclick="window.deleteSnapshotTag('${item.sha}', '${shaShort}', event)" class="px-2.5 py-1.5 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 text-rose-500 transition shadow-sm">取消标记</button>
                        <button onclick="window.revertToSelectedCommit('${item.sha}', '${shaShort}')" class="px-3 py-1.5 border border-blue-300 rounded-lg text-xs font-bold hover:bg-blue-100 transition text-blue-600 shadow-sm">
                            ${(currentTagsPage === 1 && idx === 0) ? '当前状态' : '还原'}
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (err) { container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 font-mono">拉取异常，请检查网络。</div>`; }
};

window.fetchNormalCommits = async function(forceRefresh = false) {
    const container = document.getElementById("commitListNormalContainer");
    if (!container) return;
    container.innerHTML = `<div class="text-center text-xs text-slate-400 py-6 font-mono animate-pulse">正在获取最近30条流水记录...</div>`;
    
    const ghToken = localStorage.getItem("APEX_GH_TOKEN");
    if (!ghToken) return container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4">缺少 GitHub Token。</div>`;

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
            const bgCls = isRollback ? "bg-purple-50 border border-purple-200" : "bg-slate-50 border border-transparent";

            container.innerHTML += `
                <div class="rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${bgCls} mb-2 transition hover:shadow-md">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="font-bold text-amber-500">[#${shaShort}]</span>
                            <span class="text-[10px] text-slate-400">${timeStr}</span>
                        </div>
                        <div class="text-xs truncate ${isRollback ? 'text-purple-600 font-bold' : 'text-slate-800'}" title="${item.commit.message}">${item.commit.message}</div>
                    </div>
                    <button onclick="window.revertToSelectedCommit('${item.sha}', '${shaShort}')" class="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 transition shrink-0 shadow-sm">
                        ${idx === 0 ? '当前状态' : '还原'}
                    </button>
                </div>
            `;
        });
    } catch (err) { container.innerHTML = `<div class="text-center text-xs text-rose-500 py-4 font-mono">拉取异常，请检查网络。</div>`; }
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

// 部门联动指令控制模块
const deptConfig = [
    { name: "大脑中枢", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30" },
    { name: "缺陷与QA质检部", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30" },
    { name: "主动产品部", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30" },
    { name: "施工工程部", cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30" },
    { name: "视觉策划部", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" },
    { name: "审核质量部", cls: "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/40" },
    { name: "转化销售部", cls: "bg-pink-500/10 text-pink-600 border-pink-500/30 dark:bg-pink-500/20 dark:text-pink-400 dark:border-pink-500/40" },
    { name: "推广营销部", cls: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/40" },
    { name: "国际法务部", cls: "bg-teal-500/10 text-teal-600 border-teal-500/30 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/40" }
];

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
    if (matches.length === 0) { dropEl.style.display = "none"; return; }
    dropEl.innerHTML = "";
    matches.forEach(dept => {
        const item = document.createElement("button");
        item.className = "group w-full text-left px-4 py-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-colors whitespace-nowrap flex items-center";
        item.innerHTML = `<span class="text-blue-500 mr-2 group-hover:text-white transition">@</span> ${dept.name}`;
        item.onmousedown = (e) => { e.preventDefault(); window.selectMentionDept(dept.name); };
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
    window.hideMentionDropdown();
    window.appendLog(`🎯 追加指令 @${deptName}`);
};

window.inspectDept = function(deptName, btnEl) {
    window.activeFilterDept = deptName;
    document.querySelectorAll(".dept-btn").forEach(el => el.style.opacity = "0.4");
    if (btnEl) btnEl.style.opacity = "1";
    const activeLabel = document.getElementById("activeDeptLabel");
    if (activeLabel) activeLabel.innerText = `[${deptName}]`;

    const cmdBox = document.getElementById("cmd");
    if (window.isCmdActive && cmdBox) {
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
        window.appendLog(`🎯 追加指令 @${deptName}`);
    } else {
        window.appendLog(`🔍 视图切换 -> [${deptName}] (未聚焦文本框，不追加词条)`);
    }
    window.loadHistoryFromMemory();
};

window.resetDeptFilter = function() {
    window.activeFilterDept = "";
    window.isCmdActive = false;
    document.querySelectorAll(".dept-btn").forEach(el => el.style.opacity = "1");
    const activeLabel = document.getElementById("activeDeptLabel");
    if (activeLabel) activeLabel.innerText = `[全景视图]`;
    const cmdBox = document.getElementById("cmd");
    if (cmdBox) cmdBox.innerHTML = "";
    window.appendLog(`🌐 恢复全景视角`);
    window.loadHistoryFromMemory();
};
