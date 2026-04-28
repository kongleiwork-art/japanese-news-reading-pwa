import { AppShell } from "@/components/app-shell";
import { HomeScreen } from "@/components/home-screen";
import {
  articleCategories,
  listArticlePreviews,
  type ArticleCategory,
  type ArticleChannel,
} from "@/lib/articles";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const channel = params.channel === "original" ? "original" : "easy";
  const categoryParam =
    typeof params.category === "string" ? params.category : articleCategories[0];
  const category = articleCategories.includes(categoryParam as ArticleCategory)
    ? (categoryParam as ArticleCategory)
    : articleCategories[0];
  const articles = await listArticlePreviews({
    channel: channel as ArticleChannel,
    category,
  });

  return (
    <AppShell activeTab="home">
      <HomeScreen
        channel={channel as ArticleChannel}
        category={category}
        articles={articles}
      />
    </AppShell>
  );
}
