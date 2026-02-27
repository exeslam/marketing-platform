"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Светлая", icon: Sun },
  { id: "dark", label: "Тёмная", icon: Moon },
  { id: "system", label: "Системная", icon: Monitor },
];

const accentColors = [
  { id: "indigo", label: "Индиго", value: "#6366F1" },
  { id: "blue", label: "Синий", value: "#3B82F6" },
  { id: "emerald", label: "Изумрудный", value: "#10B981" },
  { id: "rose", label: "Розовый", value: "#F43F5E" },
  { id: "amber", label: "Янтарный", value: "#F59E0B" },
  { id: "violet", label: "Фиолетовый", value: "#8B5CF6" },
];

export function AppearanceForm() {
  const [theme, setTheme] = useState<Theme>("light");
  const [accent, setAccent] = useState("indigo");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    const stored = localStorage.getItem("theme") as Theme | null;
    setTheme(stored ?? (isDark ? "dark" : "light"));
    setAccent(localStorage.getItem("accent-color") ?? "indigo");
  }, []);

  function applyTheme(newTheme: Theme) {
    setTheme(newTheme);
    setSaved(false);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
    localStorage.setItem("theme", newTheme);
  }

  function applyAccent(colorId: string) {
    setAccent(colorId);
    setSaved(false);
    const color = accentColors.find((c) => c.id === colorId);
    if (color) {
      document.documentElement.style.setProperty("--color-primary", color.value);
      localStorage.setItem("accent-color", colorId);
    }
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-4 md:p-6">
      <div className="space-y-6">
        {/* Theme */}
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Тема</h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Выберите тему оформления интерфейса
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {themes.map((t) => {
              const Icon = t.icon;
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => applyTheme(t.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-[var(--muted)] hover:border-[var(--border)]"
                  )}
                >
                  {isActive && (
                    <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-xl p-3",
                      isActive ? "bg-primary/10" : "bg-[var(--card)]"
                    )}
                  >
                    <Icon className={cn("h-6 w-6", isActive ? "text-primary" : "text-[var(--muted-foreground)]")} />
                  </div>
                  <span className={cn("text-sm font-medium", isActive && "text-primary")}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color */}
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Акцентный цвет</h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Основной цвет интерфейса
          </p>

          <div className="flex flex-wrap gap-3">
            {accentColors.map((color) => {
              const isActive = accent === color.id;
              return (
                <button
                  key={color.id}
                  onClick={() => applyAccent(color.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border-2 px-4 py-2.5 transition-all",
                    isActive
                      ? "border-current"
                      : "border-transparent bg-[var(--muted)] hover:bg-[var(--border)]"
                  )}
                  style={isActive ? { borderColor: color.value } : undefined}
                >
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="text-sm font-medium">{color.label}</span>
                  {isActive && <Check className="h-3.5 w-3.5" style={{ color: color.value }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact mode */}
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Плотность интерфейса</h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Настройте размер элементов и отступов
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Компактный режим</p>
                <p className="text-xs text-[var(--muted-foreground)]">Меньше отступов, больше контента</p>
              </div>
              <span className="rounded bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                Скоро
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Язык интерфейса</p>
                <p className="text-xs text-[var(--muted-foreground)]">Русский (по умолчанию)</p>
              </div>
              <span className="rounded bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                Скоро
              </span>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={cn(
              "rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors",
              saved ? "bg-green-500" : "bg-primary hover:bg-primary/90"
            )}
          >
            {saved ? "Сохранено!" : "Сохранить настройки"}
          </button>
        </div>
      </div>
    </div>
  );
}
