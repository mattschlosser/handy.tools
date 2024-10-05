const nextjs = `import type { Metadata } from "next";

export const metadata: Metadata = {
  // ... Your other meta tags
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
  ]
};`;

export function generateNextJsCode() {
  return nextjs;
}
