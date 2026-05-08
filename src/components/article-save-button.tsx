"use client";

import { Bookmark, Check } from "lucide-react";

import type { ArticleDetail } from "@/lib/articles";
import { isArticleSaved, toggleSavedArticle } from "@/lib/learning-store";
import { cacheArticleForOffline } from "@/lib/offline-article-cache";
import { useLearningState } from "@/lib/use-learning-state";
import { cn } from "@/lib/utils";

type ArticleSaveButtonProps = {
  article: ArticleDetail;
};

export function ArticleSaveButton({ article }: ArticleSaveButtonProps) {
  const learningState = useLearningState();
  const saved = isArticleSaved(learningState, article.id);

  return (
    <button
      type="button"
      onClick={() => {
        if (!saved) {
          cacheArticleForOffline(article, { pinned: true });
        }

        toggleSavedArticle(article);
      }}
      aria-label={saved ? "取消收藏文章" : "收藏文章"}
      title={saved ? "已收藏" : "收藏文章"}
      className={cn(
        "relative isolate rounded-[18px] border p-3 shadow-card transition duration-200",
        saved
          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
          : "border-[var(--line-soft)] glass-panel text-[var(--muted)]",
      )}
    >
      {saved ? (
        <span
          aria-hidden="true"
          className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_3px_rgba(118,174,188,0.18)]"
        />
      ) : null}
      {saved ? <Check className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
    </button>
  );
}
