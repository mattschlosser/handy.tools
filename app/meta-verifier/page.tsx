import MetaVerifier from "@/features/meta-verifier/meta-verifier";

import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "Verify and analyze meta tags for your website to improve SEO",
  keywords: ["meta tags", "SEO", "verification", "analysis", "web development"],
};

export default function MetaVerifierPage() {
  return (
    <main className="grow mx-auto flex flex-col w-full p-4 md:p-6 max-w-screen-2xl md:max-h-[calc(100dvh-64px)]">
      <MetaVerifier />
    </main>
  );
}
