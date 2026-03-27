import fs from "node:fs";
import path from "node:path";
import type { Edition } from "@/types/edition";
import mockEdition from "@/data/mock/edition.json";

const EDITIONS_DIR = path.join(process.cwd(), "data", "editions");

function listEditionFiles(): string[] {
  if (!fs.existsSync(EDITIONS_DIR)) return [];
  return fs
    .readdirSync(EDITIONS_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .reverse();
}

/**
 * Finds the latest edition JSON in data/editions/, falling back to mock data.
 */
export function loadEdition(): { data: Edition; source: "live" | "mock" } {
  try {
    const files = listEditionFiles();
    if (files.length > 0) {
      const latest = path.join(EDITIONS_DIR, files[0]);
      const raw = fs.readFileSync(latest, "utf-8");
      return { data: JSON.parse(raw) as Edition, source: "live" };
    }
  } catch (err) {
    console.warn("⚠ Failed to load live edition, falling back to mock:", (err as Error).message);
  }
  return { data: mockEdition as Edition, source: "mock" };
}

/**
 * Load a specific edition by date string (YYYY-MM-DD).
 */
export function loadEditionByDate(date: string): Edition | null {
  try {
    const filePath = path.join(EDITIONS_DIR, `${date}.json`);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw) as Edition;
    }
  } catch {
    // fall through
  }
  return null;
}

/**
 * List all available edition dates, newest first, capped at `limit`.
 * Returns date strings like "2026-03-27".
 */
export function listEditions(limit = 30): string[] {
  return listEditionFiles()
    .map((f) => f.replace(".json", ""))
    .slice(0, limit);
}

export interface SearchResult {
  date: string;
  section: string;
  title: string;
  text: string;
}

/**
 * Full-text search across all editions.
 * Returns matching snippets with date and section info.
 */
export function searchEditions(query: string, limit = 50): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];
  const files = listEditionFiles();

  for (const file of files) {
    if (results.length >= limit) break;
    try {
      const raw = fs.readFileSync(path.join(EDITIONS_DIR, file), "utf-8");
      const ed = JSON.parse(raw) as Edition;
      const date = file.replace(".json", "");

      for (const h of ed.todayHighlights ?? []) {
        if (matches(q, h.title, h.summary)) {
          results.push({ date, section: "今日要点", title: h.title, text: h.summary });
        }
      }
      for (const m of ed.macroPulse ?? []) {
        if (matches(q, m.title, m.summary)) {
          results.push({ date, section: "宏观脉搏", title: m.title, text: m.summary });
        }
      }
      for (const o of ed.overseasPerspective ?? []) {
        if (matches(q, o.title, o.summary, o.source)) {
          results.push({ date, section: "海外视角", title: o.title, text: o.summary });
        }
      }
      for (const sector of [ed.industryFocus?.healthcare, ed.industryFocus?.energy]) {
        if (!sector) continue;
        for (const h of sector.highlights ?? []) {
          if (matches(q, h.title, h.summary)) {
            results.push({ date, section: `行业聚焦 · ${sector.title}`, title: h.title, text: h.summary });
          }
        }
      }
      for (const s of ed.premarketSignals ?? []) {
        if (matches(q, s.category, s.signal)) {
          results.push({ date, section: "盘前信号", title: s.category, text: s.signal });
        }
      }
    } catch {
      // skip corrupt files
    }
  }

  return results.slice(0, limit);
}

function matches(query: string, ...fields: (string | undefined)[]): boolean {
  return fields.some((f) => f?.toLowerCase().includes(query));
}
