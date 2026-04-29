import { NextResponse } from "next/server";

import { getArticlePipelineHealth, listStandardizedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await listStandardizedArticles();

  return NextResponse.json(getArticlePipelineHealth());
}
