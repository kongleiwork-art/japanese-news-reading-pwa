"use client";

import Link from "next/link";
import { Sparkles, TrendingUp } from "lucide-react";

import { getLearningStats, getTodayReviewCount } from "@/lib/learning-store";
import { useLearningState } from "@/lib/use-learning-state";

export function TodayReviewCard() {
  const learningState = useLearningState();
  const now = new Date();
  const stats = getLearningStats(learningState, now);
  const reviewedToday = getTodayReviewCount(learningState, now);
  const headline =
    stats.dueReviewCount > 0
      ? `${stats.dueReviewCount} 个单词等待复习`
      : stats.savedWordCount > 0
        ? "今天没有到期复习"
        : "先保存单词开始复习";
  const summary = `今天已复习 ${reviewedToday} 个，已保存 ${stats.savedWordCount} 个单词`;
  const note =
    stats.savedWordCount > 0
      ? "按复习结果安排下次间隔，记忆会更稳"
      : "阅读文章时保存单词，这里会自动更新";

  return (
    <div className="overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#9a5319_0%,#7f4210_100%)] px-4 py-4 text-white shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white/85">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold tracking-[0.16em]">TODAY REVIEW</span>
          </div>
          <p className="mt-3 text-lg font-semibold">{headline}</p>
          <p className="mt-2 text-sm text-white/80">{summary}</p>
        </div>
        <Link
          href="/review"
          aria-label="去复习"
          className="inline-flex h-11 min-w-[88px] shrink-0 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#9a5319] shadow-[0_8px_18px_rgba(35,21,10,0.18)]"
          style={{ color: "#9a5319" }}
        >
          <span className="block leading-none" style={{ color: "#9a5319" }}>
            去复习
          </span>
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-white/78">
        <TrendingUp className="h-3.5 w-3.5" />
        <span>{note}</span>
      </div>
    </div>
  );
}
