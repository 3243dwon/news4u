import type { MarketItem } from "@/types/edition";
import SectionCard from "./SectionCard";
import Sparkline from "./Sparkline";

function formatPrice(price: number): string {
  if (price >= 10000) return price.toFixed(2);
  if (price >= 100) return price.toFixed(2);
  return price.toFixed(4);
}

function HeroCard({ item }: { item: MarketItem }) {
  const isUp = item.change > 0;
  const isDown = item.change < 0;
  const color = isUp ? "text-cn-red" : isDown ? "text-cn-green" : "text-muted";
  const bgColor = isUp
    ? "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border-cn-red/20"
    : isDown
      ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-cn-green/20"
      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
  const sign = isUp ? "+" : "";
  const arrow = isUp ? "▲" : isDown ? "▼" : "–";

  return (
    <div className={`rounded-2xl border ${bgColor} p-5 mb-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🇨🇳</span>
        <span className="text-base font-bold text-heading dark:text-gray-100">{item.name}</span>
        <span className="text-xs text-muted dark:text-gray-500">{item.code}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold text-heading dark:text-gray-100 tabular-nums">
            {formatPrice(item.price)}
          </span>
          <span className={`text-xl font-bold tabular-nums ml-3 ${color}`}>
            {arrow} {sign}{item.change.toFixed(2)}%
          </span>
        </div>
        {item.sparkline && item.sparkline.length >= 2 && (
          <Sparkline data={item.sparkline} width={80} height={32} />
        )}
      </div>
    </div>
  );
}

function MarketRow({ item }: { item: MarketItem }) {
  const isUp = item.change > 0;
  const isDown = item.change < 0;
  const color = isUp ? "text-cn-red" : isDown ? "text-cn-green" : "text-muted";
  const sign = isUp ? "+" : "";
  const arrow = isUp ? "▲" : isDown ? "▼" : "–";

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-heading dark:text-gray-200 truncate block">
          {item.name}
        </span>
      </div>
      <div className="text-right flex items-center gap-2">
        {item.sparkline && item.sparkline.length >= 2 && (
          <Sparkline data={item.sparkline} width={48} height={18} />
        )}
        <span className="text-base font-medium text-heading dark:text-gray-200 tabular-nums">
          {formatPrice(item.price)}
        </span>
        <span className={`text-base font-semibold tabular-nums min-w-[72px] text-right ${color}`}>
          {arrow} {sign}{item.change.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export default function GlobalMarkets({ items }: { items: MarketItem[] }) {
  const sseItem = items.find((i) => i.code === "000001.SS");
  const otherItems = items.filter((i) => i.code !== "000001.SS");

  const groups: Record<string, { label: string; items: MarketItem[] }> = {};
  const groupOrder = [
    { key: "cn", label: "🇨🇳 A股" },
    { key: "hk", label: "🇭🇰 港股" },
    { key: "us", label: "🇺🇸 美股" },
    { key: "jp", label: "🇯🇵 日股" },
    { key: "fx", label: "💱 外汇" },
    { key: "commodity", label: "🛢️ 大宗商品" },
    { key: "crypto", label: "₿ 加密货币" },
  ];

  for (const g of groupOrder) {
    const filtered = otherItems.filter((i) => i.region === g.key);
    if (filtered.length > 0) {
      groups[g.key] = { label: g.label, items: filtered };
    }
  }

  return (
    <SectionCard title="全球市场速览" icon="🌍">
      {sseItem && <HeroCard item={sseItem} />}
      <div className="space-y-3">
        {groupOrder.map((g) => {
          const group = groups[g.key];
          if (!group) return null;
          return (
            <div key={g.key}>
              <div className="text-xs font-medium text-muted dark:text-gray-500 mb-1 uppercase tracking-wide">
                {group.label}
              </div>
              <div>
                {group.items.map((item) => (
                  <MarketRow key={item.code} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 text-xs text-muted dark:text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-cn-red" />
          涨
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-cn-green" />
          跌
        </span>
      </div>
    </SectionCard>
  );
}
