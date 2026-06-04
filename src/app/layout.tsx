import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GlowPlay - Premium Video Streaming & Sharing Platform",
  description: "Browse, stream, and share premium videos seamlessly. High-performance video player supporting YouTube, Vimeo, Dailymotion, and direct streams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
