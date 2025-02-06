import SvgMinifier from "@/features/svg-minifier/svg-minifier";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "SVG Minifier",
  description:
    "Minify your SVG and export it as a React or React Native component",
};

export default function SvgMinifierPage() {
  return (
    <main className="grow mx-auto flex flex-col w-full p-4 md:p-6 max-w-screen-2xl md:max-h-[calc(100dvh-64px)]">
      <SvgMinifier />
    </main>
  );
}
