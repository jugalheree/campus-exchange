import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
      title="Toggle theme"
    >
      <span className="text-base">{theme === "dark" ? "☀️" : "🌙"}</span>
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
