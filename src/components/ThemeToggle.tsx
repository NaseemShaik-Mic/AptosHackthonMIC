import React from "react";

export const ThemeToggle: React.FC = () => {
  const [dark, setDark] = React.useState<boolean>(() =>
    document.documentElement.classList.contains("dark")
  );

  React.useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <button
      aria-label="Toggle theme"
      className="inline-flex items-center h-10 px-4 rounded-md border border-border bg-background hover:bg-accent text-foreground transition-colors"
      onClick={() => setDark((d) => !d)}
    >
      {dark ? "Dark" : "Light"}
    </button>
  );
};
