"use client";

import { useEffect, useState } from "react";

function getFreshness(editionDate: string): { label: string; color: string } {
  const now = new Date();
  // Get today's date in CST (UTC+8)
  const cstNow = new Date(now.getTime() + 8 * 3_600_000);
  const todayCST = cstNow.toISOString().slice(0, 10);

  if (editionDate === todayCST) {
    return { label: "今日最新", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
  }

  // Check if it's yesterday
  const yesterday = new Date(cstNow.getTime() - 86_400_000).toISOString().slice(0, 10);
  if (editionDate === yesterday) {
    return { label: "昨日数据", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" };
  }

  // Older
  const diffDays = Math.floor(
    (new Date(todayCST).getTime() - new Date(editionDate).getTime()) / 86_400_000
  );
  return { label: `${diffDays}天前`, color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" };
}

export default function FreshnessIndicator({ editionDate }: { editionDate: string }) {
  const [freshness, setFreshness] = useState(() => getFreshness(editionDate));

  useEffect(() => {
    setFreshness(getFreshness(editionDate));
    // Re-check every minute in case day rolls over
    const timer = setInterval(() => setFreshness(getFreshness(editionDate)), 60_000);
    return () => clearInterval(timer);
  }, [editionDate]);

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${freshness.color}`}>
      {freshness.label}
    </span>
  );
}
