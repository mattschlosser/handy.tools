import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import localFont from "next/font/local";
import { Navigation } from "@/components/core/navigation";
import ThemeProvider from "@/components/theme-provider";

import "./globals.css";

const sansFont = Lexend({
  variable: "--font-sans",
  subsets: ["latin"],
});

const monoFont = localFont({
  variable: "--font-mono",
  src: "/fonts/CascadiaCode.woff2",
});

export const metadata: Metadata = {
  title: "Handy Tools",
  description: "Tools for developers",
  icons: [
    {
      url: "/favicon.ico",
      rel: "icon",
      type: "image/x-icon",
    },
    {
      url: "/android-chrome-192x192.png",
      rel: "icon",
      type: "image/png",
      sizes: "192x192",
    },
    {
      url: "/android-chrome-512x512.png",
      rel: "icon",
      type: "image/png",
      sizes: "512x512",
    },
    {
      url: "/apple-touch-icon.png",
      rel: "apple-touch-icon",
      sizes: "180x180",
    },
    {
      url: "/favicon-16x16.png",
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
    },
    {
      url: "/favicon-32x32.png",
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
    },
    {
      url: "/site.webmanifest",
      rel: "manifest",
    },
  ],
  openGraph: {
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Handy Tools",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className="min-h-screen flex flex-col"
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`${sansFont.variable} ${monoFont.variable} antialiased grow flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navigation />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
