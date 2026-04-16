import Link from "next/link";
import { listEditions, loadEditionByDate, countEditions } from "@/lib/load-edition";
import { formatDateCN } from "@/lib/date-fmt";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default function ArchivePage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const total = countEditions();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const offset = (currentPage - 1) * PAGE_SIZE;
  const dates = listEditions(PAGE_SIZE, offset);

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1a1a1a]">
      <header className="px-5 pt-8 pb-4 sm:px-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-heading dark:text-gray-100 tracking-tight">
            📚 往期早报
          </h1>
          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/archive/search"
              className="text-amber-accent hover:underline underline-offset-2"
            >
              🔍 搜索
            </Link>
            <Link
              href="/"
              className="text-amber-accent hover:underline underline-offset-2"
            >
              ← 返回今日
            </Link>
          </div>
        </div>
        <p className="text-sm text-muted dark:text-gray-400 mt-1">
          共 {total} 期{totalPages > 1 ? ` · 第 ${currentPage}/${totalPages} 页` : ""}
        </p>
      </header>

      <main className="px-4 sm:px-6 pb-10 max-w-lg mx-auto">
        {dates.length === 0 ? (
          <div className="bg-white dark:bg-[#242424] rounded-2xl shadow-card p-6 text-center">
            <p className="text-muted dark:text-gray-400 text-sm">暂无往期数据</p>
            <p className="text-muted dark:text-gray-500 text-xs mt-1">
              运行 <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">npm run generate</code> 生成第一期
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {dates.map((date) => {
                const edition = loadEditionByDate(date);
                const preview =
                  edition?.todayHighlights?.[0]?.title ?? "—";
                const emoji =
                  edition?.todayHighlights?.[0]?.emoji ?? "📰";

                return (
                  <Link
                    key={date}
                    href={`/archive/${date}`}
                    className="block bg-white dark:bg-[#242424] rounded-2xl shadow-card p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-heading dark:text-gray-100">
                          {formatDateCN(date)}
                        </p>
                        <p className="text-xs text-muted dark:text-gray-500 mt-0.5">{date}</p>
                        <p className="text-sm text-body dark:text-gray-300 mt-1.5 truncate">
                          {emoji} {preview}
                        </p>
                      </div>
                      <span className="text-muted dark:text-gray-500 text-sm shrink-0 mt-0.5">›</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-3 mt-6">
                {currentPage > 1 && (
                  <Link
                    href={`/archive?page=${currentPage - 1}`}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#242424] shadow-card text-amber-accent hover:shadow-md transition-shadow"
                  >
                    ← 上一页
                  </Link>
                )}
                <span className="text-xs text-muted dark:text-gray-500">
                  {currentPage} / {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link
                    href={`/archive?page=${currentPage + 1}`}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#242424] shadow-card text-amber-accent hover:shadow-md transition-shadow"
                  >
                    下一页 →
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}
