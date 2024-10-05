import fetchContentHeaders from "@/lib/fetch-content-type";
import * as cheerio from "cheerio";

export interface MetaTag {
  tag: string;
  attributes: { [key: string]: string };
}

export interface MetaTagResult {
  tag: string;
  attributes: { [key: string]: string };
  title: string;
  description: string;
  found: boolean;
  errors: string[];
}

export interface VerificationResult {
  success: boolean;
  message: string;
  metaTags: MetaTagResult[];
}

type RequiredMetaTag = {
  tag: string;
  title: string;
  description: string;
} & (
  | { attributes: MetaTagAttributes }
  | { oneOf: { attributes: MetaTagAttributes }[] }
);

interface MetaTagAttributes {
  [key: string]: string;
}

class MetaVerifierService {
  private requiredMetaTags: RequiredMetaTag[] = [
    {
      title: "Page Title",
      tag: "title",
      description:
        "The page title is displayed in the browser tab and search engine results. It should be concise, descriptive, and include relevant keywords to improve SEO and user engagement.",
      attributes: {},
    },
    {
      title: "Meta Description",
      tag: "meta",
      attributes: {
        name: "description",
      },
      description:
        "The meta description provides a brief summary of the page content. It's displayed in search engine results and can influence click-through rates. A well-crafted description can improve SEO and user engagement.",
    },
    {
      title: "Viewport Meta Tag",
      tag: "meta",
      attributes: {
        name: "viewport",
      },
      description:
        "The viewport meta tag ensures that the page is displayed correctly on mobile devices by setting the viewport width and scaling. It's essential for responsive web design and provides a better user experience on mobile devices.",
    },
    {
      title: "Charset Meta Tag",
      tag: "meta",
      attributes: {
        charset: "utf-8",
      },
      description:
        "The charset meta tag specifies the character encoding for the HTML document. Using UTF-8 ensures compatibility with a wide range of characters and languages, improving accessibility and internationalization.",
    },
    {
      title: "Robots Meta Tag",
      tag: "meta",
      attributes: {
        name: "robots",
      },
      description:
        "The robots meta tag provides instructions to search engine crawlers on how to index and follow links on the page. Common directives include 'index, follow' to allow indexing and link following, or 'noindex, nofollow' to prevent it.",
    },
    {
      title: "Open Graph Title",
      tag: "meta",
      attributes: {
        property: "og:title",
      },
      description:
        "The Open Graph title is used by social media platforms when sharing a link to your site. It should be concise, engaging, and include relevant keywords to attract users and improve click-through rates on social media.",
    },
    {
      title: "Open Graph Description",
      tag: "meta",
      attributes: {
        property: "og:description",
      },
      description:
        "The Open Graph description provides a summary of the page content when shared on social media. It should be compelling, informative, and encourage users to click through to your site.",
    },
    {
      title: "Open Graph Image",
      tag: "meta",
      attributes: {
        property: "og:image",
      },
      description:
        "The Open Graph image is displayed alongside shared links on social media. It should be visually appealing, relevant to the content, and meet the recommended dimensions for optimal display on various platforms.",
    },
    {
      title: "Open Graph Type",
      tag: "meta",
      attributes: {
        property: "og:type",
        content: "website",
      },
      description:
        "The Open Graph type meta tag defines the type of content being shared, such as 'website', 'article', 'video', etc. Specifying the correct type enhances how your content is displayed on social platforms.",
    },
    {
      title: "Twitter Title",
      tag: "meta",
      attributes: {
        name: "twitter:title",
      },
      description:
        "The Twitter title is used when sharing a link to your site on Twitter. It should be concise, engaging, and include relevant keywords to attract users and improve click-through rates on the platform.",
    },
    {
      title: "Twitter Description",
      tag: "meta",
      attributes: {
        name: "twitter:description",
      },
      description:
        "The Twitter description provides a summary of the page content when shared on Twitter. It should be compelling, informative, and encourage users to click through to your site.",
    },
    {
      title: "Meta Keywords",
      tag: "meta",
      attributes: {
        name: "keywords",
      },
      description:
        "The meta keywords tag lists relevant keywords for the page content. Although not heavily used by major search engines for ranking, it can still provide contextual information and support niche search engines.",
    },
    {
      title: "Favicon",
      tag: "link",
      oneOf: [
        {
          attributes: {
            rel: "icon",
            type: "image/x-icon",
            href: "/favicon.ico",
          },
        },
        {
          attributes: {
            rel: "icon",
            type: "image/vnd.microsoft.icon",
            href: "/favicon.ico",
          },
        },
        {
          attributes: {
            rel: "shortcut icon",
            href: "/favicon.ico",
          }
        }
      ],
      description:
        "The site favicon is crucial for brand recognition. It appears in browser tabs, bookmarks, and history, helping users quickly identify your site. Support for multiple formats ensures compatibility across different browsers and devices.",
    },
    {
      title: "Shortcut Icon",
      tag: "link",
      attributes: {
        rel: "shortcut icon",
        href: "/favicon.ico",
      },
      description:
        'The Shortcut Icon link rel is a legacy method for specifying favicons. Including it ensures compatibility with older browsers that may not recognize the newer rel="icon" syntax.',
    },
    {
      title: "16x16 PNG or SVG Icon",
      tag: "link",
      oneOf: [
        {
          attributes: {
            rel: "icon",
            type: "image/png",
            sizes: "16x16",
          },
        },
        {
          attributes: {
            rel: "icon",
            type: "image/svg+xml",
          },
        },
      ],
      description:
        "A 16x16 favicon is important for older browsers and systems that don't support scalable formats. It provides a crisp, small icon for situations where space is limited, such as in browser tabs or address bars.",
    },
    {
      title: "32x32 PNG or SVG Icon",
      tag: "link",
      oneOf: [
        {
          attributes: {
            rel: "icon",
            type: "image/png",
            sizes: "32x32",
          },
        },
        {
          attributes: {
            rel: "icon",
            type: "image/svg+xml",
          },
        },
      ],
      description:
        "A 32x32 offers better quality on high-DPI displays and is useful for bookmarks and other UI elements where a slightly larger icon is beneficial. It provides a good balance between size and detail.",
    },
    {
      title: "192x192 Android Chrome Icon",
      tag: "link",
      attributes: {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
      },
      description:
        "This larger icon is used by Android devices when a user adds your website to their home screen. It ensures your site's icon looks crisp and clear on high-resolution mobile displays, enhancing the mobile user experience.",
    },
    {
      title: "512x512 Android Chrome Icon",
      tag: "link",
      attributes: {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
      },
      description:
        "The 512x512 icon serves as a master icon for Android devices. It's used to generate smaller icons as needed and ensures your site icon looks great on large, high-resolution displays or when used in Android's overview screen.",
    },
    {
      title: "Apple Touch Icon 180x180",
      tag: "link",
      attributes: {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      description:
        "The Apple Touch Icon is used when iOS users add your website to their home screen. It ensures your site has a high-quality, recognizable icon on Apple devices, improving the user experience for iOS users and maintaining brand consistency.",
    },
    {
      title: "(Optional) Apple Touch Icon 120x120",
      tag: "link",
      attributes: {
        rel: "apple-touch-icon",
        sizes: "120x120",
      },
      description:
        "An additional Apple Touch Icon at 120x120 pixels ensures optimal display on devices with different screen resolutions, providing a sharper and more consistent appearance across all Apple devices.",
    },
    {
      title: "Microsoft Tile Image",
      tag: "meta",
      attributes: {
        name: "msapplication-TileImage",
      },
      description:
        "The Microsoft Tile Image meta tag specifies the image used for your site's tile when pinned to the Windows Start menu. Providing a high-resolution tile ensures clarity and brand recognition.",
    },
    {
      title: "Microsoft Tile Color",
      tag: "meta",
      attributes: {
        name: "msapplication-TileColor",
      },
      description:
        "The Microsoft Tile Color meta tag sets the background color of your site's tile when pinned to the Windows Start menu. It enhances the visual appeal of your site and provides a more cohesive user experience for Windows users.",
    },
    {
      title: "Theme Color",
      tag: "meta",
      attributes: {
        name: "theme-color",
      },
      description:
        "The theme color meta tag sets the color of the browser's UI elements, such as the address bar on mobile browsers. This enhances the visual integration of your website with the browser, providing a more cohesive and branded user experience.",
    },
    {
      title: "Web App Manifest",
      tag: "link",
      oneOf: [
        {
          attributes: {
            rel: "manifest",
            href: "/site.webmanifest",
          },
        },
        {
          attributes: {
            rel: "manifest",
            href: "/manifest.json",
          },
        },
      ],
      description:
        "The Web App Manifest is a JSON file that provides information about your web application. It's crucial for enabling 'Add to Home Screen' functionality on mobile devices, allowing your website to be installed as a Progressive Web App (PWA). This improves user engagement and provides a more app-like experience.",
    },
  ];

  async parseMeta(html: string, baseUrl: string): Promise<VerificationResult> {
    const $ = cheerio.load(html);
    const foundMetaTags: MetaTag[] = [];

    const selectors = this.requiredMetaTags.flatMap((meta) => {
      if ("attributes" in meta) {
        return this.createSelector(meta.tag, meta.attributes);
      } else if ("oneOf" in meta) {
        return meta.oneOf.map((option) =>
          this.createSelector(meta.tag, option.attributes)
        );
      }
      return [];
    });

    const combinedSelector = selectors.join(", ");
    const matchedElements = $(combinedSelector);

    matchedElements.each((_, elem) => {
      const tagEl = $(elem).get(0);
      if (!tagEl || tagEl.type !== "tag") return;
      const tag = tagEl.tagName.toLowerCase();
      const attributes: { [key: string]: string } = {};
      const attribs = $(elem).attr();
      if (attribs) {
        Object.keys(attribs).forEach((attr) => {
          attributes[attr] = attribs[attr];
        });
      }
      foundMetaTags.push({ tag, attributes });
    });

    const verificationResult: VerificationResult = {
      success: true,
      message: "All required meta tags are present and correctly formatted.",
      metaTags: [],
    };

    for (const required of this.requiredMetaTags) {
      const { tag, title, description } = required;
      let match: MetaTag | undefined;

      if ("attributes" in required) {
        match = this.findMatchingMetaTag(
          foundMetaTags,
          tag,
          required.attributes,
          baseUrl
        );
      } else if ("oneOf" in required) {
        for (const option of required.oneOf) {
          match = this.findMatchingMetaTag(
            foundMetaTags,
            tag,
            option.attributes,
            baseUrl
          );
          if (match) break;
        }
      }

      const metaTagResult: MetaTagResult = {
        tag,
        attributes: match ? match.attributes : {},
        title,
        description,
        found: !!match,
        errors: match ? [] : [`${title} is missing.`],
      };

      verificationResult.metaTags.push(metaTagResult);

      if (match) {
        const mimeError = await this.validateMimeType(match, baseUrl);
        if (mimeError) {
          metaTagResult.errors.push(mimeError);
        }
      }
    }

    verificationResult.success = verificationResult.metaTags.every(
      (tag) => tag.errors.length === 0
    );
    if (!verificationResult.success) {
      verificationResult.message =
        "Some required meta tags are missing or incorrectly formatted.";
    }

    // Not found go first, then by error count, then found with no errors
    const sortedMetaTags = verificationResult.metaTags.sort((a, b) => {
      const aScore = a.found ? (a.errors.length ? 1 : 2) : 0;
      const bScore = b.found ? (b.errors.length ? 1 : 2) : 0;
      if (aScore !== bScore) return aScore - bScore;
      return 0;
    });

    return {
      ...verificationResult,
      metaTags: sortedMetaTags,
    };
  }

  private createSelector(tag: string, attributes: MetaTagAttributes): string {
    const attrSelectors = Object.entries(attributes)
      .map(([key, value]) => `[${key}="${value}"]`)
      .join("");
    return `${tag}${attrSelectors}`;
  }

  private findMatchingMetaTag(
    metaTags: MetaTag[],
    tag: string,
    attributes: MetaTagAttributes,
    baseUrl: string
  ): MetaTag | undefined {
    return metaTags.find((meta) => {
      if (meta.tag.toLowerCase() !== tag.toLowerCase()) return false;
      return Object.entries(attributes).every(([key, value]) => {
        const metaValue = meta.attributes[key];
        if (!metaValue) return false;
        if (key === "href") {
          return this.compareHref(metaValue, value, baseUrl);
        }
        return metaValue.toLowerCase() === value.toLowerCase();
      });
    });
  }

  private compareHref(
    metaValue: string,
    value: string,
    baseUrl: string
  ): boolean {
    try {
      const urlObj = new URL(metaValue, baseUrl);
      return urlObj.pathname.toLowerCase().endsWith(value.toLowerCase());
    } catch {
      return metaValue.toLowerCase().endsWith(value.toLowerCase());
    }
  }

  private async validateMimeType(
    metaTag: MetaTag,
    baseUrl: string
  ): Promise<string | null> {
    const { tag, attributes } = metaTag;
    if (
      tag.toLowerCase() === "link" &&
      attributes["rel"] === "icon" &&
      attributes["type"]
    ) {
      const absoluteUrl = new URL(attributes["href"], baseUrl).href;
      const mimeType = await fetchContentHeaders(absoluteUrl);
      if (!mimeType) {
        return `Unable to verify MIME type for icon.`;
      } else if (mimeType.toLowerCase() !== attributes["type"].toLowerCase()) {
        // Exception for .ICO files
        if (
          mimeType === "image/vnd.microsoft.icon" &&
          attributes["type"] === "image/x-icon"
        ) {
          return null;
        }
        return `Incorrect MIME type for icon. Expected "${attributes["type"]}", got "${mimeType}"`;
      }
    }
    return null;
  }
}

export default MetaVerifierService;
