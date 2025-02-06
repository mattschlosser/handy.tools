export const theme: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: "hsl(220, 14%, 71%)",
    background: "hsl(0, 0%, 6%)",
    textShadow: "0 1px rgba(0, 0, 0, 0.0)",
    fontFamily:
      'var(--font-mono), "Fira Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace',
    fontSize: "1em",
    lineHeight: "1.5",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    wordWrap: "normal",
    tabSize: 2,
    hyphens: "none",
  },
  'pre[class*="language-"]': {
    color: "hsl(220, 14%, 71%)",
    background: "hsl(0, 0%, 6%)",
    textShadow: "0 1px rgba(0, 0, 0, 0.0)",
    fontFamily:
      'var(--font-mono), "Fira Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace',
    fontSize: "1em",
    lineHeight: "1.5",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    wordWrap: "normal",
    tabSize: 2,
    hyphens: "none",
    padding: "1em",
    margin: "0",
    overflow: "auto",
    borderRadius: "0.3em",
  },
  ':not(pre) > code[class*="language-"]': {
    background: "hsl(0, 0%, 6%)",
    padding: "0.1em 0.3em",
    borderRadius: "0.3em",
    whiteSpace: "normal",
  },
  comment: {
    color: "hsl(220, 14%, 71%)", // Approximated from #5c6370
    fontStyle: "italic",
  },
  prolog: {
    color: "hsl(220, 10%, 40%)",
  },
  cdata: {
    color: "hsl(220, 10%, 40%)",
  },
  doctype: {
    color: "hsl(220, 14%, 71%)",
  },
  punctuation: {
    color: "hsl(220, 14%, 71%)", // From #abb2bf
  },
  entity: {
    color: "hsl(220, 14%, 71%)",
    cursor: "help",
  },
  "attr-name": {
    color: "hsl(29, 54%, 61%)", // From #E95678
  },
  "class-name": {
    color: "hsl(29, 54%, 61%)", // From #FAC29A
  },
  boolean: {
    color: "hsl(29, 54%, 61%)", // From #F09483
  },
  constant: {
    color: "hsl(29, 54%, 61%)", // From #F09483
  },
  number: {
    color: "hsl(29, 54%, 61%)", // From #F09483
  },
  atrule: {
    color: "hsl(29, 54%, 61%)", // From #B877DB
  },
  keyword: {
    color: "hsl(286, 60%, 67%)", // From #B877DB
  },
  property: {
    color: "hsl(355, 65%, 65%)", // From #E95678
  },
  tag: {
    color: "hsl(355, 65%, 65%)", // From #E95678
  },
  symbol: {
    color: "hsl(355, 65%, 65%)", // From #E95678
  },
  deleted: {
    color: "hsl(355, 65%, 65%)", // From #E95678
  },
  important: {
    color: "hsl(355, 65%, 65%)",
  },
  selector: {
    color: "hsl(95, 38%, 62%)", // From #89ca78
  },
  string: {
    color: "hsl(95, 38%, 62%)", // From #89ca78
  },
  char: {
    color: "hsl(95, 38%, 62%)", // From #89ca78
  },
  builtin: {
    color: "hsl(95, 38%, 62%)", // From #89ca78
  },
  inserted: {
    color: "hsl(95, 38%, 62%)", // From #89ca78
  },
  regex: {
    color: "hsl(95, 38%, 62%)", // From #89ca78
  },
  "attr-value": {
    color: "hsl(95, 38%, 62%)", // From #89ca78
  },
  variable: {
    color: "hsl(207, 82%, 66%)", // From #61afef
  },
  operator: {
    color: "hsl(207, 82%, 66%)", // From #25B0BC
  },
  function: {
    color: "hsl(207, 82%, 66%)", // From #61afef
  },
  url: {
    color: "hsl(187, 47%, 55%)", // Approximated
  },
  "attr-value > .token.punctuation": {
    color: "hsl(95, 38%, 62%)", // From #89ca78
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  namespace: {
    opacity: 0.8,
  },
};
