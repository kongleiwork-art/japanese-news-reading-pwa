"use client";

import Link from "next/link";
import { Bookmark, Check, Sparkles, X } from "lucide-react";

import type { VocabularyItem } from "@/lib/articles";
import { cn } from "@/lib/utils";

type VocabularyModalProps = {
  word: VocabularyItem | null;
  closeHref?: string;
  onClose?: () => void;
  footerText?: string;
  saveAction?: {
    active: boolean;
    label: string;
    activeLabel: string;
    onClick: () => void;
  };
};

export function VocabularyModal({
  word,
  closeHref,
  onClose,
  footerText = "继续点开其他单词，可以快速切换当前词条详情。",
  saveAction,
}: VocabularyModalProps) {
  if (!word) return null;

  return (
    <>
      {closeHref ? (
        <Link
          href={closeHref}
          scroll={false}
          aria-label="关闭词条详情"
          className="fixed inset-0 z-[80] bg-[rgba(36,23,13,0.28)] backdrop-blur-[6px]"
        />
      ) : (
        <button
          type="button"
          aria-label="关闭词条详情"
          className="fixed inset-0 z-[80] bg-[rgba(36,23,13,0.28)] backdrop-blur-[6px]"
          onClick={onClose}
        />
      )}

      <section className="fixed left-1/2 top-1/2 z-[90] flex max-h-[86vh] w-[calc(100%-28px)] max-w-[430px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[32px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ea_100%)] shadow-[0_24px_80px_rgba(88,56,25,0.22)]">
        <div className="px-6 pb-4 pt-3">
          <div className="mx-auto h-1.5 w-14 rounded-full bg-[var(--chip-bg)]" />
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 lang="ja" className="font-serif-jp text-[26px] font-bold text-[var(--ink)]">
                  {word.surface}
                </h3>
                <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-semibold text-white">
                  {word.level}
                </span>
                <span className="rounded-full bg-[var(--chip-bg)] px-2 py-0.5 text-xs text-[var(--muted)]">
                  {word.partOfSpeech}
                </span>
              </div>
              <p lang="ja" className="mt-2 text-[26px] text-[var(--accent)]">
                {word.reading}
              </p>
              <p className="mt-1 text-lg text-[var(--muted)]">{word.romaji}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                建议先看释义，再结合例句理解它在新闻语境里的真实用法。
              </p>
            </div>

            <div className="flex gap-2">
              {saveAction ? (
                <button
                  type="button"
                  aria-label={saveAction.active ? saveAction.activeLabel : saveAction.label}
                  aria-pressed={saveAction.active}
                  title={saveAction.active ? saveAction.activeLabel : saveAction.label}
                  onClick={saveAction.onClick}
                  className={cn(
                    "rounded-2xl border border-[var(--line-soft)] bg-[var(--chip-bg)] p-3 text-[var(--muted)] shadow-card transition hover:bg-[var(--accent-soft)]",
                    saveAction.active && "text-[var(--accent)]",
                  )}
                >
                  {saveAction.active ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </button>
              ) : null}
              {closeHref ? (
                <Link
                  href={closeHref}
                  scroll={false}
                  aria-label="关闭词条详情"
                  className="rounded-2xl bg-[var(--chip-bg)] p-3 text-[var(--muted)] shadow-card transition hover:bg-[var(--accent-soft)]"
                >
                  <X className="h-5 w-5" />
                </Link>
              ) : (
                <button
                  type="button"
                  aria-label="关闭词条详情"
                  onClick={onClose}
                  className="rounded-2xl bg-[var(--chip-bg)] p-3 text-[var(--muted)] shadow-card transition hover:bg-[var(--accent-soft)]"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <div className="border-t border-[var(--line-soft)] pt-5">
            <div className="flex items-center justify-between">
              <p className="section-label">Meaning</p>
              <span className="text-xs text-[var(--muted-soft)]">{word.partOfSpeech}</span>
            </div>
            <ol className="mt-3 space-y-2 text-lg text-[var(--ink)]">
              {word.meanings.map((meaning, index) => (
                <li
                  key={meaning}
                  className="flex items-center gap-3 rounded-[16px] bg-[rgba(255,255,255,0.42)] px-3 py-2"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white shadow-[0_4px_10px_rgba(122,71,20,0.18)]">
                    {index + 1}
                  </span>
                  <span>{meaning}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="section-label">Examples</p>
              <span className="text-xs text-[var(--muted-soft)]">来自当前词条</span>
            </div>
            <div className="mt-3 space-y-4">
              {word.examples.map((example) => (
                <div
                  key={example.japanese}
                  className="rounded-[20px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,#f8f1e6_0%,#f5edde_100%)] px-4 py-4 shadow-[0_6px_16px_rgba(111,77,39,0.06)]"
                >
                  <p lang="ja" className="text-lg text-[var(--ink)]">
                    {example.japanese}
                  </p>
                  <p lang="ja" className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {example.kana}
                  </p>
                  <p className="mt-3 border-t border-[var(--line-soft)] pt-3 text-base leading-7 text-[var(--muted)]">
                    {example.chinese}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[20px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,#f8f1e6_0%,#f4ead7_100%)] px-4 py-4 shadow-[0_6px_16px_rgba(111,77,39,0.05)]">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Sparkles className="h-4 w-4" />
              <span className="font-semibold">AI 讲解</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{word.aiNote}</p>
          </div>
        </div>

        <div className="border-t border-[var(--line-soft)] bg-[rgba(255,251,245,0.86)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
              词条详情
            </div>
            <p className="text-sm text-[var(--muted)]">{footerText}</p>
          </div>
        </div>
      </section>
    </>
  );
}
