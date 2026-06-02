import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yupoo Style Album",
  description: "A minimal product album website for private client sharing."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
