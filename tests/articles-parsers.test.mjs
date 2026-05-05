import assert from "node:assert/strict";
import test from "node:test";

import {
  extractEasyArticleData,
  extractNewsWebOriginalArticleData,
  extractNewsWebOriginalArticleId,
  isNewsWebOriginalArticleUrl,
  parseLatestArticleLinks,
  stripRubyAnnotationTags,
} from "../src/lib/articles/parsers.ts";

test("NHK EASY classic parser extracts title, body, date, and strips ruby", () => {
  const html = `
    <html>
      <head>
        <meta name="description" content="東京で新しい技術のイベントがありました..." />
        <meta property="og:image" content="https://example.test/news.jpg" />
      </head>
      <body>
        <article>
          <h1 class="article-title">東京で<ruby>新<rt>あたら</rt></ruby>しいイベント</h1>
          <p class="article-date">2026年 4月 29日 12時 34分</p>
          <div class="article-body" id="js-article-body">
            <p><ruby>東京<rt>とうきょう</rt></ruby>でイベントがありました。</p>
            <p>多くの人が<ruby>技術<rt>ぎじゅつ</rt></ruby>を見ました。</p>
          </div>
          <div class="article-share"></div>
        </article>
      </body>
    </html>
  `;

  const article = extractEasyArticleData(html, "2026-04-29");

  assert.equal(article.title, "東京で新しいイベント");
  assert.equal(article.summary, "東京で新しい技術のイベントがありました");
  assert.deepEqual(article.content, [
    "東京でイベントがありました。",
    "多くの人が技術を見ました。",
  ]);
  assert.equal(article.publishedAtIso, "2026-04-29T12:34:00+09:00");
  assert.equal(article.imageUrl, "https://example.test/news.jpg");
});

test("ruby helper removes rt and rp tags before visible text is normalized", () => {
  assert.equal(
    stripRubyAnnotationTags("<ruby>日本<rp>（</rp><rt>にほん</rt><rp>）</rp></ruby>"),
    "日本",
  );
});

test("TBS latest parser accepts article links with and without display query", () => {
  const links = parseLatestArticleLinks(`
    <a href="/articles/-/2642875">Article A</a>
    <a href="/articles/-/2643086?display=1">Article B</a>
    <a href="/articles/-/2642875">Duplicate</a>
  `);

  assert.deepEqual(links, [
    "https://newsdig.tbs.co.jp/articles/-/2642875?display=1",
    "https://newsdig.tbs.co.jp/articles/-/2643086?display=1",
  ]);
});

test("NHK NEWS WEB original helpers read sitemap URLs and full article JSON bodies", () => {
  const url = "https://news.web.nhk/newsweb/na/na-k10015114921000";
  const article = extractNewsWebOriginalArticleData(
    {
      id: "na-k10015114921000",
      headline: "ロシア極東「サハリン2」の原油が愛媛到着",
      description: "愛媛県の製油所に原油が到着しました。",
      datePublished: "2026-05-05T15:33:25+09:00",
      image: {
        medium: {
          url: "https://example.test/news.jpg",
        },
      },
      genre: ["経済", "国際"],
      topic: [{ name: "資源・エネルギー" }],
      articleBody:
        "愛媛県の製油所に原油が到着しました。\n\nイラン情勢の悪化で代替調達が進んでいます。",
    },
    {
      id: "na-k10015114921000",
    },
  );

  assert.equal(isNewsWebOriginalArticleUrl(url), true);
  assert.equal(extractNewsWebOriginalArticleId(url), "na-k10015114921000");
  assert.equal(article.id, "na-k10015114921000");
  assert.equal(article.source, "NHK NEWS WEB");
  assert.deepEqual(article.content, [
    "愛媛県の製油所に原油が到着しました。",
    "イラン情勢の悪化で代替調達が進んでいます。",
  ]);
  assert.equal(article.imageUrl, "https://example.test/news.jpg");
  assert.equal(article.topicLabel, "経済 国際 資源・エネルギー");
});
