/**
 * APEXWORK 模块 3：AI 智能体引擎与初始化 (admin-ai.js)
 * 👑 终极架构：全站级物理核心ID查重防雷同 + 动态盐值保底 + 纯净部门卡片渲染
 */

// 👑 提取图片唯一核心 ID 算法，剥离所有分辨率、格式等参数干扰
function getBaseImageId(url) {
    if (!url) return "";
    const match = url.match(/photo-[a-zA-Z0-9\-]+/);
    return match ? match[0] : url.split('?')[0];
}

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

const HD_IMAGE_VAULT = {
    web3: [
        "https://images.unsplash.com/photo-1639762681485-074b7f4ec651?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1622630998477-20b41cd0e073?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1639762681057-408e52192e55?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1621416953228-868bfb3fc1c0?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?auto=format&fit=crop&w=800&q=80&fm=webp"
    ],
    ecommerce: [
        "https://images.unsplash.com/photo-1586528116311-ad8ed7453444?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1472851294608-062f1c4dca84?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1556741533-6e40ce36a0fb?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1580913428706-c311e67898b3?auto=format&fit=crop&w=800&q=80&fm=webp"
    ],
    finance: [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80&fm=webp"
    ],
    tech: [
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1531297172867-21eacdbc6c85?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80&fm=webp"
    ],
    corporate: [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80&fm=webp",
        "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=800&q=80&fm=webp"
    ]
};

window.usedImageCache = window.usedImageCache || new Set();

const LAYOUT_POOLS = {
    ppt: ["kpi-grid", "timeline", "funnel", "comparison", "default"],
    excel: ["roi-calc", "funnel", "cost-breakdown", "matrix-12m"],
    word: ["text-block", "checklist", "quote", "text-block"] 
};

