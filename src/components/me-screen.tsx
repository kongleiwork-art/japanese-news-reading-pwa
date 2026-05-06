"use client";

import Link from "next/link";
import {
  BookMarked,
  BookOpen,
  ChevronRight,
  Flame,
  HardDrive,
  ListChecks,
  RotateCcw,
} from "lucide-react";

import {
  getCurrentStreak,
  getLearningStats,
  getRecentActivityCells,
  getTodayReviewCount,
} from "@/lib/learning-store";
import { useLearningState } from "@/lib/use-learning-state";
import { cn } from "@/lib/utils";

const toneMap = {
  amber: "text-[#b36a18]",
  sky: "text-[#6ea2bf]",
  rose: "text-[#cf4a38]",
  slate: "text-[#49382d]",
  green: "text-[#557c46]",
} as const;

export function MeScreen() {
  const learningState = useLearningState();
  const stats = getLearningStats(learningState);
  const todayReviewed = getTodayReviewCount(learningState);
  const currentStreak = getCurrentStreak(learningState);
  const activityCells = getRecentActivityCells(learningState);
  const meStats = [
    { label: "已读文章", value: String(stats.readArticleCount), tone: "amber" },
    { label: "保存单词", value: String(stats.savedWordCount), tone: "sky" },
    { label: "今日待复习", value: String(stats.dueReviewCount), tone: "rose" },
    { label: "今日已复习", value: String(todayReviewed), tone: "green" },
    { label: "累计复习", value: String(stats.totalReviewCount), tone: "slate" },
    { label: "连续天数", value: String(currentStreak), tone: "amber" },
  ] as const;

  return (
    <div className="pb-10">
      <header className="px-6 pb-4 pt-5">
        <div>
          <p className="section-label">LOCAL LEARNING</p>
          <h1 className="mt-2 font-serif-jp text-[32px] font-bold">我的</h1>
        </div>
      </header>

      <section className="space-y-4 px-6 py-4">
        <div className="rounded-[26px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,#fffdfa_0%,#faf3e8_100%)] p-4 shadow-card">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#9a5319_0%,#7f4210_100%)] text-white">
              <HardDrive className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif-jp text-[24px] font-bold">本地学习模式</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                当前阅读、单词和复习记录保存在这台设备的浏览器里。
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
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

        <Link
          href="/saved"
          className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--line-soft)] bg-[var(--panel)] px-4 py-4 shadow-card transition hover:-translate-y-0.5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <BookMarked className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[var(--ink)]">收藏文章</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {stats.savedArticleCount > 0
                  ? `已收藏 ${stats.savedArticleCount} 篇，随时回去复读`
                  : "保存值得复读的文章"}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted)]" />
        </Link>

        <div className="rounded-[22px] border border-[var(--line-soft)] bg-[var(--panel)] p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Flame className="h-4 w-4" />
              <span className="font-semibold text-[var(--ink)]">连续学习 {currentStreak} 天</span>
            </div>
            <span className="text-sm text-[var(--muted)]">最近 30 天</span>
          </div>
          <div className="mt-4 grid grid-cols-10 gap-2">
            {activityCells.map((cell, index) => (
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

        <div className="grid grid-cols-3 gap-2.5">
          <LearningSignal icon={BookOpen} label="阅读" value={stats.readArticleCount} />
          <LearningSignal icon={ListChecks} label="复习" value={todayReviewed} />
          <LearningSignal icon={RotateCcw} label="待复习" value={stats.dueReviewCount} />
        </div>

        <p className="pt-8 text-center text-sm text-[var(--muted)]">轻读日语 v1.0.0</p>
      </section>
    </div>
  );
}

function LearningSignal({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel)] px-3 py-4 text-center shadow-card">
      <Icon className="mx-auto h-5 w-5 text-[var(--accent)]" />
      <div className="mt-2 text-xl font-bold text-[var(--ink)]">{value}</div>
      <div className="mt-1 text-xs text-[var(--muted)]">{label}</div>
    </div>
  );
}
