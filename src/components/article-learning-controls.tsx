"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Bookmark, Check, Share2 } from "lucide-react";

import { VocabularyModal } from "@/components/vocabulary-modal";
import type { ArticleDetail, VocabularyItem } from "@/lib/articles";
import {
  isArticleSaved,
  isWordSaved,
  recordArticleRead,
  toggleSavedArticle,
  toggleSavedWord,
} from "@/lib/learning-store";
import { useLearningState } from "@/lib/use-learning-state";
import { cn } from "@/lib/utils";

type ArticleLearningControlsProps = {
  article: ArticleDetail;
  selectedWord: VocabularyItem | null;
};

export function ArticleLearningControls({
  article,
  selectedWord,
}: ArticleLearningControlsProps) {
  const learningState = useLearningState();
  const articleSaved = isArticleSaved(learningState, article.id);
  const selectedWordSaved = selectedWord
    ? isWordSaved(learningState, article.id, selectedWord.id)
    : false;

  useEffect(() => {
    recordArticleRead(article);
  }, [article]);

  return (
    <>
      {selectedWord ? (
        <VocabularyModal
          word={selectedWord}
          closeHref={`/article/${article.id}`}
          footerText={
            selectedWordSaved
              ? "这个单词已经在你的单词本里，稍后会进入复习队列。"
              : "保存这个单词后，可以在单词本和复习页继续学习。"
          }
          saveAction={{
            active: selectedWordSaved,
            label: "保存单词",
            activeLabel: "取消保存单词",
            onClick: () => toggleSavedWord(article, selectedWord),
          }}
        />
      ) : null}

      <footer className="fixed bottom-[86px] left-1/2 z-20 flex w-[calc(100%-28px)] max-w-[392px] -translate-x-1/2 justify-around rounded-[22px] border border-[var(--line-soft)] glass-panel px-4 py-3 shadow-card">
        <button
          type="button"
          onClick={() => toggleSavedArticle(article)}
          className={cn(
            "flex min-w-[88px] flex-col items-center gap-1 rounded-[16px] px-2 py-1 text-sm transition",
            articleSaved
              ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
              : "text-[var(--muted)] hover:bg-[rgba(118,174,188,0.12)]",
          )}
        >
          {articleSaved ? <Check className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
          {articleSaved ? "已收藏" : "收藏文章"}
        </button>
        <button
          type="button"
          className="flex min-w-[88px] flex-col items-center gap-1 rounded-[16px] px-2 py-1 text-sm text-[var(--muted)]"
        >
          <Share2 className="h-5 w-5" />
          分享
        </button>
        <Link
          href="/words"
          className="flex min-w-[88px] flex-col items-center gap-1 rounded-[16px] px-2 py-1 text-sm text-[#78aebb] transition hover:bg-[rgba(118,174,188,0.12)]"
        >
          <Bookmark className="h-5 w-5" />
          去单词本
        </Link>
      </footer>
    </>
  );
}
