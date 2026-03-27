import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "棱镜 · 每日简报",
  description: "每日中国及全球市场简报",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "棱镜",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF8F0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
