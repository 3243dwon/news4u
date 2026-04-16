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
 * List all available edition dates, newest first, with pagination.
 * Returns date strings like "2026-03-27".
 */
export function listEditions(limit = 30, offset = 0): string[] {
  return listEditionFiles()
    .map((f) => f.replace(".json", ""))
    .slice(offset, offset + limit);
}

/**
 * Total count of available editions.
 */
export function countEditions(): number {
  return listEditionFiles().length;
}

export interface SearchResult {
  date: string;
  section: string;
  title: string;
  text: string;
}

/**
 * Full-text search across all editions with in-memory caching.
 * Index is built once per process and cached for subsequent searches.
 */

interface IndexEntry {
  date: string;
  section: string;
  title: string;
  text: string;
  searchText: string; // pre-lowercased concatenation for fast matching
}

let _searchIndex: IndexEntry[] | null = null;
let _indexedFileCount = 0;

function buildSearchIndex(): IndexEntry[] {
  const files = listEditionFiles();

  // Return cached index if file count hasn't changed
  if (_searchIndex && _indexedFileCount === files.length) {
    return _searchIndex;
  }

  const entries: IndexEntry[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(EDITIONS_DIR, file), "utf-8");
      const ed = JSON.parse(raw) as Edition;
      const date = file.replace(".json", "");

      for (const h of ed.todayHighlights ?? []) {
        entries.push({
          date, section: "今日要点", title: h.title, text: h.summary,
          searchText: `${h.title} ${h.summary}`.toLowerCase(),
        });
      }
      for (const m of ed.macroPulse ?? []) {
        entries.push({
          date, section: "宏观脉搏", title: m.title, text: m.summary,
          searchText: `${m.title} ${m.summary}`.toLowerCase(),
        });
      }
      for (const o of ed.overseasPerspective ?? []) {
        entries.push({
          date, section: "海外视角", title: o.title, text: o.summary,
          searchText: `${o.title} ${o.summary} ${o.source}`.toLowerCase(),
        });
      }
      for (const sector of [ed.industryFocus?.healthcare, ed.industryFocus?.energy]) {
        if (!sector) continue;
        for (const h of sector.highlights ?? []) {
          entries.push({
            date, section: `行业聚焦 · ${sector.title}`, title: h.title, text: h.summary,
            searchText: `${h.title} ${h.summary}`.toLowerCase(),
          });
        }
      }
      for (const s of ed.premarketSignals ?? []) {
        entries.push({
          date, section: "盘前信号", title: s.category, text: s.signal,
          searchText: `${s.category} ${s.signal}`.toLowerCase(),
        });
      }
    } catch {
      // skip corrupt files
    }
  }

  _searchIndex = entries;
  _indexedFileCount = files.length;
  return entries;
}

export function searchEditions(query: string, limit = 50): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const index = buildSearchIndex();

  const results: SearchResult[] = [];
  for (const entry of index) {
    if (results.length >= limit) break;
    if (entry.searchText.includes(q)) {
      results.push({
        date: entry.date,
        section: entry.section,
        title: entry.title,
        text: entry.text,
      });
    }
  }

  return results;
}
