import * as cheerio from 'cheerio';
import fetchFaviconHeaders from "./fetch-content-type";

export interface MetaTag {
  tag: string; // e.g., 'link', 'meta'
  attributes: { [key: string]: string };
}

export interface VerificationResult {
  success: boolean;
  message: string;
  metaTags: MetaTag[];
  errors: string[];
}

interface RequiredMetaTag {
  tag: string; // e.g., 'link', 'meta'
  attributes: { [key: string]: string }; // e.g., { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  errorMessage: string;
}

const requiredMetaTags: RequiredMetaTag[] = [
  {
    tag: "link",
    attributes: {
      rel: "icon",
      type: "image/x-icon",
      href: "/favicon.ico",
    },
    errorMessage:
      'Missing favicon: <link rel="icon" type="image/x-icon" href="/favicon.ico">',
  },
  {
    tag: "link",
    attributes: {
      rel: "icon",
      type: "image/png",
      sizes: "192x192",
      href: "/android-chrome-192x192.png",
    },
    errorMessage:
      'Missing Android Chrome favicon: <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">',
  },
  {
    tag: "link",
    attributes: {
      rel: "icon",
      type: "image/png",
      sizes: "512x512",
      href: "/android-chrome-512x512.png",
    },
    errorMessage:
      'Missing Android Chrome favicon: <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">',
  },
  {
    tag: "link",
    attributes: {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: "/apple-touch-icon.png",
    },
    errorMessage:
      'Missing Apple Touch Icon: <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
  },
  {
    tag: "link",
    attributes: {
      rel: "manifest",
      href: "/site.webmanifest",
    },
    errorMessage:
      'Missing Web App Manifest: <link rel="manifest" href="/site.webmanifest">',
  },
  // Future meta tags can be added here
];

export const parseMeta = async (
  html: string,
  baseUrl: string
): Promise<VerificationResult> => {
  const $ = cheerio.load(html);

  // Array to hold all parsed meta tags
  const metaTags: MetaTag[] = [];

  // Select all meta tags that could be required
  // Adjust the selector based on the types of meta tags you plan to verify
  const selectors = requiredMetaTags.map((meta) => {
    const attrSelectors = Object.entries(meta.attributes)
      .map(([key, value]) => `[${key}="${value}"]`)
      .join("");
    return `${meta.tag}${attrSelectors}`;
  });

  const combinedSelector = selectors.join(", ");

  const matchedElements = $(combinedSelector);

  matchedElements.each((_, elem) => {
    const tagEl = $(elem).get(0);
    if (!tagEl) return;
    if (tagEl.type !== "tag") return;
    const tag = tagEl.tagName.toLowerCase();
    const attributes: { [key: string]: string } = {};
    const attribs = $(elem).attr();
    if (attribs) {
      Object.keys(attribs).forEach((attr) => {
        attributes[attr] = attribs[attr];
      });
    }
    metaTags.push({ tag, attributes });
  });

  // Initialize the Verification Result
  const verificationResult: VerificationResult = {
    success: true,
    message: "All required meta tags are present and correctly formatted.",
    metaTags,
    errors: [],
  };

  // Iterate over required meta tags and check their presence
  for (const required of requiredMetaTags) {
    const { tag, attributes, errorMessage } = required;

    // Find matching meta tag in the parsed metaTags
    const match = metaTags.find((meta) => {
      if (meta.tag.toLowerCase() !== tag.toLowerCase()) return false;

      // Check all required attributes
      return Object.entries(attributes).every(([key, value]) => {
        const metaValue = meta.attributes[key];
        if (!metaValue) return false;
        // For href attributes, handle relative URLs
        if (key === "href") {
          try {
            const urlObj = new URL(metaValue, baseUrl);
            return urlObj.pathname.toLowerCase().endsWith(value.toLowerCase());
          } catch {
            return metaValue.toLowerCase().endsWith(value.toLowerCase());
          }
        }
        return metaValue.toLowerCase() === value.toLowerCase();
      });
    });

    if (!match) {
      // If meta tag is missing, add the specific error message
      verificationResult.errors.push(errorMessage);
    } else {
      // If meta tag exists, perform additional validations if necessary
      // For example, validating MIME types for favicon links
      if (
        tag.toLowerCase() === "link" &&
        attributes["rel"] === "icon" &&
        attributes["type"]
      ) {
        const absoluteUrl = new URL(attributes["href"], baseUrl).href;
        const mimeType = await fetchFaviconHeaders(absoluteUrl);
        if (!mimeType) {
          verificationResult.errors.push(
            `Unable to verify MIME type for favicon: <link rel="${attributes["rel"]}" type="${attributes["type"]}" href="${attributes["href"]}">`
          );
        } else if (
          mimeType.toLowerCase() !== attributes["type"].toLowerCase()
        ) {
          verificationResult.errors.push(
            `Incorrect MIME type for favicon <link rel="${attributes["rel"]}" href="${attributes["href"]}">: Expected "${attributes["type"]}", got "${mimeType}"`
          );
        }
      }
    }
  }

  // Update the success flag and message based on errors
  if (verificationResult.errors.length > 0) {
    verificationResult.success = false;
    verificationResult.message =
      "Some required meta tags are missing or incorrectly formatted.";
  }

  return verificationResult;
};
