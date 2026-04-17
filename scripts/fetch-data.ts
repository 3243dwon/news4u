/**
 * fetch-data.ts
 *
 * Fetches market quotes (Yahoo Finance), macro indicators (FRED),
 * and financial news (NewsAPI), then writes everything to
 * /data/raw/YYYY-MM-DD.json.
 *
 * Usage:  npx tsx scripts/fetch-data.ts
 * Env:    FRED_API_KEY, NEWS_API_KEY  (loaded from .env)
 */

import "dotenv/config";
import YahooFinance from "yahoo-finance2";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey", "ripHistorical"] });

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────

const MARKET_SYMBOLS = [
  { symbol: "^GSPC", label: "标普500", region: "us" },
  { symbol: "^IXIC", label: "纳斯达克", region: "us" },
  { symbol: "^DJI", label: "道琼斯", region: "us" },
  { symbol: "^FTSE", label: "富时100", region: "uk" },
  { symbol: "^GDAXI", label: "德国DAX", region: "eu" },
  { symbol: "^N225", label: "日经225", region: "jp" },
  { symbol: "000001.SS", label: "上证指数", region: "cn" },
  { symbol: "000300.SS", label: "沪深300", region: "cn" },
  { symbol: "^HSI", label: "恒生指数", region: "hk" },
  { symbol: "BZ=F", label: "布伦特原油", region: "commodity" },
  { symbol: "GC=F", label: "COMEX黄金", region: "commodity" },
  { symbol: "CNY=X", label: "美元/人民币", region: "fx" },
];

const FRED_SERIES = [
  { id: "FEDFUNDS", label: "联邦基金利率" },
  { id: "CPIAUCSL", label: "CPI (美国)" },
  { id: "UNRATE", label: "失业率 (美国)" },
];

const NEWS_QUERIES = [
  "China stocks",
  "healthcare sector",
  "energy sector",
  "Federal Reserve",
  "global markets",
];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function envRequired(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.warn(`⚠  ${key} is not set – skipping that data source.`);
    return "";
  }
  return val;
}

// ──────────────────────────────────────────────
// 1. Yahoo Finance – market quotes
// ──────────────────────────────────────────────

interface MarketQuote {
  symbol: string;
  label: string;
  region: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
  marketState: string | null;
  fetchedAt: string;
}

