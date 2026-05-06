"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const HOME_RETURN_STATE_KEY = "qingdu-home-return-state-v1";
const RETURN_STATE_MAX_AGE_MS = 30 * 60 * 1000;

type HomeReturnState = {
  articleId: string;
  href: string;
  scrollY: number;
  savedAt: number;
};

type HomeArticleLinkProps = {
  articleId: string;
  href: string;
  className?: string;
  children: ReactNode;
};

type ArticleBackHomeLinkProps = {
  "aria-label": string;
  className?: string;
  children: ReactNode;
};

export function HomeArticleLink({
  articleId,
  href,
  className,
  children,
}: HomeArticleLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      data-home-article-id={articleId}
      onClick={() => saveHomeReturnState(articleId)}
    >
      {children}
    </Link>
  );
}

export function HomeScrollRestorer() {
  useEffect(() => {
    const state = readHomeReturnState();
    if (!state || state.href !== getCurrentPath()) return;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: state.scrollY });
        window.sessionStorage.removeItem(HOME_RETURN_STATE_KEY);
      });
    });
  }, []);

  return null;
}

export function ArticleBackHomeLink({
  "aria-label": ariaLabel,
  className,
  children,
}: ArticleBackHomeLinkProps) {
  const router = useRouter();

  return (
    <Link
      href="/"
      aria-label={ariaLabel}
      className={className}
      onClick={(event) => {
        const href = getSavedHomeHref("/");
        if (href === "/") return;

        event.preventDefault();
        router.push(href);
      }}
    >
      {children}
    </Link>
  );
}

export function getSavedHomeHref(fallback = "/") {
  return readHomeReturnState()?.href ?? fallback;
}

export function saveHomeReturnState(articleId: string) {
  if (typeof window === "undefined") return;

  const state: HomeReturnState = {
    articleId,
    href: getCurrentPath(),
    scrollY: window.scrollY,
    savedAt: Date.now(),
  };

  window.sessionStorage.setItem(HOME_RETURN_STATE_KEY, JSON.stringify(state));
}

function readHomeReturnState(): HomeReturnState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(HOME_RETURN_STATE_KEY);
    if (!raw) return null;

    const state = JSON.parse(raw) as Partial<HomeReturnState>;
    if (
      typeof state.articleId !== "string" ||
      typeof state.href !== "string" ||
      typeof state.scrollY !== "number" ||
      typeof state.savedAt !== "number" ||
      Date.now() - state.savedAt > RETURN_STATE_MAX_AGE_MS
    ) {
      window.sessionStorage.removeItem(HOME_RETURN_STATE_KEY);
      return null;
    }

    return state as HomeReturnState;
  } catch {
    window.sessionStorage.removeItem(HOME_RETURN_STATE_KEY);
    return null;
  }
}

function getCurrentPath() {
  return `${window.location.pathname}${window.location.search}`;
}
