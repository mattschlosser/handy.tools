import FaviconGenerator from "@/features/favicon-generator/favicon-generator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description:
    "A modern favicon generator for your website using the latest web standards with backwards compatibility",
  keywords: ["favicon", "generator", "icon", "web development", "design"],
};

export default function Dashboard() {
  return (
    <main className="grow mx-auto flex flex-col w-full p-4 md:p-6 max-w-screen-2xl md:max-h-[calc(100dvh-64px)]">
      <FaviconGenerator />
    </main>
  );
}
