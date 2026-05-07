"use client";

import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--surface)] px-6 py-10">
      <section className="w-full max-w-[420px] rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel)] p-6 text-center shadow-card">
        <p className="section-label">ERROR</p>
        <h1 className="mt-3 font-serif-jp text-[28px] font-bold text-[var(--ink)]">
          页面暂时没有加载成功
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          请再试一次；如果问题还在，可以先回到首页继续阅读。
        </p>
        {error.digest ? (
          <p className="mt-3 break-all text-xs text-[var(--muted-soft)]">ID: {error.digest}</p>
        ) : null}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-card"
          >
            <RotateCcw className="h-4 w-4" />
            重试
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--ink)]"
          >
            <Home className="h-4 w-4" />
            首页
          </Link>
        </div>
      </section>
    </main>
  );
}
