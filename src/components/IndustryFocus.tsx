import type { IndustryFocus as IndustryFocusType } from "@/types/edition";
import SectionCard from "./SectionCard";
import RelativeTime from "./RelativeTime";

const sentimentLabel: Record<string, { text: string; class: string }> = {
  positive: { text: "利好", class: "text-cn-red bg-red-50 dark:bg-red-950/40" },
  negative: { text: "利空", class: "text-cn-green bg-green-50 dark:bg-green-950/40" },
  neutral: { text: "中性", class: "text-muted bg-gray-100 dark:bg-gray-800" },
};

export default function IndustryFocus({ data }: { data: IndustryFocusType }) {
  const sectors = [data.healthcare, data.energy];

  return (
    <SectionCard title="行业聚焦" icon="🏭">
      <div className="space-y-5">
        {sectors.map((sector) => (
          <div key={sector.title}>
            <h3 className="font-semibold text-heading dark:text-gray-100 text-[15px] mb-3 flex items-center gap-1.5">
              <span>{sector.icon}</span>
              {sector.title}
            </h3>
            <div className="space-y-3">
              {sector.highlights.map((h) => {
                const badge = sentimentLabel[h.sentiment];
                return (
                  <div key={h.id} className="bg-cream/60 dark:bg-white/5 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-heading dark:text-gray-200 text-sm">
                        {h.title}
                      </h4>
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${badge.class}`}
                      >
                        {badge.text}
                      </span>
                    </div>
                    <p className="text-sm text-body dark:text-gray-300 leading-relaxed">
                      {h.summary}
                    </p>
                    {h.publishedAt && (
                      <div className="mt-2">
                        <RelativeTime iso={h.publishedAt} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
