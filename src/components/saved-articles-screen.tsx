"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Bookmark, Clock3, Trash2 } from "lucide-react";

import { buildArticleImageStyle } from "@/components/article-image-style";
import type { ArticlePreview } from "@/lib/articles";
import {
  getSavedArticleIds,
  removeSavedArticle,
  type SavedArticle,
} from "@/lib/learning-store";
import { useLearningState } from "@/lib/use-learning-state";

type SavedArticlesScreenProps = {
  articles: ArticlePreview[];
};

type SavedArticleListItem =
  | {
      kind: "available";
      article: SavedArticle | ArticlePreview;
      savedAtIso?: string;
    }
  | {
      kind: "missing";
      articleId: string;
    };

export function SavedArticlesScreen({ articles }: SavedArticlesScreenProps) {
  const learningState = useLearningState();
  const articleById = useMemo(
    () => new Map(articles.map((article) => [article.id, article])),
    [articles],
  );
  const snapshotById = useMemo(
    () => new Map(learningState.savedArticles.map((article) => [article.id, article])),
    [learningState.savedArticles],
  );
  const savedItems = getSavedArticleIds(learningState).map<SavedArticleListItem>((articleId) => {
    const snapshot = snapshotById.get(articleId);
    const currentArticle = articleById.get(articleId);

    if (snapshot) {
      return {
        kind: "available",
        article: snapshot,
        savedAtIso: snapshot.savedAtIso,
      };
    }

    if (currentArticle) {
      return {
        kind: "available",
        article: currentArticle,
      };
    }

    return {
      kind: "missing",
      articleId,
    };
  });

  return (
    <div className="pb-10">
      <header className="px-6 pb-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label">READ LATER</p>
            <h1 className="mt-2 font-serif-jp text-[32px] font-bold">收藏文章</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              把值得复读的新闻留下来，之后再回到原文里学。
            </p>
          </div>
          <Link
            href="/me"
            aria-label="返回我的"
            className="rounded-[20px] border border-[var(--line-soft)] glass-panel p-3 text-[var(--muted)] shadow-card"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <section className="space-y-4 px-6 py-4">
        <div className="flex items-center justify-between rounded-[20px] border border-[var(--line-soft)] bg-[rgba(255,249,242,0.72)] px-4 py-3 shadow-card">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">
              {savedItems.length > 0 ? `已收藏 ${savedItems.length} 篇文章` : "还没有收藏文章"}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {savedItems.length > 0
                ? "点击文章继续阅读，或移除不再需要的材料"
                : "读到适合复读的文章时，点顶部书签保存"}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Bookmark className="h-4 w-4" />
          </div>
        </div>

        {savedItems.length === 0 ? (
          <div className="rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel)] px-5 py-8 text-center shadow-card">
            <p className="font-serif-jp text-[24px] font-bold text-[var(--ink)]">从一篇新闻开始</p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              打开文章，点顶部的书签图标，就能建立自己的复读材料库。
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-card"
            >
              去读文章
            </Link>
          </div>
        ) : null}

        {savedItems.map((item) =>
          item.kind === "available" ? (
            <SavedArticleCard
              key={item.article.id}
              article={item.article}
              savedAtIso={item.savedAtIso}
            />
          ) : (
            <MissingArticleCard key={item.articleId} articleId={item.articleId} />
          ),
        )}
      </section>
    </div>
  );
}

function SavedArticleCard({
  article,
  savedAtIso,
}: {
  article: SavedArticle | ArticlePreview;
  savedAtIso?: string;
}) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-[var(--line-soft)] bg-[var(--panel)] shadow-card">
      <Link href={`/article/${article.id}`} className="block">
        <div
          aria-hidden="true"
          className="h-[92px] w-full border-b border-[var(--line-soft)]"
          style={buildArticleImageStyle(article)}
        />
        <div className="p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-3 text-[11px]">
              {article.category}
            </span>
            <span className="min-w-0 truncate">{article.source}</span>
          </div>
          <h2
            lang="ja"
            className="mt-3 line-clamp-3 font-serif-jp text-[20px] font-bold leading-[1.38] text-[var(--ink)]"
          >
            {article.title}
          </h2>
          <p lang="ja" className="mt-2 line-clamp-2 text-[14px] leading-6 text-[var(--muted)]">
            {article.summary}
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-3 border-t border-[var(--line-soft)] px-4 py-3 text-[11px] text-[var(--muted-soft)]">
        <div className="flex min-w-0 items-center gap-2">
          <Clock3 className="h-4 w-4 shrink-0" />
          <span>{article.readingMinutes} 分钟</span>
          <span>{article.publishedAt}</span>
          {savedAtIso ? <span className="truncate">收藏于 {formatSavedAt(savedAtIso)}</span> : null}
        </div>
        <button
          type="button"
          aria-label={`移除收藏：${article.title}`}
          onClick={() => removeSavedArticle(article.id)}
          className="shrink-0 rounded-full p-2 text-[var(--muted)] transition hover:bg-[rgba(118,174,188,0.12)] hover:text-[var(--accent)]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function MissingArticleCard({ articleId }: { articleId: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[var(--line-soft)] bg-[rgba(255,253,249,0.68)] p-4 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-serif-jp text-[20px] font-bold text-[var(--ink)]">文章暂时不可用</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            这条旧收藏当前没有在新闻源里找到，可以先保留，或从收藏列表移除。
          </p>
          <p className="mt-3 truncate text-xs text-[var(--muted-soft)]">ID: {articleId}</p>
        </div>
        <button
          type="button"
          aria-label={`移除不可用收藏：${articleId}`}
          onClick={() => removeSavedArticle(articleId)}
          className="shrink-0 rounded-full border border-[var(--line-soft)] bg-[var(--panel)] p-2 text-[var(--muted)] transition hover:text-[var(--accent)]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function formatSavedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "未知时间";

  return `${date.getMonth() + 1}/${date.getDate()}`;
}
