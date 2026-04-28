import { notFound } from "next/navigation";

import { ArticleScreen } from "@/components/article-screen";
import { getArticleDetail } from "@/lib/articles";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArticlePage({ params, searchParams }: ArticlePageProps) {
  const { id } = await params;
  const query = await searchParams;
  const article = await getArticleDetail(id);
  const selectedWordId = typeof query.word === "string" ? query.word : undefined;

  if (!article) {
    notFound();
  }

  return <ArticleScreen article={article} selectedWordId={selectedWordId} />;
}
