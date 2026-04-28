import Link from "next/link";
import { Bell, Clock3, Search, Sparkles, TrendingUp } from "lucide-react";

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
  searchPlaceholder: "\u641c\u7d22\u65b0\u95fb\u3001\u5355\u8bcd\u6216\u4e3b\u9898",
  reviewCta: "\u53bb\u590d\u4e60",
  streakNote: "\u4fdd\u6301 7 \u5929\u8fde\u7eed\u5b66\u4e60\uff0c\u8bb0\u5fc6\u6548\u679c\u66f4\u7a33",
  minutes: "\u5206\u949f",
} as const;

const channelConfig: Record<
  ArticleChannel,
  { label: string; headline: string; source: string }
> = {
  easy: {
    label: "\u7b80\u5355\u65e5\u8bed",
    headline: "1 \u4e2a\u5355\u8bcd\u7b49\u5f85\u590d\u4e60",
    source: "\u4eca\u5929\u5df2\u590d\u4e60 8 \u4e2a\uff0c\u5df2\u4fdd\u5b58 5 \u4e2a\u5355\u8bcd",
  },
  original: {
    label: "\u5b9e\u65f6\u65b0\u95fb",
    headline: "2 \u4e2a\u65b0\u95fb\u8bcd\u7b49\u5f85\u590d\u4e60",
    source: "\u4eca\u5929\u5df2\u590d\u4e60 8 \u4e2a\uff0c\u5df2\u4fdd\u5b58 5 \u4e2a\u5355\u8bcd",
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
  articles: ArticlePreview[];
};

function buildHomeHref(channel: ArticleChannel, category?: ArticleCategory) {
  const params = new URLSearchParams();

  if (channel === "original") {
    params.set("channel", "original");
  }

  if (category && category !== allCategory) {
    params.set("category", category);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function HomeScreen({ channel, category, articles }: HomeScreenProps) {
  const current = channelConfig[channel];
  const filtered = articles.filter((article) => {
    if (article.channel !== channel) return false;
    if (category === allCategory) return true;

    return article.category === category;
  });

  return (
    <div>
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
            href="/me#study-settings"
            aria-label="前往学习设置"
            className="relative rounded-[20px] border border-[var(--line-soft)] glass-panel p-3 text-[var(--muted)] shadow-card"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-3 top-2 h-2.5 w-2.5 rounded-full bg-[#bc4c32]" />
          </Link>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-[18px] border border-[var(--line-soft)] glass-panel px-4 py-3 text-[var(--muted)] shadow-card">
          <Search className="h-5 w-5" />
          <span className="text-[15px]">{zh.searchPlaceholder}</span>
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

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
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
        <div className="overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#9a5319_0%,#7f4210_100%)] px-4 py-4 text-white shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-white/85">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold tracking-[0.16em]">TODAY REVIEW</span>
              </div>
              <p className="mt-3 text-lg font-semibold">{current.headline}</p>
              <p className="mt-2 text-sm text-white/80">{current.source}</p>
            </div>
            <Link
              href="/review"
              aria-label={zh.reviewCta}
              className="inline-flex h-11 min-w-[88px] shrink-0 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#9a5319] shadow-[0_8px_18px_rgba(35,21,10,0.18)]"
              style={{ color: "#9a5319" }}
            >
              <span className="block leading-none" style={{ color: "#9a5319" }}>
                {zh.reviewCta}
              </span>
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-white/78">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{zh.streakNote}</span>
          </div>
        </div>

        <div className="mt-4 space-y-3.5">
          {filtered.map((article) => (
            <Link
              key={article.id}
              href={`/article/${article.id}`}
              className="grid grid-cols-[1fr_98px] overflow-hidden rounded-[22px] border border-[var(--line-soft)] bg-[var(--panel)] shadow-card transition hover:-translate-y-0.5"
            >
              <div className="p-3.5">
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span className="inline-flex h-6 items-center rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-3 text-[11px]">
                    {article.category}
                  </span>
                  <span>{article.source}</span>
                </div>

                <h2 className="mt-2.5 line-clamp-2 font-serif-jp text-[21px] font-bold leading-[1.35] text-[var(--ink)]">
                  {article.title}
                </h2>

                <p className="mt-1.5 line-clamp-2 text-[14px] leading-6 text-[var(--muted)]">
                  {article.summary}
                </p>

                <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--muted-soft)]">
                  <Clock3 className="h-4 w-4" />
                  <span>{article.readingMinutes} {zh.minutes}</span>
                  <span>{article.publishedAt}</span>
                </div>
              </div>

              <div
                className="h-full min-h-[146px] w-full"
                style={{ background: article.imageStyle }}
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
