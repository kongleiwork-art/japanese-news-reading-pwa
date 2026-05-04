"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpenText, ChevronDown, Search, Sparkles, Trash2 } from "lucide-react";

import { VocabularyModal } from "@/components/vocabulary-modal";
import { removeSavedWord, type SavedWord } from "@/lib/learning-store";
import { useLearningState } from "@/lib/use-learning-state";
import { cn } from "@/lib/utils";

type WordsScreenProps = {
  selectedWordId?: string;
};

export function WordsScreen({ selectedWordId }: WordsScreenProps) {
  const learningState = useLearningState();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const allWords = learningState.savedWords;
  const savedGroups = groupWordsByArticle(allWords);
  const selectedWord = allWords.find((item) => item.id === selectedWordId) ?? null;

  return (
    <div className="pb-8">
      <header className="px-6 pb-4 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="section-label">VOCAB LIBRARY</p>
            <h1 className="mt-2 font-serif-jp text-[32px] font-bold">单词本</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">把新闻里真正会反复遇到的词沉淀下来</p>
          </div>
          <Link
            href="#word-groups"
            aria-label="定位到单词分组"
            className="rounded-[20px] border border-[var(--line-soft)] glass-panel p-2.5 text-[var(--accent)] shadow-card"
          >
            <BookOpenText className="h-4.5 w-4.5" />
          </Link>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-[18px] border border-[var(--line-soft)] glass-panel px-4 py-3 text-[var(--muted)] shadow-card">
          <Search className="h-5 w-5" />
          <span className="text-base">搜索单词、读音或释义...</span>
        </div>
      </header>

      <section id="word-groups" className="space-y-4 px-6 py-4">
        <div className="flex items-center justify-between rounded-[20px] border border-[var(--line-soft)] bg-[rgba(255,249,242,0.72)] px-4 py-3 shadow-card">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">
              {allWords.length > 0 ? `已保存 ${allWords.length} 个新闻词` : "还没有保存单词"}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {allWords.length > 0
                ? "点击词条查看详情，或去复习页进入记忆循环"
                : "阅读文章时点开词条并保存，它们会出现在这里"}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>

        {savedGroups.length === 0 ? (
          <div className="rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel)] px-5 py-8 text-center shadow-card">
            <p className="font-serif-jp text-[24px] font-bold text-[var(--ink)]">从一篇新闻开始</p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              打开文章，点击带下划线的词，再按保存按钮，就能建立自己的新闻单词本。
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-card"
            >
              去读文章
            </Link>
          </div>
        ) : null}

        {savedGroups.map((group) => {
          const open = openGroups[group.articleTitle] ?? true;

          return (
            <div
              key={group.articleTitle}
              className="overflow-hidden rounded-[22px] border border-[var(--line-soft)] bg-[var(--panel)] shadow-card"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenGroups((prev) => ({
                    ...prev,
                    [group.articleTitle]: !prev[group.articleTitle],
                  }))
                }
                className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--surface)] text-sm font-medium leading-none text-[var(--muted)]">
                    {group.items.length}词
                  </span>
                  <span className="line-clamp-1 min-w-0 pt-1 font-serif-jp text-[19px] font-semibold leading-7 text-[var(--ink)]">
                    {group.articleTitle}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "mt-1 h-5 w-5 shrink-0 text-[var(--muted)] transition",
                    open && "rotate-180",
                  )}
                />
              </button>

              {open ? (
                <div className="border-t border-[var(--line-soft)]">
                  {group.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-start justify-between gap-4 px-4 py-4",
                        index > 0 && "border-t border-[var(--line-soft)]",
                      )}
                    >
                      <Link href={`/words?word=${item.id}`} className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <h2 className="font-serif-jp text-[28px] font-bold text-[var(--ink)]">
                            {item.surface}
                          </h2>
                          <span className="inline-flex h-6 items-center rounded-full bg-[#cf9827] px-2 py-0.5 text-xs font-semibold text-white">
                            {item.level}
                          </span>
                        </div>
                        <p className="mt-1.5 text-base text-[var(--accent)]">{item.reading}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {item.meanings.join(" / ")}
                        </p>
                      </Link>

                      <div className="shrink-0 rounded-2xl bg-[var(--surface)] px-3 py-2 text-right text-[11px] text-[var(--muted)]">
                        <p>复习 {item.reviewCount} 次</p>
                        <p className="mt-1">保存于 {item.savedAt}</p>
                        <button
                          type="button"
                          aria-label={`删除${item.surface}`}
                          onClick={() => removeSavedWord(item.id)}
                          className="ml-auto mt-3 block text-[var(--muted-soft)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      <VocabularyModal
        word={selectedWord}
        closeHref="/words"
        footerText="你可以继续点开单词本里的其他单词，快速切换词条详情。"
      />
    </div>
  );
}

function groupWordsByArticle(words: SavedWord[]) {
  const groups = new Map<string, { articleTitle: string; items: SavedWord[] }>();

  for (const word of words) {
    const group = groups.get(word.articleId) ?? {
      articleTitle: word.articleTitle,
      items: [],
    };

    group.items.push(word);
    groups.set(word.articleId, group);
  }

  return [...groups.values()];
}
