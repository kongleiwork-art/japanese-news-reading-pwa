import type { CSSProperties } from "react";

import type { ArticleImage } from "@/lib/articles";

type ArticleImageLike = {
  image: ArticleImage;
  imageStyle: string;
};

export function buildArticleImageStyle(article: ArticleImageLike): CSSProperties {
  if (article.image.type === "remote") {
    return {
      backgroundImage: [
        "linear-gradient(180deg, rgba(36, 23, 13, 0.02), rgba(36, 23, 13, 0.22))",
        `url(${JSON.stringify(article.image.value)})`,
        article.imageStyle,
      ].join(", "),
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }

  return {
    background: article.imageStyle,
  };
}
