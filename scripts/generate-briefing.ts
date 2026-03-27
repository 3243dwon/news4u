/**
 * generate-briefing.ts
 *
 * Reads today's raw data from /data/raw/YYYY-MM-DD.json,
 * sends it to Claude for Chinese summarisation, and writes
 * the structured briefing to /data/editions/YYYY-MM-DD.json.
 *
 * Usage:  npx tsx scripts/generate-briefing.ts
 * Env:    ANTHROPIC_API_KEY  (loaded from .env)
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────

const MODEL = "claude-sonnet-4-20250514";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ──────────────────────────────────────────────
// System prompt
// ──────────────────────────────────────────────

const SYSTEM_PROMPT = `你是「棱镜 · 每日简报」的资深金融编辑。你的任务是将原始市场数据、宏观指标和英文新闻，整合成一份面向中国投资者的中文每日简报。

## 输出格式

你必须输出一个严格的 JSON 对象，不要包含任何 markdown 代码块标记，不要包含任何额外文字。JSON 结构如下：

{
  "meta": {
    "date": "YYYY-MM-DD",
    "edition": "棱镜 · YYYY年M月D日",
    "greeting": "一句简短的早安问候语，可以结合当天市场氛围"
  },
  "overallSentiment": {
    "emoji": "天气emoji，如☀️/⛅/🌧️/⛈️",
    "phrase": "一句简短的整体市场情绪描述（10字以内），如「今日整体偏谨慎」「全球情绪偏暖」"
  },
  "todayHighlights": [
    {
      "id": 1,
      "emoji": "相关emoji",
      "title": "标题（15字以内）",
      "summary": "摘要（80-120字，需包含关键数据）"
    }
  ],
  "globalMarkets": [
    {
      "name": "指数中文名称",
      "code": "代码",
      "price": 数字,
      "change": 涨跌幅百分比数字（正数为涨，负数为跌）,
      "region": "cn|hk|us|uk|eu|jp|fx|commodity|crypto"
    }
  ],
  "macroPulse": [
    {
      "id": 1,
      "title": "标题（15字以内）",
      "summary": "摘要（60-100字）",
      "tag": "数据|通胀|央行|信贷|就业|贸易",
      "sentiment": "positive|negative|neutral"
    }
  ],
  "overseasPerspective": [
    {
      "id": 1,
      "source": "来源媒体中文名",
      "title": "标题（20字以内）",
      "summary": "摘要（80-120字）",
      "region": "国家/地区",
      "publishedAt": "原始新闻发布时间，ISO 8601格式，如2026-03-27T08:30:00Z"
    }
  ],
  "industryFocus": {
    "healthcare": {
      "title": "医疗健康",
      "icon": "💊",
      "highlights": [
        {
          "id": 1,
          "title": "标题（15字以内）",
          "summary": "摘要（60-100字）",
          "sentiment": "positive|negative|neutral",
          "publishedAt": "原始新闻发布时间，ISO 8601格式，如2026-03-27T08:30:00Z"
        }
      ]
    },
    "energy": {
      "title": "能源",
      "icon": "⚡",
      "highlights": [
        {
          "id": 1,
          "title": "标题（15字以内）",
          "summary": "摘要（60-100字）",
          "sentiment": "positive|negative|neutral",
          "publishedAt": "原始新闻发布时间，ISO 8601格式，如2026-03-27T08:30:00Z"
        }
      ]
    }
  },
  "premarketSignals": [
    {
      "id": 1,
      "category": "信号类别（如：北向资金、融资余额、隔夜中概、A50期货、关键事件）",
      "signal": "信号描述（30-60字）",
      "direction": "bullish|bearish|neutral"
    }
  ]
}

## 编辑原则

1. **今日要点**：挑选3条最影响中国投资者的重大事件。优先级：中国政策 > 美联储/央行 > 重大行业变动 > 地缘政治。
2. **全球市场速览**：直接使用原始行情数据，将 changePercent 转换为百分比（保留2位小数）。按区域分组。
3. **宏观脉搏**：基于 FRED 数据和新闻，提炼3-4条宏观要点。用具体数据支撑观点。
4. **海外视角**：从英文新闻中挑选3条最有价值的，翻译总结为中文，注明原始来源。优先选择来自 Reuters（路透社）、Bloomberg（彭博）、Financial Times（金融时报）、Goldman Sachs（高盛）、Morgan Stanley（摩根士丹利）、JPMorgan（摩根大通）的报道和研究。只有在以上来源没有相关新闻时，才使用其他来源。如果没有英文新闻，根据市场数据和宏观指标推断当日重要海外动态。
5. **行业聚焦**：医疗和能源各2条，结合新闻和行情数据。**只收录直接影响中国上市公司或其供应链的新闻（医疗健康和能源板块）。跳过与中国市场无关的公司或事件。** 如果符合条件的新闻不足，可根据中国相关行情走势撰写分析。
6. **盘前信号**：生成4-5条盘前观察信号，包括资金流向、期货走势、关键事件预告等。

## 注意事项

- 所有内容使用简体中文
- 数据准确性第一，不编造不存在的数据点
- 行情涨跌使用实际数值，不要修改原始数据
- sentiment 判断要基于数据对中国市场的实际影响
- 引号使用「」而非""
- 保持专业、简洁、信息密度高的写作风格
- overallSentiment 基于 premarketSignals 综合判断，用天气emoji表达（☀️乐观 / ⛅谨慎 / 🌧️悲观 / ⛈️恐慌）
- 海外视角和行业聚焦中的 publishedAt 字段必须保留原始新闻的发布时间（从输入数据中的 publishedAt 字段获取），使用 ISO 8601 格式。如果输入数据中没有时间信息，使用当天日期的 00:00:00Z`;

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  const date = today();
  console.log(`\n🤖 棱镜 briefing generation — ${date}\n`);

  // 1. Read raw data
  const rawPath = path.join(ROOT, "data", "raw", `${date}.json`);
  if (!fs.existsSync(rawPath)) {
    console.error(`✗ Raw data not found: ${rawPath}`);
    console.error(`  Run "npm run fetch-data" first.`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(rawPath, "utf-8");
  console.log(`📂 Read raw data from ${rawPath}`);

  // 2. Call Claude API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("✗ ANTHROPIC_API_KEY is not set in .env");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  console.log(`📡 Sending to ${MODEL} …`);
  const startTime = Date.now();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `以下是 ${date} 的原始市场数据，请生成今日棱镜简报：\n\n${rawData}`,
      },
    ],
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`   ✓ Response received in ${elapsed}s (${response.usage.input_tokens} in / ${response.usage.output_tokens} out)`);

  // 3. Extract and parse JSON
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    console.error("✗ No text content in Claude response");
    process.exit(1);
  }

  let jsonText = textBlock.text.trim();

  // Strip markdown code fences if present
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  let edition: Record<string, unknown>;
  try {
    edition = JSON.parse(jsonText);
  } catch (err) {
    console.error("✗ Failed to parse Claude response as JSON:");
    console.error((err as Error).message);
    console.error("\nRaw response:\n", jsonText.slice(0, 500));

    // Write raw response for debugging
    const debugPath = path.join(ROOT, "data", "editions", `${date}.debug.txt`);
    fs.writeFileSync(debugPath, textBlock.text, "utf-8");
    console.error(`  Debug output written to ${debugPath}`);
    process.exit(1);
  }

  // 4. Merge sparkline data from raw (bypass Claude)
  const rawParsed = JSON.parse(rawData) as {
    sparklines?: Array<{ symbol: string; closes: number[] }>;
  };
  if (rawParsed.sparklines) {
    const sparklineMap: Record<string, number[]> = {};
    for (const s of rawParsed.sparklines) {
      sparklineMap[s.symbol] = s.closes;
    }
    const globalMarkets = edition.globalMarkets as Array<Record<string, unknown>>;
    if (globalMarkets) {
      for (const m of globalMarkets) {
        const closes = sparklineMap[m.code as string];
        if (closes?.length) {
          m.sparkline = closes;
        }
      }
    }
    console.log(`📊 Merged sparkline data for ${Object.keys(sparklineMap).length} symbols`);
  }

  // 5. Write edition
  const outDir = path.join(ROOT, "data", "editions");
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `${date}.json`);
  fs.writeFileSync(outPath, JSON.stringify(edition, null, 2), "utf-8");

  console.log(`\n✅ Wrote ${outPath}`);

  // Quick summary
  const highlights = (edition.todayHighlights as Array<unknown>)?.length ?? 0;
  const markets = (edition.globalMarkets as Array<unknown>)?.length ?? 0;
  const macro = (edition.macroPulse as Array<unknown>)?.length ?? 0;
  const overseas = (edition.overseasPerspective as Array<unknown>)?.length ?? 0;
  const signals = (edition.premarketSignals as Array<unknown>)?.length ?? 0;
  console.log(`   ${highlights} highlights, ${markets} markets, ${macro} macro, ${overseas} overseas, ${signals} signals\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
