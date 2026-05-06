"use client";

import Link from "next/link";
import { useState } from "react";
import { Brain, CheckCircle2, Eye, HelpCircle, XCircle } from "lucide-react";

import { VocabularyModal } from "@/components/vocabulary-modal";
import {
  buildReviewQueue,
  getCurrentStreak,
  getLearningStats,
  recordReviewResult,
  type ReviewRating,
} from "@/lib/learning-store";
import { useLearningState } from "@/lib/use-learning-state";
import { cn } from "@/lib/utils";

type ReviewScreenProps = {
  selectedWordId?: string;
  side?: string;
};

function buildReviewHref({
  nextSide,
  selectedWordId,
}: {
  nextSide?: "front" | "back";
  selectedWordId?: string;
}) {
  const params = new URLSearchParams();

  if (nextSide && nextSide !== "front") {
    params.set("side", nextSide);
  }

  if (selectedWordId) {
    params.set("word", selectedWordId);
  }

  const query = params.toString();
  return query ? `/review?${query}` : "/review";
}

export function ReviewScreen({ selectedWordId, side }: ReviewScreenProps) {
  const learningState = useLearningState();
  const [completedWordIds, setCompletedWordIds] = useState<Set<string>>(() => new Set());
  const fullQueue = buildReviewQueue(learningState);
  const queue = fullQueue.filter((word) => !completedWordIds.has(word.id));
  const stats = getLearningStats(learningState);
  const currentStreak = getCurrentStreak(learningState);
  const completedCount = completedWordIds.size;
  const initialQueueLength = completedCount + queue.length;
  const progressPercent =
    initialQueueLength > 0 ? Math.round((completedCount / initialQueueLength) * 100) : 0;
  const current = queue[0] ?? null;
  const [flipped, setFlipped] = useState(side === "back");
  const selectedWord = fullQueue.find((item) => item.id === selectedWordId) ?? null;

  if (!current) {
    const hasSavedWords = stats.savedWordCount > 0;

    return (
      <div className="pb-8">
        <header className="px-6 pb-4 pt-5">
          <p className="section-label">SMART REVIEW</p>
          <h1 className="mt-2 font-serif-jp text-[32px] font-bold">复习</h1>
        </header>
        <section className="px-6 pt-6">
          <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--panel)] px-5 py-9 text-center shadow-card">
            <p className="font-serif-jp text-[26px] font-bold text-[var(--ink)]">
              {hasSavedWords ? "这一轮完成了" : "复习队列还空着"}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {hasSavedWords
                ? "刚刚评分的词已经安排好下次复习，刷新后状态也会保留。"
                : "先在文章里保存几个单词，系统会按时间把它们放进复习队列。"}
            </p>
            <Link
              href={hasSavedWords ? "/words" : "/"}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-2.5 text-center text-sm font-semibold text-white shadow-card"
            >
              {hasSavedWords ? "查看单词本" : "去读文章"}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const handleRating = (rating: ReviewRating) => {
    recordReviewResult(current.id, rating);
    setCompletedWordIds((ids) => new Set(ids).add(current.id));
    setFlipped(false);
  };

  return (
    <div className="pb-8">
      <header className="px-6 pb-4 pt-5">
        <div>
          <p className="section-label">SMART REVIEW</p>
          <h1 className="mt-2 font-serif-jp text-[32px] font-bold">复习</h1>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="flex min-h-14 flex-col items-center justify-center rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel)] px-2 shadow-card">
            <span className="whitespace-nowrap text-xs font-medium text-[var(--muted)]">已完成</span>
            <span className="mt-0.5 whitespace-nowrap text-[17px] font-semibold leading-none text-[var(--ink)]">
              {completedCount} / {initialQueueLength}
            </span>
          </div>
          <div className="flex min-h-14 flex-col items-center justify-center rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel)] px-2 shadow-card">
            <span className="whitespace-nowrap text-xs font-medium text-[var(--muted)]">今日</span>
            <span className="mt-0.5 whitespace-nowrap text-[17px] font-semibold leading-none text-[var(--ink)]">
              {stats.dueReviewCount} 词
            </span>
          </div>
          <div className="flex min-h-14 flex-col items-center justify-center rounded-[20px] border border-[#eadbbd] bg-[#f4ead7] px-2 shadow-card">
            <span className="whitespace-nowrap text-xs font-medium text-[#9a641f]">连续</span>
            <span className="mt-0.5 whitespace-nowrap text-[17px] font-semibold leading-none text-[var(--accent)]">
              {currentStreak} 天
            </span>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-[var(--chip-bg)]">
          <div
            className="h-2 rounded-full bg-[var(--accent)] transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      <section className="px-6 pt-6">
        <p className="text-center text-base text-[var(--muted)]">
          点击卡片查看释义，再按记忆程度安排下次复习。
        </p>

        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          className="mt-6 block w-full rounded-[32px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--bg)]"
        >
          <div
            className={cn(
              "relative min-h-[252px] overflow-hidden rounded-[32px] transition duration-500",
              flipped
                ? "border border-[rgba(255,255,255,0.16)] bg-[linear-gradient(135deg,#9a5319_0%,#7f4210_100%)] text-white shadow-[0_24px_52px_rgba(97,53,18,0.22)] [transform:rotateY(180deg)]"
                : "border border-[var(--line-soft)] bg-[var(--panel)] text-[var(--ink)] shadow-[0_20px_44px_rgba(89,59,27,0.12)] [transform:rotateY(0deg)]",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_36%)] opacity-0 transition duration-500",
                flipped && "opacity-100",
              )}
            />

            {flipped ? (
              <div className="relative flex min-h-[252px] flex-col px-6 py-7 text-white [transform:rotateY(180deg)] animate-in fade-in duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium tracking-[0.08em] text-white/72">记忆面</p>
                    <p className="mt-2 text-base text-white/80">再点一次卡片可回到正面</p>
                  </div>
                  <div className="inline-flex min-h-8 min-w-12 items-center justify-center rounded-full border border-white/18 bg-white/12 px-3 py-1 text-center text-sm font-semibold text-white">
                    {current.level}
                  </div>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <p className="text-base text-white/72">读法</p>
                  <h2 lang="ja" className="mt-2 font-serif-jp text-[42px] font-bold">
                    {current.reading}
                  </h2>
                  <p className="mt-5 text-base text-white/72">释义</p>
                  <div className="mt-2 space-y-1 font-serif-jp text-[24px] font-bold leading-tight">
                    {current.meanings.map((meaning) => (
                      <p key={meaning}>{meaning}</p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative flex min-h-[252px] flex-col px-6 py-7 animate-in fade-in duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium tracking-[0.08em] text-[var(--muted)]">
                      单词卡
                    </p>
                    <p className="mt-2 text-base text-[var(--muted)]">轻点翻面查看释义</p>
                  </div>
                  <div className="inline-flex min-h-8 min-w-12 items-center justify-center rounded-full bg-[#f2e0b7] px-3 py-1 text-center text-sm font-semibold text-[#8f5b13]">
                    {current.level}
                  </div>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <p className="text-base text-[var(--muted)]">单词</p>
                  <h2 lang="ja" className="mt-5 font-serif-jp text-[54px] font-bold leading-none">
                    {current.surface}
                  </h2>
                </div>
              </div>
            )}
          </div>
        </button>

        {flipped ? (
          <>
            <div className="mt-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-medium text-[var(--ink)]">
                  你对这个单词的掌握程度如何？
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  选择后会按对应节奏安排下一次复习
                </p>
              </div>
              <Link
                href={buildReviewHref({
                  nextSide: "back",
                  selectedWordId: current.id,
                })}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--panel)] px-4 py-2 text-center text-sm font-medium text-[var(--accent)] shadow-card"
              >
                <Eye className="h-4 w-4" />
                查看详情
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRating("again")}
                className="group flex min-h-[112px] flex-col items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,#d85641_0%,#c84533_100%)] px-4 py-5 text-center text-white shadow-[0_14px_30px_rgba(179,62,42,0.22)] transition hover:-translate-y-0.5"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/14">
                  <XCircle className="h-5 w-5" />
                </div>
                <div className="mt-3 text-[15px] font-semibold">不会</div>
                <div className="mt-1 text-[13px] text-white/82">10 分钟后</div>
              </button>
              <button
                type="button"
                onClick={() => handleRating("hard")}
                className="group flex min-h-[112px] flex-col items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,#fffdfa_0%,#f8f1e8_100%)] px-4 py-5 text-center text-[var(--ink)] shadow-[0_14px_28px_rgba(102,74,42,0.08)] transition hover:-translate-y-0.5"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(244,234,215,0.9)] text-[var(--muted)]">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div className="mt-3 text-[15px] font-semibold">有印象</div>
                <div className="mt-1 text-[13px] text-[var(--muted)]">1 天后</div>
              </button>
              <button
                type="button"
                onClick={() => handleRating("good")}
                className="group flex min-h-[112px] flex-col items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,#fffdfa_0%,#f8f1e8_100%)] px-4 py-5 text-center text-[var(--ink)] shadow-[0_14px_28px_rgba(102,74,42,0.08)] transition hover:-translate-y-0.5"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(244,234,215,0.9)] text-[var(--muted)]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="mt-3 text-[15px] font-semibold">记得</div>
                <div className="mt-1 text-[13px] text-[var(--muted)]">3 天后</div>
              </button>
              <button
                type="button"
                onClick={() => handleRating("easy")}
                className="group flex min-h-[112px] flex-col items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,#b36a1d_0%,#9a5319_100%)] px-4 py-5 text-center text-white shadow-[0_14px_30px_rgba(122,73,22,0.24)] transition hover:-translate-y-0.5"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/14">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="mt-3 text-[15px] font-semibold">掌握了</div>
                <div className="mt-1 text-[13px] text-white/82">7 天后</div>
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-[18px] border border-[var(--line-soft)] bg-[rgba(246,238,227,0.92)] px-4 py-3 text-sm text-[var(--muted)] shadow-card">
              <Brain className="h-4 w-4 text-[var(--accent)]" />
              <span>掌握程度越高，系统给出的复习间隔就越长。</span>
            </div>
          </>
        ) : null}

        <div className="mt-6 rounded-[18px] border border-[var(--line-soft)] bg-[var(--panel)] px-4 py-3 text-center text-sm text-[var(--muted)] shadow-card">
          来源：来自《{current.articleTitle}》
        </div>
      </section>

      <VocabularyModal
        word={selectedWord}
        closeHref={buildReviewHref({ nextSide: "back" })}
        footerText="看完词条后可以继续回到复习，保持当前记忆节奏。"
      />
    </div>
  );
}
