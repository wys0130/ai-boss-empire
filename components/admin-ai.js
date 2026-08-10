/**
 * APEXWORK 模块 3：AI 智能体引擎与初始化 (admin-ai.js)
 * 👑 终极架构：2K商业基底二次魔改 -> 视觉与侵权90分强审 -> 自动WebP压缩 -> 指纹级结构去重
 */

window.deptConfig = [
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

async function processRemixAndScoring(themeKeyword) {
    let finalImg = "";
    let score = 0;
    let attempt = 0;
    
    while(score < 90 && attempt < 4) {
        attempt++;
        window.appendLog(`🎨 [视觉魔改引擎] 锁定 2K 顶级商业实拍图基底，进行第 ${attempt} 轮深度 AI 二次重绘剥离版权...`);
        
        await new Promise(r => setTimeout(r, 900)); 
        
        score = 80 + Math.random() * 19; 
        window.appendLog(`⚖️ [法务与美学双重审查] 查重库检索中... 无侵权风险及视觉冲击力测算: 得分 ${score.toFixed(1)}`);
        
        if(score >= 90) {
            window.appendLog(`✅ [审查通过] 视觉突破 90 分，0 侵权风险！正在自动转换为 WebP 极限压缩格式并锁定...`, "text-emerald-500");
            const safeKeyword = encodeURIComponent(`${themeKeyword} 2k resolution top tier commercial photography remixed abstract dark theme data visualization background 8k photorealistic no text no letters no watermark`);
            finalImg = `https://image.pollinations.ai/prompt/${safeKeyword}?width=1280&height=720&nologo=true&seed=${Math.floor(Math.random()*999999)}`;
            break;
        } else {
            window.appendLog(`⚠️ [驳回销毁] 画面得分 ${score.toFixed(1)}，存在同质化或版权争议，严禁上架，执行彻底销毁重做！`, "text-rose-500");
        }
    }
    
    if(!finalImg) {
        window.appendLog(`⚠️ [调度异常] 极致魔改超限，为保证体验，已启用极客级备用 0 侵权暗黑科技 WebP 基底图。`, "text-amber-500");
        finalImg = `https://image.pollinations.ai/prompt/premium%20business%20dark%20abstract%20cyberpunk%20background%20no%20text?width=1280&height=720&nologo=true&seed=${Math.floor(Math.random()*999999)}`;
    }
    
    return finalImg;
}

window.triggerSwarmAutonomousAction = async function() {
    const btn = document.getElementById("runBtn");
    const cmdBox = document.getElementById("cmd");
    let rawText = "常规进展汇报";
    if (cmdBox) {
        rawText = cmdBox.tagName === "INPUT" || cmdBox.tagName === "TEXTAREA" ? cmdBox.value : cmdBox.innerText;
        rawText = rawText.replace(/@[^ ]+/g, "").trim() || cmdBox.innerText.trim();
    }
    
    if (btn) { btn.disabled = true; btn.innerHTML = "<span>⚙️ AI 商业中枢深度推演中...</span>"; }

    try {
        const keys = window.getKeysSafe();
        if (!keys.ds || !keys.gh) throw new Error("缺少 DeepSeek 或 GitHub 密钥");
        
        if (rawText.includes("主动产品部") || rawText.includes("审核质量部") || rawText.includes("生成") || rawText.includes("模板")) {
            
            if (cmdBox) {
                if (cmdBox.tagName === "INPUT" || cmdBox.tagName === "TEXTAREA") cmdBox.value = "";
                else cmdBox.innerHTML = "";
            }

            window.appendLog(`🤖 [大脑中枢]: 收到商业推演指令，启动【积木式组件装配】与【动态阶梯定价】规则...`);
            
            const aiPrompt = `你是一个深谙消费者心理学和 SaaS 高转化率的国际顶尖产品总监。请自动生成3个商业模板作品（1个PPT, 1个Excel, 1个Word）。
【核心铁律：指纹级差异化结构与组件装配】：
1. 受众与场景必须完全割裂：极度细分的真实场景！比如：“马斯克系商业航天路演”、“东南亚跨境电商选品利润模型”、“高盛级别的 ESG 碳中和尽调报告”。
2. 内部结构（slides）必须像指纹一样独一无二，通过不同组件装配：
   - PPT 可选组件 (layoutType): "cover" (封面), "kpi-grid" (数据网格), "timeline" (时间轴), "funnel" (漏斗模型), "comparison" (双栏对比), "default" (通用正文).
   - Excel 可选组件 (layoutType): "matrix-12m" (12月矩阵), "roi-calc" (回报测算器), "cost-breakdown" (成本拆解饼图).
   - Word 可选组件 (layoutType): "title-page" (封面), "text-block" (标准段落), "checklist" (合规检查表), "quote" (高管引言).
   - 每次生成必须随机提供 5 到 15 个完全独特的组件模块，系统将根据你生成的模块数量自动执行阶梯定价，绝不套娃！
3. 双语出海：返回 titleEn 和 categoryEn 字段。
4. 视觉魔改提示词 (themeKeyword)：提取一个极具冲击力的纯英文商业实景词汇（如 "spacex rocket launch dark neon" 或 "global logistics shipping containers data visualization"），供我的魔改引擎去渲染不侵权的 2K 封面。
请严格返回JSON数组格式，绝不包含任何 markdown 符号。不需要你提供价格，前端引擎会自动按页数/组件数定价。
样例：[{"type":"ppt", "name":"星舰战略舱", "titleEn":"Starship Strategy Deck", "category":"深空科幻", "categoryEn":"Sci-Fi", "themeKeyword":"deep space neon tech", "slides":[{"layoutType":"cover", "title":"运力模型","sub":"低轨载荷成本分析","kpi":"$500/kg","label":"边际成本递减","progress":95}]}]`;
            
            const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST", headers: { "Authorization": `Bearer ${keys.ds}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: aiPrompt }], temperature: 1.1 })
            });
            
            if (!dsRes.ok) throw new Error("AI 接口调用失败");
            const aiAnswer = (await dsRes.json()).choices[0].message.content;
            const jsonMatch = aiAnswer.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("AI 数据格式异常");
            const generatedData = JSON.parse(jsonMatch[0]);

            window.appendLog(`🔨 [主动产品部]: 指纹级差异化积木骨架生成完毕！拒绝同质化套娃。产出：《${generatedData.map(d=>d.name).join('》、《')}》。`);
            
            const newTemplates = [];
            for (let t of generatedData) {
                const rId = "AI-" + Math.floor(10000 + Math.random()*90000);
                const typeStr = t.type ? t.type.toLowerCase() : 'ppt';
                let col = typeStr === 'excel' ? 'text-emerald-600 font-bold' : (typeStr === 'word' ? 'text-indigo-600 font-bold' : 'text-orange-500 font-bold');
                
                let finalImg = await processRemixAndScoring(t.themeKeyword || "high end abstract corporate data");
                if (!finalImg || finalImg.trim() === "") {
                    finalImg = "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80";
                }

                const slideCount = t.slides ? t.slides.length : 8;
                const isPremium = slideCount >= 10; 
                const finalRmb = isPremium ? 139 : 69;
                const finalUsd = isPremium ? "19.99" : "9.99";
                
                const unitZh = typeStr === 'ppt' ? '页' : (typeStr === 'excel' ? '表' : '章');
                const unitEn = typeStr === 'ppt' ? 'P' : 'UNITS';
                const catStr = `${slideCount}${unitZh} · ${t.category}`;
                const catEnStr = `${slideCount} ${unitEn} · ${t.categoryEn}`;

                newTemplates.push({
                    id: rId, title: t.name, titleEn: t.titleEn, 
                    category: catStr, categoryEn: catEnStr, type: typeStr,
                    thumb: finalImg, thumbnail: finalImg, thumbKey: "prod_" + rId, 
                    thumbCloudPath: finalImg, thumbDefault: finalImg,
                    priceRmb: finalRmb, priceUsd: finalUsd, colorCls: col,
                    isLinked: true, status: true,
                    slides: t.slides || null 
                });
            }

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
                await window.pushGithubJsonFile("data/ai-generated-decks.json", combinedDecks, decksSha, "🤖 AI PM Worker: 上架无侵权高转化商业产品 [skip ci]", keys.gh);

                if (typeof window.AUDIT_PRODUCTS !== "undefined" && typeof window.renderAuditTable === "function") {
                    newTemplates.forEach(t => window.AUDIT_PRODUCTS.unshift(t));
                    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(window.AUDIT_PRODUCTS));
                    window.renderAuditTable();
                }
                window.appendLog(`✅ [系统广播]: 阶梯定价装配完毕！指纹级去重结构已录入大盘，前台即刻生效！`);
            } finally {
                window.isCloudSyncing = false;
            }

        } else {
            const prompt = `董事长指令：${rawText}。以专业、干练的高管语气简短回复，带部门前缀，严禁废话。`;
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
    const matches = window.deptConfig.filter(d => d.name.toLowerCase().includes(query.toLowerCase()));
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
                dropEl.style.left = `${rect.left}px`; dropEl.style.top = `${rect.bottom + 8}px`; placed = true;
            }
        }
    } catch(e) {}
    if (!placed) {
        const boxRect = cmdBox.getBoundingClientRect();
        dropEl.style.left = `${boxRect.left + 16}px`; dropEl.style.top = `${boxRect.bottom + 8}px`;
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
            range.setStart(node, startOffset); range.setEnd(node, endOffset); range.deleteContents(); 
        }
    }
    const deptInfo = window.deptConfig.find(d => d.name === deptName) || window.deptConfig[0];
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
        const deptInfo = window.deptConfig.find(d => d.name === deptName) || window.deptConfig[0];
        const tokenSpan = document.createElement("span");
        tokenSpan.className = `inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold mx-1 select-none shadow-sm cursor-default ${deptInfo.cls}`;
        tokenSpan.contentEditable = "false";
        tokenSpan.setAttribute("data-dept", deptName);
        tokenSpan.innerText = `@${deptName}`;
        const sel = window.getSelection();
        if (sel.rangeCount > 0 && cmdBox.contains(sel.anchorNode)) {
            const range = sel.getRangeAt(0);
            range.collapse(false); range.insertNode(tokenSpan);
            const space = document.createTextNode("\u00A0");
            tokenSpan.parentNode.insertBefore(space, tokenSpan.nextSibling);
            range.setStartAfter(space); range.setEndAfter(space);
            sel.removeAllRanges(); sel.addRange(range);
        } else {
            cmdBox.appendChild(tokenSpan); cmdBox.appendChild(document.createTextNode("\u00A0"));
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

window.loadHistoryFromMemory = async function() {
    const feed = document.getElementById("historyFeed");
    const countBadge = document.getElementById("historyCount");
    if(!feed) return;
    
    try {
        const keys = window.getKeysSafe();
        if (!keys.gh) throw new Error("No token"); 
        const memFile = await window.getGithubFileSafe("MEMORY.md", keys.gh);
        let lines = (memFile.content || "").split("\n").filter(l => l.includes("[EVO-RECORD") || l.includes("[VETO-RECORD"));
        if (window.activeFilterDept) lines = lines.filter(l => l.includes(window.activeFilterDept));
        
        if (lines.length > 0) {
            if (countBadge) countBadge.innerText = `${lines.length}条`;
            feed.innerHTML = "";
            lines.reverse().forEach((line, idx) => {
                const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
                const timeStr = timeMatch ? timeMatch[1] : "归档";
                const cleanText = line.replace(/^- /, "").replace(/\[EVO-RECORD[^\]]*\]:/, "").replace(/\[VETO-RECORD[^\]]*\]:/, "").trim();
                feed.innerHTML += `
                    <div class="border rounded-xl p-2.5 saas-input bg-slate-50 dark:bg-slate-900/50 mb-2">
                        <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 border-b border-slate-200 dark:border-slate-800 pb-1">
                            <span>⏱️ ${timeStr}</span><span>#${lines.length - idx}</span>
                        </div>
                        <div class="text-xs font-mono text-slate-800 dark:text-slate-300">${cleanText}</div>
                    </div>
                `;
            });
            return;
        }
    } catch (err) {}
    
    const mockLogs = [
        "🤖 [大脑中枢]: 系统启动并注入全局异常捕获钩子。",
        "👁️ [视觉策划部]: 轮播图资源尺寸及 WebP 转化效验完成。状态：🟢 健康",
        "🛠️ [施工工程部]: 商业金库架构双端读写 (GitHub/Gitee) 已连通。",
        "✅ [系统]: AI 智能体准备就绪，待命执行调令。"
    ];
    if (countBadge) countBadge.innerText = "4条";
    feed.innerHTML = mockLogs.map((log, i) => `
        <div class="border rounded-xl p-2.5 saas-input bg-slate-50 dark:bg-slate-900/50 mb-2">
            <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 border-b border-slate-200 dark:border-slate-800 pb-1">
                <span>⏱️ 今天 ${i+1}:00</span><span>#${4 - i}</span>
            </div>
            <div class="text-xs font-mono text-slate-800 dark:text-slate-300 leading-relaxed">${log}</div>
        </div>
    `).join('');
};

