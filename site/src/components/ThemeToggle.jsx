export default function ThemeToggle({ theme, setTheme }) {
  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <button
        type="button"
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
      >
        light
      </button>
      <span className="sep" aria-hidden="true">
        /
      </span>
      <button
        type="button"
        aria-pressed={theme === "dark"}
        onClick={() => setTheme("dark")}
      >
        dark
      </button>
    </div>
  );
}
