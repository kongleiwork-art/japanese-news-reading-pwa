import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "轻读日语",
  description: "中文用户通过新闻进入真实日语的轻量 PWA 原型",
  applicationName: "轻读日语",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "轻读日语",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f4ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
