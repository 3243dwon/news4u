import type { PremarketSignal } from "@/types/edition";
import SectionCard from "./SectionCard";

const directionStyle: Record<string, { icon: string; class: string }> = {
  bullish: { icon: "☀️", class: "border-l-cn-red" },
  bearish: { icon: "🌧️", class: "border-l-cn-green" },
  neutral: { icon: "⛅", class: "border-l-gray-300" },
};

export default function PremarketSignals({ items }: { items: PremarketSignal[] }) {
  return (
    <SectionCard title="盘前信号" icon="🔔">
      <div className="space-y-3">
        {items.map((item) => {
          const style = directionStyle[item.direction];
          return (
            <div
              key={item.id}
              className={`border-l-[3px] ${style.class} pl-4 py-1`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm">{style.icon}</span>
                <span className="text-xs font-semibold text-heading dark:text-gray-100">
                  {item.category}
                </span>
              </div>
              <p className="text-sm text-body dark:text-gray-300 leading-relaxed">{item.signal}</p>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
