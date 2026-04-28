import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Clock3,
  EyeOff,
  Share2,
  Tag,
} from "lucide-react";

import type { ArticleDetail, VocabularyItem } from "@/lib/articles";
import { VocabularyModal } from "@/components/vocabulary-modal";
import { cn } from "@/lib/utils";

type ArticleScreenProps = {
  article: ArticleDetail;
  selectedWordId?: string;
};

export function ArticleScreen({ article, selectedWordId }: ArticleScreenProps) {
  const selectedWord =
    article.savedWords.find((item) => item.id === selectedWordId) ?? null;
  const tokens = [...article.savedWords.map((item) => item.surface)].sort(
    (left, right) => right.length - left.length,
  );

  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px] bg-[var(--surface)] pb-32 shadow-[0_18px_48px_rgba(77,52,27,0.12)]">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-5 py-3.5 backdrop-blur">
        <Link
          href="/"
          aria-label="返回首页"
          className="rounded-[18px] border border-[var(--line-soft)] glass-panel p-3 shadow-card"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--muted)]" />
        </Link>
        <h1 className="line-clamp-1 flex-1 pr-1 font-serif-jp text-[17px] font-semibold leading-6">
          {article.title}
        </h1>
        <Link
          href="#reading-mode"
          aria-label="定位到阅读模式"
          className="rounded-[18px] border border-[var(--line-soft)] glass-panel p-3 shadow-card"
        >
          <EyeOff className="h-5 w-5 text-[var(--muted)]" />
        </Link>
      </header>

      <section className="px-6 pt-3">
        <div className="rounded-[30px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,rgba(255,253,249,0.84),rgba(255,249,241,0.92))] p-4 shadow-card">
          <p className="section-label">ARTICLE DETAIL</p>
          <div
            className="mt-3 h-[196px] rounded-[26px] shadow-[0_12px_30px_rgba(79,53,27,0.1)]"
            style={{ background: article.imageStyle }}
          />

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            <span className="inline-flex h-7 items-center rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-3 text-[12px]">
              {article.category}
            </span>
            <span className="inline-flex h-7 items-center rounded-full bg-[var(--blue)] px-3 text-[12px] font-medium text-white">
              {article.tagLabel}
            </span>
            <span className="inline-flex h-7 items-center rounded-full border border-[var(--line-soft)] bg-[var(--panel)] px-3 text-[12px]">
              {article.source}
            </span>
          </div>

          <h2 className="mt-4 font-serif-jp text-[31px] font-bold leading-[1.28] tracking-tight text-[var(--ink)]">
            {article.title}
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <InfoCard label="发布时间" value={article.publishedAt} />
            <InfoCard
              label="阅读时长"
              value={
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5 text-[var(--muted)]" />
                  {article.readingMinutes} 分钟
                </span>
              }
            />
            <InfoCard
              label="已存单词"
              value={
                <span className="inline-flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-[var(--muted)]" />
                  {article.savedWords.length} 个
                </span>
              }
            />
          </div>
        </div>

        <div
          id="reading-mode"
          className="mt-5 rounded-[28px] border border-[var(--line-soft)] bg-[var(--panel)] px-5 py-5 shadow-card"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Reading Mode</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                先读原文，再点词查看解释，会更容易建立真实语感。
              </p>
            </div>
            <div className="rounded-[18px] border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--accent)]">
              学习模式
            </div>
          </div>

          <div className="mt-5 rounded-[20px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,#f6eddb_0%,#f1e4cf_100%)] px-4 py-3 text-sm text-[var(--muted)] shadow-[0_6px_18px_rgba(111,77,39,0.06)]">
            <span className="mr-2">提示</span>
            点击带下划线的单词，可以打开对应词条详情。
          </div>

          <div className="mt-6 space-y-5 border-t border-[var(--line-soft)] pt-6 text-[26px] leading-[2.02] text-[var(--ink)]">
            {article.content.map((text, index) => (
              <p key={index}>
                {splitWithTokens(text, tokens).map((part, partIndex) =>
                  part.type === "text" ? (
                    <span key={`${index}-${partIndex}`}>{part.value}</span>
                  ) : (
                    <Link
                      key={`${index}-${partIndex}`}
                      href={buildWordHref(article.id, article.savedWords, part.value)}
                      className="inline rounded-[6px] border-b border-[#8cb4c0] px-0.5 text-inherit transition hover:bg-[rgba(118,174,188,0.10)] hover:text-[#5f8d9a] focus:outline-none focus:ring-2 focus:ring-[#8cb4c0]/40"
                    >
                      {part.value}
                    </Link>
                  ),
                )}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-[28px] border border-[var(--line-soft)] bg-[var(--panel)] px-5 py-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Saved Vocabulary</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--ink)]">
                这篇文章保存的单词
              </h3>
            </div>
            <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
              {article.savedWords.length} 个词
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {article.savedWords.map((word) => (
              <Link
                key={word.id}
                href={`/article/${article.id}?word=${word.id}`}
                className={cn(
                  "rounded-[18px] border px-4 py-3 text-left shadow-[0_4px_12px_rgba(105,77,47,0.05)] transition",
                  selectedWord?.id === word.id
                    ? "border-[#6ea8b8] bg-[#79afbe] text-white"
                    : "border-[var(--line-soft)] bg-[var(--surface)] text-[var(--ink)]",
                )}
              >
                <div className="font-serif-jp text-[20px] font-bold">{word.surface}</div>
                <div
                  className={cn(
                    "mt-1 text-xs",
                    selectedWord?.id === word.id ? "text-white/80" : "text-[var(--muted)]",
                  )}
                >
                  {word.reading} · {word.meanings[0]}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {selectedWord ? (
        <VocabularyModal
          word={selectedWord}
          closeHref={`/article/${article.id}`}
          footerText="继续点击正文里的其他单词，可以切换当前词条详情。"
        />
      ) : null}

      <footer className="fixed bottom-[86px] left-1/2 z-20 flex w-[calc(100%-28px)] max-w-[392px] -translate-x-1/2 justify-around rounded-[22px] border border-[var(--line-soft)] glass-panel px-4 py-3 shadow-card">
        <button
          type="button"
          className="flex min-w-[88px] flex-col items-center gap-1 rounded-[16px] px-2 py-1 text-sm text-[var(--muted)]"
        >
          <Bookmark className="h-5 w-5" />
          收藏文章
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
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-3">
      <p className="text-[11px] text-[var(--muted-soft)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--ink)]">{value}</p>
    </div>
  );
}

function buildWordHref(articleId: string, words: VocabularyItem[], surface: string) {
  const word = words.find((item) => item.surface === surface);
  return word ? `/article/${articleId}?word=${word.id}` : `/article/${articleId}`;
}

function splitWithTokens(text: string, tokens: string[]) {
  const result: { type: "text" | "token"; value: string }[] = [];
  let rest = text;

  while (rest.length > 0) {
    const next = tokens
      .map((token) => ({ token, index: rest.indexOf(token) }))
      .filter((entry) => entry.index >= 0)
      .sort((a, b) => a.index - b.index)[0];

    if (!next) {
      result.push({ type: "text", value: rest });
      break;
    }

    if (next.index > 0) {
      result.push({ type: "text", value: rest.slice(0, next.index) });
    }

    result.push({ type: "token", value: next.token });
    rest = rest.slice(next.index + next.token.length);
  }

  return result;
}
