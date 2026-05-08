"use client";

import Link from "next/link";
import { ArrowLeft, BookmarkX } from "lucide-react";

import { ArticleScreen } from "@/components/article-screen";
import type { ArticleDetail } from "@/lib/articles";
import { removeSavedArticle, type SavedArticle } from "@/lib/learning-store";
import { useLearningState } from "@/lib/use-learning-state";

type SavedArticleFallbackScreenProps = {
  articleId: string;
  selectedWordId?: string;
  showReadings?: boolean;
  returnHref?: string;
};

export function SavedArticleFallbackScreen({
  articleId,
  selectedWordId,
  showReadings,
  returnHref,
}: SavedArticleFallbackScreenProps) {
  const learningState = useLearningState();
  const savedArticle = learningState.savedArticles.find((article) => article.id === articleId);
  const article = savedArticle ? toArticleDetail(savedArticle) : null;

  if (article) {
    return (
      <ArticleScreen
        article={article}
        selectedWordId={selectedWordId}
        showReadings={showReadings}
        returnHref={returnHref}
      />
    );
  }

  return <UnavailableSavedArticle articleId={articleId} />;
}

function toArticleDetail(article: SavedArticle): ArticleDetail | null {
  if (!article.content || !article.savedWords || !article.tagLabel) {
    return null;
  }

  return {
    id: article.id,
    channel: article.channel,
    title: article.title,
    source: article.source,
    category: article.category,
    summary: article.summary,
    readingMinutes: article.readingMinutes,
    publishedAt: article.publishedAt,
    image: article.image,
    imageStyle: article.imageStyle,
    tagLabel: article.tagLabel,
    content: article.content,
    savedWords: article.savedWords,
  };
}

function UnavailableSavedArticle({ articleId }: { articleId: string }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[var(--surface)] px-6 py-5 shadow-[0_18px_48px_rgba(77,52,27,0.12)]">
      <header className="flex items-center gap-3">
        <Link
          href="/saved"
          aria-label="返回收藏"
          className="rounded-[18px] border border-[var(--line-soft)] glass-panel p-3 shadow-card"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--muted)]" />
        </Link>
        <div>
          <p className="section-label">Saved Article</p>
          <h1 className="mt-1 font-serif-jp text-[24px] font-bold text-[var(--ink)]">
            收藏文章暂时不可用
          </h1>
        </div>
      </header>

      <section className="mt-8 rounded-[28px] border border-dashed border-[var(--line-soft)] bg-[rgba(255,253,249,0.76)] p-5 shadow-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <BookmarkX className="h-5 w-5" />
        </div>
        <h2 className="mt-5 font-serif-jp text-[24px] font-bold text-[var(--ink)]">
          这篇旧收藏没有正文快照
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          它可能来自前一天的新闻池，当前服务端也没有找到原文。从现在开始，新收藏会同时保存正文快照和离线缓存，再过夜也能打开。
        </p>
        <p className="mt-4 truncate text-xs text-[var(--muted-soft)]">ID: {articleId}</p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/saved"
            className="inline-flex flex-1 justify-center rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-card"
          >
            回到收藏
          </Link>
          <button
            type="button"
            onClick={() => removeSavedArticle(articleId)}
            className="inline-flex flex-1 justify-center rounded-full border border-[var(--line-soft)] bg-[var(--panel)] px-4 py-3 text-sm font-semibold text-[var(--muted)] shadow-card"
          >
            移除这条
          </button>
        </div>
      </section>
    </main>
  );
}
