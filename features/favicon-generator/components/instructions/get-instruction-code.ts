import { CodeOptions } from ".";

const jsx = (opts: CodeOptions) => `{/* Favicon in ICO format */}
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />

{/* Android Chrome Icons */}
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />

{/* Apple Touch Icon */}
<link rel="apple-touch-icon" type="image/png" href="/apple-touch-icon.png" />

{/* Standard PNG Favicon Sizes */}
<link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
<link rel="icon" type="image/png" sizes="48x48" href="/icon-48x48.png" />

{/* Microsoft Tiles */}
<meta name="msapplication-TileColor" content="${opts.backgroundColor}" />
<meta name="msapplication-TileImage" content="/mstile-256x256.png" />

{/* Theme Color */}
<meta name="theme-color" content="${opts.themeColor}" />

{/* Web App Manifest */}
<link rel="manifest" href="/site.webmanifest" />
`;

const html = (opts: CodeOptions) => `<!-- Favicon in ICO format -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">
  
<!-- Android Chrome Icons -->
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" type="image/png" href="/apple-touch-icon.png">

<!-- Standard PNG Favicon Sizes -->
<link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/icon-48x48.png">

<!-- Microsoft Tiles -->
<meta name="msapplication-TileColor" content="${opts.backgroundColor}">
<meta name="msapplication-TileImage" content="/mstile-256x256.png">

<!-- Theme Color -->
<meta name="theme-color" content="${opts.themeColor}">

<!-- Web App Manifest -->
<link rel="manifest" href="/site.webmanifest">
`;

const nextjs = (
  opts: CodeOptions
) => `import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  // ... Other metadata
  manifest: "/site.webmanifest",
  icons: [
    {
      url: "/favicon.ico",
      rel: "icon",
      type: "image/x-icon",
    },
    {
      url: '/favicon.ico',
      rel: 'shortcut icon',
      type: 'image/x-icon'
    },
    {
      url: "/icon-16x16.png",
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
    },
    {
      url: "/icon-32x32.png",
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
    },
        {
      url: "/icon-48x48.png",
      rel: "icon",
      type: "image/png",
      sizes: "48x48",
    },
    {
      url: "/icon-192x192.png",
      rel: "icon",
      type: "image/png",
      sizes: "192x192",
    },
    {
      url: "/icon-512x512.png",
      rel: "icon",
      type: "image/png",
      sizes: "512x512",
    },
    {
      url: "/apple-touch-icon.png",
      rel: "apple-touch-icon",
      type: "image/png",
    },
  ],
  other: {
    "msapplication-TileColor": "${opts.backgroundColor}",
    "msapplication-TileImage": "/mstile-256x256.png",
  },
};

export const viewport: Viewport = {
  themeColor: "${opts.themeColor}",
};
`;

export const getInstructionCode = (
  type: "html" | "jsx" | "nextjs",
  opts: CodeOptions
): string => {
  switch (type) {
    case "html":
      return html(opts);
    case "jsx":
      return jsx(opts);
    case "nextjs":
      return nextjs(opts);
    default:
      return "";
  }
};