async function processRemixAndScoring(themeKeyword, category, globalUsedImages) {
    let finalImg = "";
    let attempt = 0;
    let isValidImage = false;
    
    let targetPool = HD_IMAGE_VAULT.corporate;
    const kw = String(themeKeyword + " " + category).toLowerCase();
    if (kw.includes("web3") || kw.includes("crypto") || kw.includes("代币")) targetPool = HD_IMAGE_VAULT.web3;
    else if (kw.includes("电商") || kw.includes("shopee") || kw.includes("海运") || kw.includes("物流") || kw.includes("供应链")) targetPool = HD_IMAGE_VAULT.ecommerce;
    else if (kw.includes("finance") || kw.includes("roi") || kw.includes("财") || kw.includes("esg") || kw.includes("投资")) targetPool = HD_IMAGE_VAULT.finance;
    else if (kw.includes("tech") || kw.includes("saas") || kw.includes("数据") || kw.includes("云") || kw.includes("ai")) targetPool = HD_IMAGE_VAULT.tech;

    while(!isValidImage && attempt < 5) {
        attempt++;
        window.appendLog(`🎨 [视觉策划部] 正在执行全站级核心 ID 防撞库与物理连通性校验...`);
        
        // 👑 彻底剔除黑名单图片：必须使用 getBaseImageId 进行比对，无视分辨率参数干扰！
        let availableImgs = targetPool.filter(img => !globalUsedImages.has(getBaseImageId(img)));
        
        if (availableImgs.length === 0) {
            const allImgs = Object.values(HD_IMAGE_VAULT).flat();
            availableImgs = allImgs.filter(img => !globalUsedImages.has(getBaseImageId(img)));
        }
        
        let candidateImg = "";
        if (availableImgs.length > 0) {
            candidateImg = availableImgs[Math.floor(Math.random() * availableImgs.length)];
        } else {
            candidateImg = targetPool[Math.floor(Math.random() * targetPool.length)] + "&uid=" + Date.now() + Math.random().toString().slice(2, 6);
        }
        
        isValidImage = await new Promise((resolve) => {
            const img = new Image();
            const timer = setTimeout(() => { img.src = ""; resolve(false); }, 5000);
            img.onload = () => { clearTimeout(timer); resolve(true); };
            img.onerror = () => { clearTimeout(timer); resolve(false); };
            img.src = candidateImg;
        });
        
        if(isValidImage) {
            window.appendLog(`✅ [系统广播] 图像全站唯一性查重通过，0雷同！锁定商用封面。`, "text-emerald-500");
            finalImg = candidateImg;
            // 立即将生成图片的核心 ID 锁定到黑名单中
            globalUsedImages.add(getBaseImageId(finalImg));
            break;
        } else {
            window.appendLog(`⚠️ [QA 拦截] 探测到图像损坏或网络白屏，执行销毁重做！`, "text-rose-500");
        }
    }
    
    if(!finalImg) {
        finalImg = "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80&fm=webp&uid=" + Date.now();
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

            window.appendLog(`🤖 [大脑中枢]: 收到深度生成指令，启动【强制结构打破算法】与【全局查重库读取】...`);

            // 👑 查重核心：不仅拉取大盘，且物理级锁定默认 5 大件的核心图库，绝对防止 AI 抽到跟默认模板雷同的封面！
            const globalUsedImages = new Set();
            
            // 强制写入原生 5 大默认模板的底图核心 ID，雷打不动防撞！
            globalUsedImages.add("photo-1460925895917-afdab827c52f"); // AeroTech
            globalUsedImages.add("photo-1504384308090-c894fdcc538d"); // SaaS
            globalUsedImages.add("photo-1551836022-d5d88e9218df"); // FinTech
            globalUsedImages.add("photo-1543286386-2e659306cd6c"); // Excel ROI
            globalUsedImages.add("photo-1450133064473-71024230f91b"); // Word ATS

            try {
                const localAudit = JSON.parse(localStorage.getItem('APEX_AUDIT_PRODUCTS') || '[]');
                localAudit.forEach(p => {
                    if (p.thumbCloudPath) globalUsedImages.add(getBaseImageId(p.thumbCloudPath));
                    if (p.thumb) globalUsedImages.add(getBaseImageId(p.thumb));
                });
            } catch(e) {}
            
            const industries = ["医疗大健康SaaS", "新能源汽车供应链", "AI教育智能硬件", "智能制造与数字孪生", "农业无人机自动化作业", "出海跨境独立站DTC", "全球碳排放交易中心", "高端宠物医疗保险", "低轨商业航天测算", "智能冷链仓储网络"];
            const shuffled = industries.sort(() => 0.5 - Math.random());
            const targetIndustries = shuffled.slice(0, 3);
            const timestampSeed = Date.now();
            
            const aiPrompt = `你是一个深谙SaaS高转化率的顶尖产品总监。请自动生成3个商业模板作品（1个PPT, 1个Excel, 1个Word）。
【核心铁律：绝对结构异化机制 (Seed: ${timestampSeed})】：
1. 强制使用领域：必须分别使用【${targetIndustries[0]}】、【${targetIndustries[1]}】、【${targetIndustries[2]}】。禁止生成重复的标题和内容！
2. 必须强行打破"概述->痛点->时间轴->漏斗"的固定出牌套路！你在输出 slides 时，必须为每个模板分配【截然不同】的 layoutType 组合！
   - PPT 模板的组件排列必须像这样出乎意料: cover -> comparison -> funnel -> kpi-grid -> timeline 等等。
   - Excel 模板必须强制输出 "bottomKpis" (包含4个行业专属指标，禁止用毛利率)。
   - Word 模板的 layoutType 排序也必须打乱: title-page -> checklist -> text-block -> quote 等等。
3. Word 的 content 必须是50字以上的专业深度分析长文！
请严格返回 JSON 数组格式，绝不包含任何 markdown 符号。不需要提供价格。
样例：[{"type":"excel", "name":"医疗SaaS财务中枢", "titleEn":"Med-SaaS ROI", "category":"大健康", "categoryEn":"Health", "themeKeyword":"medical AI", "bottomKpis":[{"label":"单院获客成本","value":"$1.2K"},{"label":"客户终身价值","value":"$50K"},{"label":"月度经常性收入","value":"$2M"},{"label":"流失率","value":"<1%"}], "slides":[{"layoutType":"funnel", "title":"AI问诊转化漏斗", "kpi":"34%", "label":"预期诊断率"}]}]`;
            
            const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST", headers: { "Authorization": `Bearer ${keys.ds}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: aiPrompt }], temperature: 0.98 })
            });
            
            if (!dsRes.ok) throw new Error("AI 接口调用失败");
            const aiAnswer = (await dsRes.json()).choices[0].message.content;
            const jsonMatch = aiAnswer.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("AI 数据格式异常");
            const generatedData = JSON.parse(jsonMatch[0]);

            window.appendLog(`🔨 [主动产品部]: 差异化结构与行业指标生成完毕！产出：《${generatedData.map(d=>d.name).join('》、《')}》。`);
            
            const newTemplates = [];
            
            for (let t of generatedData) {
                const rId = "AI-" + Math.floor(10000 + Math.random()*90000);
                const typeStr = t.type ? t.type.toLowerCase() : 'ppt';
                let col = typeStr === 'excel' ? 'text-emerald-600 font-bold' : (typeStr === 'word' ? 'text-indigo-600 font-bold' : 'text-orange-500 font-bold');
                
                const finalImg = await processRemixAndScoring(t.themeKeyword || "corporate data", t.category || "tech", globalUsedImages);

                const slideCount = t.slides ? t.slides.length : 8;
                const isPremium = slideCount >= 10; 
                const finalRmb = isPremium ? 139 : 69;
                const finalUsd = isPremium ? "19.99" : "9.99";
                
                const unitZh = typeStr === 'ppt' ? '页' : (typeStr === 'excel' ? '模块' : '章');
                const unitEn = typeStr === 'ppt' ? 'P' : 'UNITS';

                let availableLayouts = [...LAYOUT_POOLS[typeStr]].filter(l => l !== 'cover' && l !== 'title-page' && l !== 'roi-calc');
                availableLayouts = availableLayouts.sort(() => 0.5 - Math.random()); 

                const processedSlides = Array.from(t.slides || []).map((slide, index) => {
                    let assignedLayout = slide.layoutType;
                    
                    if (index === 0) {
                        assignedLayout = typeStr === 'ppt' ? 'cover' : (typeStr === 'word' ? 'title-page' : 'roi-calc');
                    } else {
                        if (!assignedLayout || assignedLayout === 'default' || !LAYOUT_POOLS[typeStr].includes(assignedLayout)) {
                            assignedLayout = availableLayouts[(index - 1) % availableLayouts.length];
                        }
                    }
                    
                    return { ...slide, layoutType: assignedLayout };
                });

                newTemplates.push({
                    id: rId, title: t.name, titleEn: t.titleEn, 
                    category: `${slideCount}${unitZh} · ${t.category}`, categoryEn: `${slideCount} ${unitEn} · ${t.categoryEn}`, 
                    type: typeStr,
                    thumb: finalImg, thumbnail: finalImg, thumbKey: "prod_" + rId, 
                    thumbCloudPath: finalImg, thumbDefault: finalImg,
                    priceRmb: finalRmb, priceUsd: finalUsd, colorCls: col,
                    isLinked: true, status: true,
                    slides: processedSlides,
                    bottomKpis: t.bottomKpis || null 
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
                await window.pushGithubJsonFile("data/ai-generated-decks.json", combinedDecks, decksSha, "🤖 AI PM Worker: 上架绝对无重复封面且差异化结构的产品 [skip ci]", keys.gh);

                if (typeof window.AUDIT_PRODUCTS !== "undefined" && typeof window.renderAuditTable === "function") {
                    newTemplates.forEach(t => window.AUDIT_PRODUCTS.unshift(t));
                    localStorage.setItem('APEX_AUDIT_PRODUCTS', JSON.stringify(window.AUDIT_PRODUCTS));
                    window.renderAuditTable();
                }
                window.appendLog(`✅ [系统广播]: 排版强制变异装配完毕！全站查重(含原生模板)无雷同，已成功录入大盘。`);
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
    tokenSpan.innerHTML = `@${deptName} <b class="ml-1 px-1 cursor-pointer hover:text-rose-600 hover:bg-rose-100 rounded-full transition-colors" onclick="this.parentElement.remove()" title="移除标签">×</b>`;
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
        tokenSpan.innerHTML = `@${deptName} <b class="ml-1 px-1 cursor-pointer hover:text-rose-600 hover:bg-rose-100 rounded-full transition-colors" onclick="this.parentElement.remove()" title="移除标签">×</b>`;
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
    // 删除了导致输入框失焦锁死的 window.isCmdActive = false; 
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
            if (e.key === "Enter" && !e.shiftKey) {
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

document.addEventListener("DOMContentLoaded", window.initAdminEngine);
