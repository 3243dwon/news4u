import type { Highlight } from "@/types/edition";
import SectionCard from "./SectionCard";

export default function TodayHighlights({ items }: { items: Highlight[] }) {
  return (
    <SectionCard title="今日要点" icon="📌">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="border-l-[3px] border-amber-accent pl-4">
            <h3 className="font-semibold text-heading dark:text-gray-100 text-[15px] mb-1">
              <span className="mr-1.5">{item.emoji}</span>
              {item.title}
            </h3>
            <p className="text-sm text-body dark:text-gray-300 leading-relaxed">{item.summary}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
