import { NextRequest, NextResponse } from "next/server";

import {
  articleCategories,
  articleChannels,
  listStandardizedArticles,
  type ArticleCategory,
  type ArticleChannel,
} from "@/lib/articles";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const channelParam = request.nextUrl.searchParams.get("channel");
  const categoryParam = request.nextUrl.searchParams.get("category");

  if (channelParam && !articleChannels.includes(channelParam as ArticleChannel)) {
    return NextResponse.json(
      {
        error: "Invalid channel",
        allowed: articleChannels,
      },
      { status: 400 },
    );
  }

  if (categoryParam && !articleCategories.includes(categoryParam as ArticleCategory)) {
    return NextResponse.json(
      {
        error: "Invalid category",
        allowed: articleCategories,
      },
      { status: 400 },
    );
  }

  const items = await listStandardizedArticles({
    channel: (channelParam as ArticleChannel | null) ?? undefined,
    category: (categoryParam as ArticleCategory | null) ?? undefined,
  });

  return NextResponse.json(items);
}
