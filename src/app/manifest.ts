import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "轻读日语",
    short_name: "轻读日语",
    description: "中文用户通过最新日语新闻学习日语的轻量 PWA",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f4ec",
    theme_color: "#f8f4ec",
    lang: "ja",
  };
}
