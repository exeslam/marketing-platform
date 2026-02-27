"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu, Check, CheckSquare, FolderKanban, FileText } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { markNotificationReadAction, searchAction } from "@/lib/actions";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface SearchResults {
  tasks: { id: string; title: string; priority: string }[];
  projects: { id: string; name: string; color: string }[];
  posts: { id: string; title: string | null; platform: string }[];
}

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, startTransition] = useTransition();
  const bellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load notifications on mount
  useEffect(() => {
    async function loadNotifications() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setNotifications(data as Notification[]);
    }
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  }

  // Debounced search
  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) { setSearchResults(null); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await searchAction(value);
      if (res.success) setSearchResults(res.data);
    }, 300);
  }, []);

  function navigateTo(path: string) {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
    router.push(path);
  }

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults(null);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close search on outside click
  useEffect(() => {
    if (!searchOpen) return;
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [searchOpen]);

  // Close bell on outside click
  useEffect(() => {
    if (!bellOpen) return;
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [bellOpen]);

  const hasResults = searchResults && (searchResults.tasks.length > 0 || searchResults.projects.length > 0 || searchResults.posts.length > 0);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-[var(--card)] px-4 md:px-6">
      <button
        onClick={() => window.dispatchEvent(new Event("toggle-mobile-sidebar"))}
        className="rounded-lg p-2 hover:bg-[var(--muted)] md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden items-center md:flex" ref={searchRef}>
        {searchOpen ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Поиск задач, проектов, постов..."
              autoFocus
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-80 rounded-lg border bg-[var(--muted)] py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
            {/* Search results dropdown */}
            {searchQuery.length >= 2 && (
              <div className="absolute left-0 top-11 w-80 rounded-xl border bg-[var(--card)] shadow-xl">
                {!searchResults && <p className="px-4 py-3 text-sm text-[var(--muted-foreground)]">Поиск...</p>}
                {searchResults && !hasResults && <p className="px-4 py-3 text-sm text-[var(--muted-foreground)]">Ничего не найдено</p>}
                {hasResults && (
                  <div className="max-h-[320px] overflow-y-auto py-1">
                    {searchResults.projects.length > 0 && (
                      <>
                        <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Проекты</p>
                        {searchResults.projects.map((p) => (
                          <button key={p.id} onClick={() => navigateTo(`/projects/${p.id}`)} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm hover:bg-[var(--muted)]">
                            <FolderKanban className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                            <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="truncate">{p.name}</span>
                          </button>
                        ))}
                      </>
                    )}
                    {searchResults.tasks.length > 0 && (
                      <>
                        <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Задачи</p>
                        {searchResults.tasks.map((t) => (
                          <button key={t.id} onClick={() => navigateTo("/tasks")} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm hover:bg-[var(--muted)]">
                            <CheckSquare className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                            <span className="truncate">{t.title}</span>
                          </button>
                        ))}
                      </>
                    )}
                    {searchResults.posts.length > 0 && (
                      <>
                        <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Контент</p>
                        {searchResults.posts.map((p) => (
                          <button key={p.id} onClick={() => navigateTo("/content")} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm hover:bg-[var(--muted)]">
                            <FileText className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                            <span className="truncate">{p.title ?? "Без названия"}</span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border bg-[var(--muted)] px-3 py-2 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--border)]"
          >
            <Search className="h-4 w-4" />
            <span>Поиск...</span>
            <kbd className="ml-2 rounded bg-[var(--background)] px-1.5 py-0.5 text-xs">Ctrl+K</kbd>
          </button>
        )}
      </div>

      {/* Notifications */}
      <div className="relative" ref={bellRef}>
        <button onClick={() => setBellOpen(!bellOpen)} className="relative rounded-lg p-2 hover:bg-[var(--muted)]">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {bellOpen && (
          <div className="absolute right-0 top-12 w-80 rounded-xl border bg-[var(--card)] shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">Уведомления</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                  {unreadCount} новых
                </span>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">Нет уведомлений</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn("flex items-start gap-3 border-b px-4 py-3 last:border-0", !n.is_read && "bg-primary/5")}
                  >
                    <div className="flex-1">
                      <p className={cn("text-sm", !n.is_read && "font-medium")}>{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{n.body}</p>}
                      <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{formatDate(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)} className="shrink-0 rounded p-1 hover:bg-[var(--muted)]" title="Прочитано">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
