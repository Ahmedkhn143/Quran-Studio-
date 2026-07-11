import type { Metadata } from "next";
import { Inter, Amiri, Scheherazade_New } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
});

const scheherazade = Scheherazade_New({
  variable: "--font-scheherazade",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Quran Studio — Free Online Quran Video Generator",
  description:
    "Create stunning Quran videos for YouTube, TikTok & Instagram — free in your browser. AI-generated backgrounds, 42 reciters, word-by-word highlight, 22 translations, MP4 export. No download required.",
  keywords: [
    "Quran video maker",
    "Quran video generator",
    "Islamic video creator",
    "Quran MP4",
    "Quran recitation video",
    "word by word Quran video",
    "free Quran tool",
    "Quran YouTube",
    "Quran TikTok",
    "Quran Instagram",
  ],
  authors: [{ name: "Quran Studio" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Quran Studio — Free Online Quran Video Generator",
    description:
      "Create stunning Quran videos for YouTube, TikTok & Instagram — free in your browser.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quran Studio — Free Online Quran Video Generator",
    description:
      "Create stunning Quran videos for YouTube, TikTok & Instagram — free in your browser.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${amiri.variable} ${scheherazade.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