async function fetchMarkets(): Promise<MarketQuote[]> {
  console.log("📈 Fetching market data from Yahoo Finance (via chart API) …");
  const results: MarketQuote[] = [];

  for (const { symbol, label, region } of MARKET_SYMBOLS) {
    try {
      // Use chart() instead of quote() — more reliable from datacenter IPs
      const twoDaysAgo = new Date(Date.now() - 3 * 86_400_000);
      const chart = await yf.chart(symbol, { period1: twoDaysAgo, interval: "1d" });
      const meta = chart.meta;
      const lastQuote = chart.quotes?.[chart.quotes.length - 1];

      const price = meta.regularMarketPrice ?? lastQuote?.close ?? null;
      const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? null;
      const change = price != null && prevClose != null ? price - prevClose : null;
      const changePercent = change != null && prevClose ? (change / prevClose) * 100 : null;

      results.push({
        symbol,
        label,
        region,
        price,
        change: change != null ? Math.round(change * 100) / 100 : null,
        changePercent: changePercent != null ? Math.round(changePercent * 100) / 100 : null,
        currency: meta.currency ?? null,
        marketState: meta.marketState ?? null,
        fetchedAt: new Date().toISOString(),
      });
      console.log(`   ✓ ${symbol} (${label}): ${price}`);
    } catch (err) {
      console.error(`   ✗ ${symbol}: ${(err as Error).message}`);
      results.push({
        symbol,
        label,
        region,
        price: null,
        change: null,
        changePercent: null,
        currency: null,
        marketState: null,
        fetchedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

// ──────────────────────────────────────────────
// 1b. Yahoo Finance – 7-day sparkline history
// ──────────────────────────────────────────────

interface SparklineData {
  symbol: string;
  closes: number[];
}

async function fetchSparklines(): Promise<SparklineData[]> {
  console.log("📊 Fetching 7-day sparkline data …");
  const results: SparklineData[] = [];
  const end = new Date();
  const start = new Date(end.getTime() - 10 * 86_400_000); // 10 days back to ensure 7 trading days

  for (const { symbol } of MARKET_SYMBOLS) {
    try {
      const chart = await yf.chart(symbol, {
        period1: start,
        period2: end,
        interval: "1d",
      });
      const closes = (chart.quotes ?? [])
        .filter((q: { close?: number | null }) => q.close != null)
        .slice(-7)
        .map((q: { close: number }) => q.close);
      results.push({ symbol, closes });
      console.log(`   ✓ ${symbol}: ${closes.length} data points`);
    } catch (err) {
      console.error(`   ✗ ${symbol}: ${(err as Error).message}`);
      results.push({ symbol, closes: [] });
    }
  }

  return results;
}

// ──────────────────────────────────────────────
// 2. FRED – macro indicators
// ──────────────────────────────────────────────

interface FredObservation {
  date: string;
  value: string;
}

interface MacroIndicator {
  seriesId: string;
  label: string;
  latestDate: string | null;
  latestValue: number | null;
  unit: string;
  fetchedAt: string;
}

async function fetchFred(): Promise<MacroIndicator[]> {
  const apiKey = envRequired("FRED_API_KEY");
  if (!apiKey) return [];

  console.log("🏦 Fetching macro data from FRED …");
  const results: MacroIndicator[] = [];

  for (const { id, label } of FRED_SERIES) {
    try {
      const url =
        `https://api.stlouisfed.org/fred/series/observations?` +
        `series_id=${id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = (await res.json()) as { observations: FredObservation[] };
      const obs = json.observations[0];

      results.push({
        seriesId: id,
        label,
        latestDate: obs?.date ?? null,
        latestValue: obs ? parseFloat(obs.value) : null,
        unit: id === "CPIAUCSL" ? "index" : "percent",
        fetchedAt: new Date().toISOString(),
      });
      console.log(`   ✓ ${id} (${label}): ${obs?.value}`);
    } catch (err) {
      console.error(`   ✗ ${id}: ${(err as Error).message}`);
      results.push({
        seriesId: id,
        label,
        latestDate: null,
        latestValue: null,
        unit: "",
        fetchedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

// ──────────────────────────────────────────────
// 3. NewsAPI – financial headlines
// ──────────────────────────────────────────────

interface NewsArticle {
  query: string;
  title: string;
  description: string | null;
  source: string;
  url: string;
  publishedAt: string;
}

async function fetchNews(): Promise<NewsArticle[]> {
  const apiKey = envRequired("NEWS_API_KEY");
  if (!apiKey) return [];

  console.log("📰 Fetching news from NewsAPI …");
  const articles: NewsArticle[] = [];

  for (const q of NEWS_QUERIES) {
    try {
      const params = new URLSearchParams({
        q,
        language: "en",
        sortBy: "publishedAt",
        pageSize: "5",
        apiKey,
      });

      const res = await fetch(`https://newsapi.org/v2/everything?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = (await res.json()) as {
        articles: Array<{
          title: string;
          description: string | null;
          source: { name: string };
          url: string;
          publishedAt: string;
        }>;
      };

      for (const a of json.articles) {
        articles.push({
          query: q,
          title: a.title,
          description: a.description,
          source: a.source.name,
          url: a.url,
          publishedAt: a.publishedAt,
        });
      }
      console.log(`   ✓ "${q}": ${json.articles.length} articles`);
    } catch (err) {
      console.error(`   ✗ "${q}": ${(err as Error).message}`);
    }
  }

  return articles;
}

// ──────────────────────────────────────────────
// 4. Sina Finance – China-specific news (RSS)
// ──────────────────────────────────────────────

interface SinaArticle {
  query: string;
  title: string;
  description: string | null;
  source: string;
  url: string;
  publishedAt: string;
}

async function fetchSinaFinance(): Promise<SinaArticle[]> {
  console.log("🇨🇳 Fetching China news from Sina Finance …");
  const articles: SinaArticle[] = [];

  // Sina Finance RSS feeds for major categories
  const feeds = [
    { url: "https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&k=&num=10&page=1&r=0.1&callback=", label: "财经要闻" },
    { url: "https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2517&k=&num=10&page=1&r=0.1&callback=", label: "股市动态" },
  ];

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      // Sina returns JSONP-like or plain JSON
      const jsonStr = text.replace(/^[^{[]*/, "").replace(/[^}\]]*$/, "");
      const json = JSON.parse(jsonStr) as {
        result?: { data?: Array<{
          title?: string;
          intro?: string;
          url?: string;
          ctime?: string;
          media_name?: string;
        }> };
      };

      const items = json.result?.data ?? [];
      for (const item of items.slice(0, 5)) {
        if (item.title) {
          articles.push({
            query: feed.label,
            title: item.title,
            description: item.intro ?? null,
            source: item.media_name ?? "新浪财经",
            url: item.url ?? "",
            publishedAt: item.ctime
              ? new Date(parseInt(item.ctime) * 1000).toISOString()
              : new Date().toISOString(),
          });
        }
      }
      console.log(`   ✓ "${feed.label}": ${Math.min(items.length, 5)} articles`);
    } catch (err) {
      console.warn(`   ✗ "${feed.label}": ${(err as Error).message} (skipping)`);
    }
  }

  return articles;
}

// ──────────────────────────────────────────────
// Main – fetch all & write to disk (with error recovery)
// ──────────────────────────────────────────────

async function main() {
  const date = today();
  console.log(`\n🌅 棱镜 data fetch — ${date}\n`);

  // Run all fetches with individual error recovery
  const results = await Promise.allSettled([
    fetchMarkets(),
    fetchSparklines(),
    fetchFred(),
    fetchNews(),
    fetchSinaFinance(),
  ]);

  const markets = results[0].status === "fulfilled" ? results[0].value : [];
  const sparklines = results[1].status === "fulfilled" ? results[1].value : [];
  const macro = results[2].status === "fulfilled" ? results[2].value : [];
  const news = results[3].status === "fulfilled" ? results[3].value : [];
  const chinaNews = results[4].status === "fulfilled" ? results[4].value : [];

  // Log any fully-failed sources
  const labels = ["Markets", "Sparklines", "FRED", "NewsAPI", "Sina"];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`⚠ ${labels[i]} source completely failed: ${r.reason}`);
    }
  });

  // Require at least markets OR news to proceed
  const hasMarkets = markets.some((m) => m.price !== null);
  const hasAnyNews = news.length > 0 || chinaNews.length > 0;

  if (!hasMarkets && !hasAnyNews) {
    console.error("✗ All data sources failed — cannot generate briefing.");
    process.exit(1);
  }

  if (!hasMarkets) console.warn("⚠ No market data available — proceeding with news only.");
  if (!hasAnyNews) console.warn("⚠ No news available — proceeding with market data only.");

  const output = {
    date,
    fetchedAt: new Date().toISOString(),
    markets,
    sparklines,
    macro,
    news,
    chinaNews,
  };

  const outDir = path.resolve(__dirname, "..", "data", "raw");
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `${date}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");

  console.log(`\n✅ Wrote ${outPath}`);
  console.log(
    `   ${markets.length} market quotes, ${macro.length} macro indicators, ${news.length} intl news, ${chinaNews.length} china news\n`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
