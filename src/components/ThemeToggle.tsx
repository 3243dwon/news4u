"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "切换到浅色模式" : "切换到深色模式"}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 dark:bg-white/10 shadow-sm hover:shadow-md transition-shadow text-sm"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
