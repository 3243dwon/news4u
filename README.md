# 🔷 棱镜 · 每日简报

面向中国投资者的每日市场简报，自动采集全球行情、宏观数据和财经新闻，通过 Claude AI 生成中文摘要。

## 功能

- **今日要点** — 每日 3 条最重要的市场事件
- **全球市场速览** — A股、港股、美股、日股、外汇、大宗商品实时行情 + 7日趋势线
- **宏观脉搏** — FRED 宏观指标 + 政策解读
- **海外视角** — 英文财经新闻中文翻译摘要（优先路透、彭博、金融时报等权威来源）
- **行业聚焦** — 医疗健康 & 能源板块动态（聚焦中国相关）
- **盘前信号** — 资金流向、期货走势、事件预告
- **整体情绪** — 基于盘前信号的天气式情绪指标
- **往期搜索** — 全文检索历史简报

红涨绿跌，符合中国市场惯例。支持深色模式。

## 技术栈

- **前端**：Next.js 14 (App Router) + Tailwind CSS + TypeScript
- **数据源**：Yahoo Finance · FRED API · NewsAPI
- **AI 摘要**：Claude API (claude-sonnet-4-20250514)
- **自动化**：GitHub Actions 每日 05:30 UTC 自动生成
- **部署**：Vercel
- **PWA**：支持添加到手机主屏幕，离线缓存最新一期

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API 密钥

# 本地开发（使用示例数据）
npm run dev

# 生成今日简报（需要 API 密钥）
npm run generate

# 构建
npm run build
```

## 环境变量

| 变量 | 用途 | 获取地址 |
|------|------|----------|
| `FRED_API_KEY` | 美联储经济数据 | https://fred.stlouisfed.org/docs/api/api_key.html |
| `NEWS_API_KEY` | 英文财经新闻 | https://newsapi.org/register |
| `ANTHROPIC_API_KEY` | Claude AI 摘要生成 | https://console.anthropic.com/settings/keys |

## npm 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run fetch-data` | 抓取原始市场数据 → `data/raw/` |
| `npm run generate-briefing` | 原始数据 → Claude 摘要 → `data/editions/` |
| `npm run generate` | 依次执行 fetch-data + generate-briefing |

## 项目结构

```
├── data/
│   ├── editions/          # 生成的每日简报 JSON（提交到 git）
│   └── raw/               # 原始抓取数据（不提交）
├── scripts/
│   ├── fetch-data.ts      # 数据采集脚本
│   └── generate-briefing.ts  # Claude 摘要生成脚本
├── src/
│   ├── app/               # Next.js 页面
│   │   ├── page.tsx       # 首页（最新一期）
│   │   └── archive/       # 往期归档 + 搜索
│   ├── components/        # UI 组件
│   ├── data/mock/         # 示例数据（无 API 密钥时使用）
│   ├── lib/               # 数据加载工具
│   └── types/             # TypeScript 类型定义
├── public/                # PWA 图标、manifest、Service Worker
└── .github/workflows/     # GitHub Actions 每日自动生成
```

## 部署

1. 将仓库推送到 GitHub
2. 在 Vercel 导入项目，框架选择 Next.js
3. 在 GitHub 仓库 Settings → Secrets 中添加三个 API 密钥
4. GitHub Actions 每日自动生成简报并推送，Vercel 自动重新部署
