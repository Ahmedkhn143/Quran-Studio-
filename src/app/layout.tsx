import type { Metadata } from "next";
import {
  Inter,
  Amiri,
  Scheherazade_New,
  Noto_Nastaliq_Urdu,
  Noto_Naskh_Arabic,
  Noto_Sans,
} from "next/font/google";
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

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-naskh-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq-urdu",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
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
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Quran Studio — Free Online Quran Video Generator",
    description:
      "Create stunning Quran videos for YouTube, TikTok & Instagram — free in your browser.",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Quran Studio Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quran Studio — Free Online Quran Video Generator",
    description:
      "Create stunning Quran videos for YouTube, TikTok & Instagram — free in your browser.",
    images: ["/logo.png"],
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
        className={`${inter.variable} ${amiri.variable} ${scheherazade.variable} ${notoNaskhArabic.variable} ${notoNastaliqUrdu.variable} ${notoSans.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
