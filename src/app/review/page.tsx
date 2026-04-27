import { AppShell } from "@/components/app-shell";
import { ReviewScreen } from "@/components/review-screen";

type ReviewPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const query = (await searchParams) ?? {};
  const rawWord = query.word;
  const rawSide = query.side;
  const selectedWordId = Array.isArray(rawWord) ? rawWord[0] : rawWord;
  const side = Array.isArray(rawSide) ? rawSide[0] : rawSide;

  return (
    <AppShell activeTab="review">
      <ReviewScreen selectedWordId={selectedWordId} side={side} />
    </AppShell>
  );
}
