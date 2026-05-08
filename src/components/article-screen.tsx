"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Eye,
  EyeOff,
  Tag,
} from "lucide-react";

import { buildArticleImageStyle } from "@/components/article-image-style";
import type { ArticleDetail, VocabularyItem } from "@/lib/articles";
import { ArticleLearningControls } from "@/components/article-learning-controls";
import { ArticleSaveButton } from "@/components/article-save-button";
import { ArticleSwipeHome } from "@/components/article-swipe-home";
import { ArticleBackHomeLink } from "@/components/home-return-state";
import { segmentTextWithVocabulary } from "@/lib/articles/tokenizer";
import { cn } from "@/lib/utils";

type ArticleScreenProps = {
  article: ArticleDetail;
  selectedWordId?: string;
  showReadings?: boolean;
  returnHref?: string;
};

export function ArticleScreen({
  article,
  selectedWordId,
  showReadings = false,
  returnHref,
}: ArticleScreenProps) {
  const selectedWord =
    article.savedWords.find((item) => item.id === selectedWordId) ?? null;
  const readingToggleHref = buildArticleHref(article.id, {
    wordId: selectedWordId,
    showReadings: !showReadings,
    returnHref,
  });

  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px] bg-[var(--surface)] pb-32 shadow-[0_18px_48px_rgba(77,52,27,0.12)]">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-5 py-3.5 backdrop-blur">
        <ArticleBackHomeLink
          aria-label="返回首页"
          returnHref={returnHref}
          className="rounded-[18px] border border-[var(--line-soft)] glass-panel p-3 shadow-card"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--muted)]" />
        </ArticleBackHomeLink>
        <h1
          lang="ja"
          className="line-clamp-1 flex-1 pr-1 font-serif-jp text-[17px] font-semibold leading-6"
        >
          {article.title}
        </h1>
        <ArticleSaveButton article={article} />
        <Link
          href={readingToggleHref}
          scroll={false}
          aria-label={showReadings ? "隐藏重点词读音" : "显示重点词读音"}
          title={showReadings ? "隐藏重点词读音" : "显示重点词读音"}
          className={cn(
            "relative isolate rounded-[18px] border p-3 shadow-card transition duration-200",
            showReadings
              ? "reading-toggle-active text-[#2f6f78]"
              : "border-[var(--line-soft)] glass-panel text-[var(--muted)]",
          )}
        >
          {showReadings ? (
            <span
              aria-hidden="true"
              className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#4d9498] shadow-[0_0_0_3px_rgba(89,148,153,0.16)]"
            />
          ) : null}
          {showReadings ? (
            <Eye className="h-5 w-5" />
          ) : (
            <EyeOff className="h-5 w-5" />
          )}
        </Link>
      </header>

      <section className="px-6 pt-3">
        <div className="rounded-[30px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,rgba(255,253,249,0.84),rgba(255,249,241,0.92))] p-4 shadow-card">
          <p className="section-label">ARTICLE DETAIL</p>
          <div
            className="mt-3 h-[196px] rounded-[26px] shadow-[0_12px_30px_rgba(79,53,27,0.1)]"
            style={buildArticleImageStyle(article)}
          />

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            <span className="inline-flex h-7 items-center rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-3 text-[12px]">
              {article.category}
            </span>
            <span className="inline-flex h-7 items-center rounded-full bg-[var(--blue)] px-3 text-[12px] font-medium text-white">
              {article.channel === "original" ? "实时新闻" : article.tagLabel}
            </span>
            <span className="inline-flex h-7 items-center rounded-full border border-[var(--line-soft)] bg-[var(--panel)] px-3 text-[12px]">
              {article.source}
            </span>
          </div>

          <h2
            lang="ja"
            className="mt-4 font-serif-jp text-[31px] font-bold leading-[1.28] tracking-tight text-[var(--ink)]"
          >
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
              label="精选词"
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
              {showReadings ? "重点读音" : "学习模式"}
            </div>
          </div>

          <div className="mt-5 rounded-[20px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,#f6eddb_0%,#f1e4cf_100%)] px-4 py-3 text-sm text-[var(--muted)] shadow-[0_6px_18px_rgba(111,77,39,0.06)]">
            <span className="mr-2">提示</span>
            {showReadings
              ? "已显示新闻重点词的平假名读音；点击词语仍可打开词条详情。"
              : "点击带下划线的单词，可以打开对应词条详情。"}
          </div>

          <div
            className={cn(
              "mt-6 space-y-5 border-t border-[var(--line-soft)] pt-6 text-[26px] text-[var(--ink)]",
              showReadings ? "leading-[2.35]" : "leading-[2.02]",
            )}
          >
            {article.content.map((text, index) => (
              <p key={index} lang="ja">
                {segmentTextWithVocabulary(text, article.savedWords).map((part, partIndex) =>
                  part.type === "text" ? (
                    <span key={`${index}-${partIndex}`}>{part.value}</span>
                  ) : (
                    <Link
                      key={`${index}-${partIndex}`}
                      href={buildWordHref(
                        article.id,
                        article.savedWords,
                        part.wordId,
                        showReadings,
                        returnHref,
                      )}
                      scroll={false}
                      className="inline rounded-[7px] bg-[rgba(118,174,188,0.12)] px-1 font-semibold text-[#4f8796] underline decoration-[#4f8796] decoration-2 underline-offset-[6px] transition hover:bg-[rgba(118,174,188,0.22)] hover:text-[#376b78] focus:outline-none focus:ring-2 focus:ring-[#8cb4c0]/45"
                    >
                      {showReadings ? (
                        <VocabularyRuby
                          value={part.value}
                          word={getWordById(article.savedWords, part.wordId)}
                        />
                      ) : (
                        part.value
                      )}
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
              <p className="section-label">Selected Vocabulary</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--ink)]">
                这篇文章的精选学习词
              </h3>
            </div>
            <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
              {article.savedWords.length} 个词
            </div>
          </div>

          {article.savedWords.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {article.savedWords.map((word) => (
                <Link
                  key={word.id}
                  href={buildArticleHref(article.id, {
                    wordId: word.id,
                    showReadings,
                    returnHref,
                  })}
                  scroll={false}
                  className={cn(
                    "flex min-h-[86px] min-w-0 flex-col justify-center rounded-[18px] border px-3 py-3 text-left shadow-[0_4px_12px_rgba(105,77,47,0.05)] transition",
                    selectedWord?.id === word.id
                      ? "border-[#6ea8b8] bg-[#79afbe] text-white"
                      : "border-[var(--line-soft)] bg-[var(--surface)] text-[var(--ink)]",
                  )}
                >
                  <div lang="ja" className="line-clamp-1 font-serif-jp text-[20px] font-bold leading-7">
                    {word.surface}
                  </div>
                  <div
                    className={cn(
                      "mt-1 line-clamp-2 text-[11px] leading-5",
                      selectedWord?.id === word.id ? "text-white/80" : "text-[var(--muted)]",
                    )}
                  >
                    {word.reading} · {word.meanings[0]}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[rgba(255,255,255,0.42)] px-4 py-5 text-sm leading-6 text-[var(--muted)]">
              本篇暂未收录可讲解词条
            </div>
          )}
        </div>
      </section>

      <ArticleSwipeHome returnHref={returnHref} />
      <ArticleLearningControls
        article={article}
        selectedWord={selectedWord}
        returnHref={returnHref}
      />
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

function buildArticleHref(
  articleId: string,
  options: {
    wordId?: string;
    showReadings?: boolean;
    returnHref?: string;
  } = {},
) {
  const params = new URLSearchParams();

  if (options.wordId) {
    params.set("word", options.wordId);
  }

  if (options.showReadings) {
    params.set("readings", "1");
  }

  if (options.returnHref === "/saved") {
    params.set("from", "saved");
  }

  const query = params.toString();
  return query ? `/article/${articleId}?${query}` : `/article/${articleId}`;
}

function getWordById(words: VocabularyItem[], wordId: string) {
  return words.find((item) => item.id === wordId) ?? null;
}

function buildWordHref(
  articleId: string,
  words: VocabularyItem[],
  wordId: string,
  showReadings: boolean,
  returnHref?: string,
) {
  const word = words.find((item) => item.id === wordId);
  return word
    ? buildArticleHref(articleId, { wordId: word.id, showReadings, returnHref })
    : buildArticleHref(articleId, { showReadings, returnHref });
}

function VocabularyRuby({
  value,
  word,
}: {
  value: string;
  word: VocabularyItem | null;
}) {
  if (!word?.reading || word.reading === value) {
    return <>{value}</>;
  }

  return (
    <ruby className="ruby-reading">
      {value}
      <rt>{word.reading}</rt>
    </ruby>
  );
}
