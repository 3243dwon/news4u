import Link from "next/link";
import { searchEditions } from "@/lib/load-edition";
import { formatDateCN } from "@/lib/date-fmt";

export const dynamic = "force-dynamic";

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q ?? "";
  const results = query ? searchEditions(query) : [];

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1a1a1a]">
      <header className="px-5 pt-8 pb-4 sm:px-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-heading dark:text-gray-100 tracking-tight">
            🔍 搜索早报
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

        <form action="/archive/search" method="get" className="mt-4">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="搜索关键词，如「油价」「美联储」「医疗」…"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242424] text-heading dark:text-gray-100 text-sm placeholder:text-muted dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-accent/50"
          />
        </form>
      </header>

      <main className="px-4 sm:px-6 pb-10 max-w-lg mx-auto">
        {query && (
          <p className="text-xs text-muted dark:text-gray-500 mb-4">
            找到 {results.length} 条结果{results.length >= 50 ? "（显示前50条）" : ""}
          </p>
        )}

        {query && results.length === 0 && (
          <div className="bg-white dark:bg-[#242424] rounded-2xl shadow-card p-6 text-center">
            <p className="text-muted dark:text-gray-400 text-sm">
              未找到与「{query}」相关的内容
            </p>
          </div>
        )}

        <div className="space-y-3">
          {results.map((r, i) => (
            <Link
              key={`${r.date}-${r.section}-${i}`}
              href={`/archive/${r.date}`}
              className="block bg-white dark:bg-[#242424] rounded-2xl shadow-card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-1.5 text-xs">
                <span className="text-amber-accent font-medium">
                  {formatDateCN(r.date)}
                </span>
                <span className="text-muted dark:text-gray-500">·</span>
                <span className="text-muted dark:text-gray-500">{r.section}</span>
              </div>
              <h3 className="font-semibold text-heading dark:text-gray-100 text-sm mb-1">
                {r.title}
              </h3>
              <p className="text-xs text-body dark:text-gray-400 leading-relaxed line-clamp-2">
                {r.text}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
