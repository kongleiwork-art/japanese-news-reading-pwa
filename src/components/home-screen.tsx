import Link from "next/link";
import { Clock3, RefreshCw, UserRound } from "lucide-react";

import { buildArticleImageStyle } from "@/components/article-image-style";
import { HomeArticleLink, HomeScrollRestorer } from "@/components/home-return-state";
import { TodayReviewCard } from "@/components/today-review-card";
import {
  articleCategories,
  type ArticleCategory,
  type ArticleChannel,
  type ArticlePreview,
} from "@/lib/articles";
import { cn } from "@/lib/utils";

const allCategory = articleCategories[0];

const zh = {
  appName: "\u8f7b\u8bfb\u65e5\u8bed",
  subtitle: "\u4ece\u65b0\u95fb\u8fdb\u5165\u771f\u5b9e\u65e5\u8bed",
  minutes: "\u5206\u949f",
} as const;

const channelConfig: Record<ArticleChannel, { label: string }> = {
  easy: {
    label: "\u7b80\u5355\u65e5\u8bed",
  },
  original: {
    label: "\u5b9e\u65f6\u65b0\u95fb",
  },
};

const categoryItems: { value: ArticleCategory; label: string }[] = articleCategories.map(
  (category) => ({
    value: category,
    label: category,
  }),
);

type HomeScreenProps = {
  channel: ArticleChannel;
  category: ArticleCategory;
  batch: number;
  articles: ArticlePreview[];
};

function buildHomeHref(channel: ArticleChannel, category?: ArticleCategory, batch?: number) {
  const params = new URLSearchParams();

  if (channel === "original") {
    params.set("channel", "original");
  }

  if (category && category !== allCategory) {
    params.set("category", category);
  }

  if (batch && batch > 0) {
    params.set("batch", String(batch));
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function HomeScreen({ channel, category, batch, articles }: HomeScreenProps) {
  const filtered = articles.filter((article) => {
    if (article.channel !== channel) return false;
    if (category === allCategory) return true;

    return article.category === category;
  });

  return (
    <div>
      <HomeScrollRestorer />
      <section className="px-6 pb-4 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="section-label">QINGDU JAPANESE</p>
            <h1 className="mt-2 font-serif-jp text-[32px] font-bold tracking-tight text-[var(--ink)]">
              {zh.appName}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{zh.subtitle}</p>
          </div>
          <Link
            href="/me"
            aria-label="查看本地学习状态"
            className="relative rounded-[20px] border border-[var(--line-soft)] glass-panel p-3 text-[var(--muted)] shadow-card"
          >
            <UserRound className="h-5 w-5" />
          </Link>
        </div>

        <div className="mt-5 rounded-[20px] border border-[var(--line-soft)] bg-[rgba(240,231,216,0.72)] p-1.5 shadow-card">
          <div className="grid grid-cols-2 gap-1.5">
            {(["easy", "original"] as const).map((item) => {
              const active = item === channel;

              return (
                <Link
                  key={item}
                  href={buildHomeHref(item)}
                  className={cn(
                    "rounded-[16px] px-4 py-3 text-center text-[15px] transition",
                    active
                      ? "bg-[var(--panel)] font-semibold text-[var(--accent-strong)] shadow-card"
                      : "text-[var(--muted)]",
                  )}
                >
                  {channelConfig[item].label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1">
          {categoryItems.map((item) => {
            const active = item.value === category;

            return (
              <Link
              key={item.value}
                href={buildHomeHref(channel, item.value)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-4 py-2 text-sm shadow-[0_1px_0_rgba(255,255,255,0.5)_inset]",
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-white"
                    : "border-[var(--line-soft)] bg-[var(--panel)] text-[var(--muted)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-6 py-4">
        <TodayReviewCard />

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">学习精选</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">从已筛选新闻池中展示 12 篇</p>
          </div>
          <Link
            href={buildHomeHref(channel, category, batch + 1)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] shadow-card"
          >
            <RefreshCw className="h-4 w-4" />
            换一批
          </Link>
        </div>

        <div className="mt-4 space-y-3.5">
          {filtered.map((article) => (
            <HomeArticleLink
              key={article.id}
              articleId={article.id}
              href={`/article/${article.id}`}
              className="block overflow-hidden rounded-[22px] border border-[var(--line-soft)] bg-[var(--panel)] shadow-card transition hover:-translate-y-0.5"
            >
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

                <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--muted-soft)]">
                  <Clock3 className="h-4 w-4" />
                  <span>{article.readingMinutes} {zh.minutes}</span>
                  <span>{article.publishedAt}</span>
                </div>
              </div>
            </HomeArticleLink>
          ))}
        </div>
      </section>
    </div>
  );
}
