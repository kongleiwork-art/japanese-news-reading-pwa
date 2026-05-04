import assert from "node:assert/strict";
import test from "node:test";

import { extractMetaContent } from "../src/lib/articles/utils.ts";

test("meta parser reads content regardless of attribute order", () => {
  const html = `
    <head>
      <meta content="https://example.test/reversed.jpg" property="og:image" />
      <meta content="Article summary" name="description" />
    </head>
  `;

  assert.equal(extractMetaContent(html, "og:image"), "https://example.test/reversed.jpg");
  assert.equal(extractMetaContent(html, "description"), "Article summary");
});
