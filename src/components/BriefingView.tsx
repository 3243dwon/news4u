import type { Edition } from "@/types/edition";
import FadeIn from "./FadeIn";
import SentimentBanner from "./SentimentBanner";
import TodayHighlights from "./TodayHighlights";
import GlobalMarkets from "./GlobalMarkets";
import MacroPulse from "./MacroPulse";
import OverseasPerspective from "./OverseasPerspective";
import IndustryFocus from "./IndustryFocus";
import PremarketSignals from "./PremarketSignals";

export default function BriefingView({ data }: { data: Edition }) {
  return (
    <>
      <main className="px-4 sm:px-6 pb-8 max-w-lg mx-auto space-y-7">
        {data.overallSentiment && (
          <div className="flex justify-center">
            <SentimentBanner sentiment={data.overallSentiment} />
          </div>
        )}
        <FadeIn><TodayHighlights items={data.todayHighlights} /></FadeIn>
        <FadeIn><GlobalMarkets items={data.globalMarkets} /></FadeIn>
        <FadeIn><MacroPulse items={data.macroPulse} /></FadeIn>
        <FadeIn><OverseasPerspective items={data.overseasPerspective} /></FadeIn>
        <FadeIn><IndustryFocus data={data.industryFocus} /></FadeIn>
        <FadeIn><PremarketSignals items={data.premarketSignals} /></FadeIn>
      </main>

      <footer className="px-5 pb-10 pt-2 max-w-lg mx-auto">
        <p className="text-xs text-muted dark:text-gray-500 text-center">
          以上内容仅供参考，不构成投资建议
        </p>
      </footer>
    </>
  );
}
