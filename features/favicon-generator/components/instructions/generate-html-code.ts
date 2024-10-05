const html = `<!-- Favicon in ICO format -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
  
<!-- Android Chrome Icons -->
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- Standard PNG Favicon Sizes -->
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">

<!-- Web App Manifest -->
<link rel="manifest" href="/site.webmanifest">
`;

export function generateHtmlCode() {
  return html;
}
