import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "../components/Header";
import BackToTop from "../components/BackToTop";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://avdb.github.io/"),
  title: {
    template: "%s | AVDB",
    default: "AVDB｜AVデータベース",
  },
  description: "AV女優・作品・ジャンル・メーカーを検索できるAVデータベース。気になるAV作品を探そう。",
  openGraph: {
    siteName: "AVDB",
    title: "AVDB｜AVデータベース",
    description: "AV女優・作品・ジャンル・メーカーを検索できるAVデータベース。気になるAV作品を探そう。",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    site: "AVDB",
  },
  robots: { index: true, follow: true },
  icons: [
    {
      rel: "icon",
      type: "image/png",
      sizes: "96x96",
      url: "/favicon-96x96.png",
    },
    {
      rel: "icon",
      type: "image/x-icon",
      url: "/favicon.ico",
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: "/apple-touch-icon.png",
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
