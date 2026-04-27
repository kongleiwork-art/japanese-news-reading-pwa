import { AppShell } from "@/components/app-shell";
import { HomeScreen } from "@/components/home-screen";
import { categories, type Category, type Channel } from "@/lib/data";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const channel = params.channel === "original" ? "original" : "easy";
  const categoryParam = typeof params.category === "string" ? params.category : categories[0];
  const category = categories.includes(categoryParam as Category)
    ? (categoryParam as Category)
    : categories[0];

  return (
    <AppShell activeTab="home">
      <HomeScreen channel={channel as Channel} category={category} />
    </AppShell>
  );
}
