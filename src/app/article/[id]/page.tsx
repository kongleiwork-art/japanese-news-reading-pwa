import { ArticleScreen } from "@/components/article-screen";
import { SavedArticleFallbackScreen } from "@/components/saved-article-fallback-screen";
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
  const showReadings = query.readings === "1";
  const returnHref = query.from === "saved" ? "/saved" : undefined;

  if (!article) {
    return (
      <SavedArticleFallbackScreen
        articleId={id}
        selectedWordId={selectedWordId}
        showReadings={showReadings}
        returnHref={returnHref}
      />
    );
  }

  return (
    <ArticleScreen
      article={article}
      selectedWordId={selectedWordId}
      showReadings={showReadings}
      returnHref={returnHref}
    />
  );
}
