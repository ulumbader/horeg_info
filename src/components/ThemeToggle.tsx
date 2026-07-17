"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className="motion-control relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-glass-bg text-foreground shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      aria-label="Ganti tema warna"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}