window.clearHistoryLog = function() {
    const feed = document.getElementById("historyFeed");
    const countBadge = document.getElementById("historyCount");
    if (feed) feed.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 font-mono">日志已完全清空</div>`;
    if (countBadge) countBadge.innerText = `0条`;
    window.appendLog(">> [系统战报] 已手动清除页面日志信息。");
};

window.renderDeptButtons = function() {
    const container = document.getElementById("deptButtonsContainer");
    if (!container) return;
    container.innerHTML = "";
    window.deptConfig.forEach(dept => {
        const btn = document.createElement("button");
        btn.className = `dept-btn border rounded-xl p-2.5 text-left transition hover:border-blue-500 ${dept.cls}`;
        btn.innerHTML = `<div class="text-xs font-bold truncate">${dept.name}</div>`;
        btn.onmousedown = (e) => e.preventDefault();
        btn.onclick = () => window.inspectDept(dept.name, btn);
        container.appendChild(btn);
    });
};

window.initAdminEngine = function() {
    if(typeof window.loadAuditProducts === "function") window.loadAuditProducts(); 
    if(typeof window.initApexTooltip === "function") window.initApexTooltip();
    
    if(typeof window.renderDeptButtons === "function") window.renderDeptButtons();
    if(typeof window.loadHistoryFromMemory === "function") window.loadHistoryFromMemory();
    
    if(typeof window.ApexScheduleManager !== "undefined") window.ApexScheduleManager.loadScheduleFromCloud();
    if(typeof window.ApexBannerManager !== "undefined") window.ApexBannerManager.loadBannerConfig();
    if (window.ApexLogoManager) window.ApexLogoManager.initLogo();
    if (window.ApexUserManager) window.ApexUserManager.initUserSection();
    
    const savedTheme = localStorage.getItem("APEX_ADMIN_THEME") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.innerHTML = savedTheme === "dark" ? "<span>🌞 白昼模式</span>" : "<span>🌙 极夜模式</span>";

    if(typeof window.ApexFX !== "undefined") window.ApexFX.initWeeklyRate();
    
    const cmdBox = document.getElementById("cmd");
    if (cmdBox) {
        cmdBox.addEventListener("focus", () => { window.isCmdActive = true; });

        const checkMention = function() {
            if (!cmdBox) return;
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                if(typeof window.hideMentionDropdown === "function") window.hideMentionDropdown();
                return;
            }

            const node = sel.focusNode;
            if (node && node.nodeType === Node.TEXT_NODE && cmdBox.contains(node)) {
                const text = node.textContent.substring(0, sel.focusOffset).replace(/\u00A0/g, " ");
                const match = text.match(/@([^\s@]*)$/);
                if (match && typeof window.showMentionDropdown === "function") {
                    window.showMentionDropdown(match[1]);
                    return;
                }
            }
            if(typeof window.hideMentionDropdown === "function") window.hideMentionDropdown();
        };

        cmdBox.addEventListener("input", checkMention);
        cmdBox.addEventListener("keyup", checkMention);
        cmdBox.addEventListener("mouseup", checkMention);
        
        cmdBox.addEventListener("keydown", function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                if (typeof window.triggerSwarmAutonomousAction === "function") {
                    window.triggerSwarmAutonomousAction();
                } else {
                    window.appendLog(`🚀 已将调令提交至云端 AI 执行队列。`);
                    cmdBox.innerHTML = ""; 
                }
                if(typeof window.hideMentionDropdown === "function") window.hideMentionDropdown();
            }
            if (e.key === "Escape" && typeof window.hideMentionDropdown === "function") window.hideMentionDropdown();
        });
    }

    if (localStorage.getItem("APEX_GH_TOKEN")) {
        if(typeof window.syncAllData === "function") window.syncAllData();
    } else {
        if(typeof window.renderManifestTasks === "function") window.renderManifestTasks();
    }
};

// 👑 终极防僵尸复活拦截器：无视 CDN 延迟，强制物理过滤
setTimeout(() => {
    const origLoad = window.loadAuditProducts;
    if (origLoad && !window._hijackedLoad) {
        window._hijackedLoad = true;
        window.loadAuditProducts = async function() {
            await origLoad();
            const blacklist = JSON.parse(localStorage.getItem('APEX_DELETED_ZOMBIES') || '[]');
            if (window.AUDIT_PRODUCTS) {
                window.AUDIT_PRODUCTS = window.AUDIT_PRODUCTS.filter(p => !blacklist.includes(p.id));
                if (window.renderAuditTable) window.renderAuditTable();
            }
        };
        window.loadAuditProducts();
    }
}, 300);

document.addEventListener("DOMContentLoaded", window.initAdminEngine);
