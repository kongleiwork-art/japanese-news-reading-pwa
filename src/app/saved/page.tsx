import { AppShell } from "@/components/app-shell";
import { SavedArticlesScreen } from "@/components/saved-articles-screen";
import { listArticlePreviews } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const [easyArticles, originalArticles] = await Promise.all([
    listArticlePreviews({ channel: "easy" }),
    listArticlePreviews({ channel: "original" }),
  ]);

  return (
    <AppShell activeTab="me">
      <SavedArticlesScreen articles={[...easyArticles, ...originalArticles]} />
    </AppShell>
  );
}
