"use client";

import React from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { funky } from "react-syntax-highlighter/dist/esm/styles/prism";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import js from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import { cn } from "@/lib/utils";
import { theme } from "./theme";

SyntaxHighlighter.registerLanguage("js", js);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("markup", markup);

type CodeProps = {
  code: string;
  className?: string;
  language?: string;
};

export function CodeHighlight({ code, language = "js", className }: CodeProps) {
  return (
    <SyntaxHighlighter
      language={language}
      style={theme}
      className={cn("relative", className)}
    >
      {code}
    </SyntaxHighlighter>
  );
}
