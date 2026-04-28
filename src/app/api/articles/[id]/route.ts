import { NextResponse } from "next/server";

import { getStandardizedArticleDetail } from "@/lib/articles";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const article = await getStandardizedArticleDetail(id);

  if (!article) {
    return NextResponse.json(
      {
        error: "Article not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(article);
}
