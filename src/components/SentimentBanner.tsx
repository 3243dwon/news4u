import type { OverallSentiment } from "@/types/edition";

export default function SentimentBanner({
  sentiment,
}: {
  sentiment: OverallSentiment;
}) {
  return (
    <div className="bg-white/80 dark:bg-white/10 backdrop-blur rounded-full px-4 py-2 shadow-card inline-flex items-center gap-2">
      <span className="text-xl">{sentiment.emoji}</span>
      <span className="text-sm font-medium text-heading dark:text-gray-100">
        {sentiment.phrase}
      </span>
    </div>
  );
}
