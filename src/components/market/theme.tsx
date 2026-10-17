import { useEffect, useState } from "react";

export type ThemeName = "light" | "dark";

const key = "seek-theme";

export function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(key, theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#172521" : "#ffffff");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>("light");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);
  const dark = theme === "dark";
  return (
    <button
      type="button"
      aria-label={dark ? "Use light theme" : "Use dark theme"}
      aria-pressed={dark}
      className="grid h-10 w-12 shrink-0 place-items-center"
      onClick={() => {
        const next = dark ? "light" : "dark";
        applyTheme(next);
        setTheme(next);
      }}
    >
      <span className={`relative block h-[22px] w-10 overflow-hidden rounded-full transition-colors duration-200 ${dark ? "bg-primary" : "bg-cream ring-1 ring-border"}`}>
        <span
          className={`absolute top-[3px] left-0 size-4 rounded-full shadow-sm transition-transform duration-200 ${dark ? "translate-x-[21px] bg-white" : "translate-x-[3px] bg-ink"}`}
        />
      </span>
    </button>
  );
}