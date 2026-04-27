"use client";

import Link from "next/link";
import { BookOpenText, House, RefreshCw, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { key: "home", href: "/", label: "首页", icon: House },
  { key: "words", href: "/words", label: "单词本", icon: BookOpenText },
  { key: "review", href: "/review", label: "复习", icon: RefreshCw },
  { key: "me", href: "/me", label: "我的", icon: UserRound },
] as const;

type BottomNavProps = {
  activeTab: "home" | "words" | "review" | "me";
};

export function BottomNav({ activeTab }: BottomNavProps) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-24px)] max-w-[398px] -translate-x-1/2 items-center rounded-[24px] border border-[var(--line-soft)] glass-panel px-3 py-2 shadow-card">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.key === activeTab;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[11px] transition",
              active ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "text-[var(--muted)]",
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", active && "stroke-[2.2px]")} />
            <span className={cn(active && "font-semibold")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
