import { AppShell } from "@/components/app-shell";
import { WordsScreen } from "@/components/words-screen";

type WordsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WordsPage({ searchParams }: WordsPageProps) {
  const params = await searchParams;
  const selectedWordId = typeof params.word === "string" ? params.word : undefined;

  return (
    <AppShell activeTab="words">
      <WordsScreen selectedWordId={selectedWordId} />
    </AppShell>
  );
}
