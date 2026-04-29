import assert from "node:assert/strict";
import test from "node:test";

import {
  extractEasyArticleData,
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
