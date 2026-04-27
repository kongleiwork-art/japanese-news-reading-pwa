import Link from "next/link";
import {
  ChevronRight,
  Flame,
  HelpCircle,
  Lock,
  Settings,
  Shield,
  Star,
  type LucideIcon,
} from "lucide-react";

import { meStats, streakCells } from "@/lib/data";
import { cn } from "@/lib/utils";

const toneMap = {
  amber: "text-[#b36a18]",
  sky: "text-[#6ea2bf]",
  rose: "text-[#cf4a38]",
  slate: "text-[#49382d]",
} as const;

export function MeScreen() {
  return (
    <div className="pb-10">
      <header className="px-6 pb-4 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="section-label">PROFILE</p>
            <h1 className="mt-2 font-serif-jp text-[32px] font-bold">我的</h1>
          </div>
          <Link
            href="#study-settings"
            aria-label="定位到学习设置"
            className="rounded-[20px] border border-[var(--line-soft)] glass-panel p-3 shadow-card"
          >
            <Settings className="h-5 w-5 text-[var(--muted)]" />
          </Link>
        </div>
      </header>

      <section className="space-y-4 px-6 py-4">
        <div className="rounded-[26px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,#fffdfa_0%,#faf3e8_100%)] p-4 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#9a5319_0%,#7f4210_100%)] text-2xl text-white">
              人
            </div>
            <div>
              <h2 className="font-serif-jp text-[26px] font-bold">尚未登录</h2>
              <button
                type="button"
                className="mt-3 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                登录 / 注册
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {meStats.map((stat) => (
            <div
              key={stat.label}
              className="flex min-h-[88px] flex-col items-center justify-center rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel)] px-2 py-3.5 text-center shadow-card"
            >
              <div className={cn("text-[28px] font-bold", toneMap[stat.tone])}>{stat.value}</div>
              <div className="mt-1.5 text-xs text-[var(--muted)]">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-[22px] border border-[var(--line-soft)] bg-[var(--panel)] p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Flame className="h-4 w-4" />
              <span className="font-semibold text-[var(--ink)]">学习连续天数</span>
            </div>
            <span className="text-sm text-[var(--muted)]">最近 30 天</span>
          </div>
          <div className="mt-4 grid grid-cols-10 gap-2">
            {streakCells.map((cell, index) => (
              <span
                key={`${cell}-${index}`}
                className={cn(
                  "h-7 rounded-md",
                  cell === "dark" && "bg-[var(--accent)]",
                  cell === "mid" && "bg-[#caa17d]",
                  cell === "empty" && "bg-[#e5ddd0]",
                )}
              />
            ))}
          </div>
        </div>

        <div id="study-settings" className="space-y-3">
          <p className="text-sm text-[var(--muted)]">学习设置</p>
          <SettingsBlock
            items={[
              { icon: Star, label: "复习提醒", value: "每天 20:00" },
              { icon: Lock, label: "默认频道", value: "简单日语" },
              { icon: Settings, label: "字体大小", value: "中" },
            ]}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">应用设置</p>
          <SettingsBlock
            items={[
              { icon: Shield, label: "隐私政策" },
              { icon: HelpCircle, label: "帮助与反馈" },
            ]}
          />
        </div>

        <p className="pt-8 text-center text-sm text-[var(--muted)]">轻读日语 v1.0.0</p>
      </section>
    </div>
  );
}

function SettingsBlock({
  items,
}: {
  items: { icon: LucideIcon; label: string; value?: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel)] shadow-card">
      {items.map((item, index) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className={cn(
              "flex items-center justify-between px-4 py-4",
              index > 0 && "border-t border-[var(--line-soft)]",
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-[var(--muted)]" />
              <span className="text-lg text-[var(--ink)]">{item.label}</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--muted)]">
              {item.value ? <span>{item.value}</span> : null}
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
