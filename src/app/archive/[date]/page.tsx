import Link from "next/link";
import { notFound } from "next/navigation";
import { loadEditionByDate } from "@/lib/load-edition";
import { formatDateCN } from "@/lib/date-fmt";
import BriefingView from "@/components/BriefingView";

export const dynamic = "force-dynamic";

export default function ArchiveDatePage({
  params,
}: {
  params: { date: string };
}) {
  // Validate format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
    notFound();
  }

  const data = loadEditionByDate(params.date);
  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1a1a1a]">
      <header className="px-5 pt-8 pb-4 sm:px-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-heading dark:text-gray-100 tracking-tight">
            ☀️ 晨风早报
          </h1>
          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/archive"
              className="text-amber-accent hover:underline underline-offset-2"
            >
              往期
            </Link>
            <Link
              href="/"
              className="text-amber-accent hover:underline underline-offset-2"
            >
              返回今日 →
            </Link>
          </div>
        </div>
        <p className="text-sm font-medium text-heading dark:text-gray-100 mt-1">
          {formatDateCN(params.date)}
        </p>
        <p className="text-xs text-muted dark:text-gray-500 mt-0.5">{data.meta.edition}</p>
        <p className="text-sm text-body dark:text-gray-300 mt-2">{data.meta.greeting}</p>
      </header>

      <BriefingView data={data} />
    </div>
  );
}
