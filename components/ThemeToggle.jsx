"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("filedrop-theme", next ? "dark" : "light");
    window.dispatchEvent(
      new CustomEvent("filedrop-theme-change", { detail: { isDark: next } })
    );
    setIsDark(next);
  }

  if (isDark === null) return <div className="h-9 w-16" aria-hidden />;

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className="focus-ring group relative flex h-9 w-16 items-center rounded-full border border-ink/15 bg-transparent px-1 transition-colors dark:border-wire"
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper transition-transform duration-300 dark:bg-signal dark:text-white ${
          isDark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" fill="currentColor" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4.5" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M12 2v2.2M12 19.8V22M22 12h-2.2M4.2 12H2M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5M18.4 18.4l-1.5-1.5M7.1 7.1L5.6 5.6" />
            </g>
          </svg>
        )}
      </span>
    </button>
  );
}
