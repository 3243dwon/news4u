import type { MacroItem } from "@/types/edition";
import SectionCard from "./SectionCard";

const tagColors: Record<string, string> = {
  数据: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  通胀: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
  央行: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
  信贷: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
};

const sentimentDot: Record<string, string> = {
  positive: "bg-cn-red",
  negative: "bg-cn-green",
  neutral: "bg-muted",
};

export default function MacroPulse({ items }: { items: MacroItem[] }) {
  return (
    <SectionCard title="宏观脉搏" icon="📊">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="relative pl-4">
            <span
              className={`absolute left-0 top-[7px] w-2 h-2 rounded-full ${sentimentDot[item.sentiment]}`}
            />
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-heading dark:text-gray-100 text-[15px]">
                {item.title}
              </h3>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${tagColors[item.tag] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
              >
                {item.tag}
              </span>
            </div>
            <p className="text-sm text-body dark:text-gray-300 leading-relaxed">{item.summary}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
