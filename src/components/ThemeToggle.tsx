interface Props {
  theme: "light" | "dark";
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      title={theme === "light" ? "Switch to dark" : "Switch to light"}
      aria-label="Toggle theme"
    >
      {theme === "light" ? "☾" : "☀"}
    </button>
  );
}
