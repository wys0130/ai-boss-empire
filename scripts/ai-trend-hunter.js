/**
 * APEXWORK 24/7 商业趋势捕手与非重复模板自研引擎
 * 职责：公开热点采集 -> AI 商务套件研发 -> 自动去重自检 -> 上架销售
 */

const fs = require("fs");
const path = require("path");

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "";
const DB_PATH = path.join(__dirname, "../data/ai-generated-decks.json");

// 1. 公开合法开放热点采集（例如：抓取 Hacker News 前期热门科技创投话题）
async function fetchPublicBusinessTrend() {
    try {
        console.log("🌐 [趋势捕手]: 正在读取公开合规热点趋势 (HackerNews Public API)...");
        const res = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
        const ids = await res.json();
        const topId = ids[Math.floor(Math.random() * 5)]; // 取前 5 个最火的创投新闻之一
        const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${topId}.json`);
        const item = await itemRes.json();
        return item.title || "AI Autonomous Agent Commerce & Global SaaS Monetization";
    } catch (err) {
        console.warn("⚠️ 外部网络波动，采用默认趋势主题...");
        return "Global FinTech Cross-Border Settlement & Crypto Treasury 2026";
    }
}

// 2. 调度 LLM 研发不重复的商务模板
async function generateUniqueTemplate(trendTitle, existingNames) {
    if (!DEEPSEEK_KEY) {
        console.log("❌ [系统报警]: 未检测到 DEEPSEEK_API_KEY，终止自主研发。");
        return null;
    }

    console.log(`🧠 [AI 产品部]: 锁定商业热词 -> "${trendTitle}"，正在设计无重复高阶套件...`);

    const prompt = `你是 APEXWORK 全球商业产品研发中心。
已知我们当前的已有库存模板名称清单：[${existingNames.join(", ")}]。

请你结合最新热门商业趋势："${trendTitle}"，自主设计一款【绝对不与旧有库存雷同、且视觉版式与行业不同的 5 页精炼商务演示路演模板】。
严守标准：
1. 语言必须精炼，一句话讲透，禁止段落废话。
2. 背景必须采用 Edge-Native 实景 WebP（提供 high-tech, finance, startup, minimal 之中的独特选项）。
3. 只能以标准 JSON 格式输出，不要包含 Markdown 额外解释说明。

JSON 标准输出结构示例：
{
  "key": "unique_slug_key",
  "brand": "BrandName",
  "titleName": "核心商务路演标语",
  "badge": "5 SLIDES · TREND 2026",
  "total": 5,
  "defaultBg": "finance",
  "slides": [
    { "id": 1, "title": "首屏痛点与大标语", "sub": "副标题阐释", "kpi": "+280%", "label": "核心指数", "progress": 90, "tag": "01. COVER" }
  ]
}`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${DEEPSEEK_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: "你只输出合法的 JSON 商业资产内容。" },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        })
    });

    const data = await response.json();
    const rawText = data.choices[0].message.content.trim();
    const cleanJson = rawText.replace(/^```json\n?/i, "").replace(/\n?```$/i, "");
    return JSON.parse(cleanJson);
}

// 3. 执行自建与商品库挂载
async function main() {
    let storeData = { decks: {} };
    if (fs.existsSync(DB_PATH)) {
        storeData = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    }

    const existingNames = Object.values(storeData.decks).map(d => d.titleName || "");
    const trend = await fetchPublicBusinessTrend();
    const newDeck = await generateUniqueTemplate(trend, existingNames);

    if (!newDeck || !newDeck.key) {
        console.log("⚠️ 本轮未生成有效套件，保持原有库存状态。");
        return;
    }

    // 防重冲突检测
    if (storeData.decks[newDeck.key] || existingNames.includes(newDeck.titleName)) {
        console.log(`🛡️ [质检拦截]: 发现命名或关键词重合 (${newDeck.titleName})，本轮作废重新调适。`);
        return;
    }

    // 落地保存至系统货架
    storeData.decks[newDeck.key] = newDeck;
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(storeData, null, 2), "utf8");

    console.log(`✅ [新套件已自动发布]: 成功根据热点创作上架 -> [${newDeck.titleName}] ($9.99 商用价)`);
}

main().catch(e => console.error("趋势采集与自主开发进程错误:", e));
