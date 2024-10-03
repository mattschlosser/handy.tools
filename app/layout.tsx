import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/core/navigation";
import ThemeProvider from "@/components/theme-provider";

const sansFont = Lexend({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Handy Tools",
  description: "Handy tools for everyday use",
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
      <body className={`${sansFont.variable} antialiased grow flex flex-col`}>
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
