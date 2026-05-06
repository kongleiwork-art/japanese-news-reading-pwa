"use client";

import type { ArticleDetail } from "@/lib/articles";

type CacheArticleMessage = {
  type: "CACHE_ARTICLE";
  payload: {
    articleId: string;
    articleUrl: string;
    apiUrl: string;
    imageUrl?: string;
  };
};

export function cacheArticleForOffline(article: ArticleDetail) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const imageUrl = article.image.type === "remote" ? article.image.value : undefined;
  const message: CacheArticleMessage = {
    type: "CACHE_ARTICLE",
    payload: {
      articleId: article.id,
      articleUrl: `/article/${article.id}`,
      apiUrl: `/api/articles/${article.id}`,
      imageUrl,
    },
  };

  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
    return;
  }

  navigator.serviceWorker.ready
    .then((registration) => {
      registration.active?.postMessage(message);
    })
    .catch(() => {
      // Offline caching is opportunistic; reading should never depend on SW readiness.
    });
}
