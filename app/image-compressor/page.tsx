import ImageCompressor from "@/features/image-compression/image-compressor";

import type { Metadata } from "next";

export const metadata: Metadata = {
  description:
    "Compress and convert images between JPEG, PNG, WEBP, AVIF, and JXL formats",
  keywords: [
    "image compression online",
    "image optimization",
    "jpeg compression",
    "png compression",
    "webp compression",
    "avif compression",
    "jxl compression",
  ],
};

export default function Dashboard() {
  return (
    <main className="grow mx-auto flex flex-col w-full p-4 md:p-6 max-w-screen-2xl md:max-h-[calc(100dvh-64px)]">
      <ImageCompressor />
    </main>
  );
}
