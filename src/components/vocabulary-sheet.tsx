"use client";

import { Bookmark, Sparkles, X } from "lucide-react";

import type { VocabularyItem } from "@/lib/data";

type VocabularySheetProps = {
  word: VocabularyItem | null;
  onClose: () => void;
};

export function VocabularySheet({ word, onClose }: VocabularySheetProps) {
  return (
    <>
      <button
        aria-label="关闭单词详情"
        className={`fixed inset-0 z-[80] bg-[rgba(36,23,13,0.22)] transition ${word ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <section
        className={`fixed left-1/2 top-1/2 z-[90] w-[calc(100%-28px)] max-w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-[32px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ea_100%)] px-6 pb-6 pt-3 shadow-[0_24px_80px_rgba(88,56,25,0.22)] transition duration-200 ${word ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"}`}
      >
        <div className="mx-auto h-1.5 w-14 rounded-full bg-[var(--chip-bg)]" />
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif-jp text-[26px] font-bold text-[var(--ink)]">
                {word?.surface}
              </h3>
              <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-semibold text-white">
                {word?.level}
              </span>
              <span className="rounded-full bg-[var(--chip-bg)] px-2 py-0.5 text-xs text-[var(--muted)]">
                {word?.partOfSpeech}
              </span>
            </div>
            <p className="mt-2 text-[26px] text-[var(--accent)]">{word?.reading}</p>
            <p className="mt-1 text-lg text-[var(--muted)]">{word?.romaji}</p>
          </div>

          <div className="flex gap-2">
            <button className="rounded-2xl bg-[var(--blue)] p-3 text-white shadow-card">
              <Bookmark className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="rounded-2xl bg-[var(--chip-bg)] p-3 text-[var(--muted)] shadow-card"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-5 border-t border-[var(--line-soft)] pt-5">
          <div className="flex items-center justify-between">
            <p className="section-label">Meaning</p>
            <span className="text-xs text-[var(--muted-soft)]">{word?.partOfSpeech}</span>
          </div>
          <ol className="mt-3 space-y-2 text-lg text-[var(--ink)]">
            {(word?.meanings ?? []).map((meaning, index) => (
              <li key={meaning} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white">
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
            {(word?.examples ?? []).map((example) => (
              <div
                key={example.japanese}
                className="rounded-[18px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-4"
              >
                <p className="text-lg text-[var(--ink)]">{example.japanese}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{example.kana}</p>
                <p className="mt-2 text-base text-[var(--muted)]">{example.chinese}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-[18px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-4">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">AI 讲解</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{word?.aiNote}</p>
        </div>
      </section>
    </>
  );
}
