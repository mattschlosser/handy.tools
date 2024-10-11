import * as cheerio from "cheerio";
import fetchContentHeaders from "@/lib/fetch-content-type";
import fetchHtml from "@/lib/fetch-html";

interface MetaTag {
  tag: string;
  attributes: { [key: string]: string };
}

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
}

interface Manifest {
  name?: string;
  short_name?: string;
  theme_color?: string;
  background_color?: string;
  icons?: ManifestIcon[];
  start_url?: string;
  display?: string;
  [key: string]: unknown; // For any additional fields
}

interface CheckResult {
  errors: string[];
  successes: string[];
}

interface ValidationRule<T> {
  title: string;
  description: string;
  check: (data: T, baseUrl: string) => Promise<CheckResult>;
}

export interface RuleValidationResult {
  title: string;
  description: string;
  errors: string[];
  successes: string[];
}

export interface ValidationResult {
  metaTags: RuleValidationResult[];
  manifest: RuleValidationResult[] | null;
}

class MetaValidatorService {
  private metaTagRules: ValidationRule<MetaTag[]>[];
  private manifestRules: ValidationRule<Manifest>[];

  constructor() {
    this.metaTagRules = [
      {
        title: "Page Title",
        description: "Checks if the page has a title tag",
        check: async (data: MetaTag[]) => {
          if (data.some((tag) => tag.tag === "title")) {
            return { errors: [], successes: ["Page title is present"] };
          } else {
            return { errors: ["Page title is missing"], successes: [] };
          }
        },
      },
      {
        title: "Meta Description",
        description: "Checks if the page has a meta description",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) =>
                tag.tag === "meta" && tag.attributes.name === "description"
            )
          ) {
            return { errors: [], successes: ["Meta description is present"] };
          } else {
            return { errors: ["Meta description is missing"], successes: [] };
          }
        },
      },
      {
        title: "Language Meta Tag",
        description: "Checks if the page has a language meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) => tag.tag === "html" && tag.attributes.lang?.length > 0
            )
          ) {
            return { errors: [], successes: ["Language meta tag is present"] };
          } else {
            return { errors: ["Language meta tag is missing"], successes: [] };
          }
        },
      },
      {
        title: "Viewport Meta Tag",
        description: "Checks if the page has a viewport meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) => tag.tag === "meta" && tag.attributes.name === "viewport"
            )
          ) {
            return { errors: [], successes: ["Viewport meta tag is present"] };
          } else {
            return { errors: ["Viewport meta tag is missing"], successes: [] };
          }
        },
      },
      {
        title: "Charset Meta Tag",
        description: "Checks if the page has a charset meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) => tag.tag === "meta" && tag.attributes.charset === "utf-8"
            )
          ) {
            return { errors: [], successes: ["Charset meta tag is present"] };
          } else {
            return { errors: ["Charset meta tag is missing"], successes: [] };
          }
        },
      },
      {
        title: "Robots Meta Tag",
        description: "Checks if the page has a robots meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) => tag.tag === "meta" && tag.attributes.name === "robots"
            )
          ) {
            return { errors: [], successes: ["Robots meta tag is present"] };
          } else {
            return { errors: ["Robots meta tag is missing"], successes: [] };
          }
        },
      },
      {
        title: "Theme Color Meta Tag",
        description: "Checks if the page has a theme color meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) =>
                tag.tag === "meta" && tag.attributes.name === "theme-color"
            )
          ) {
            return {
              errors: [],
              successes: ["Theme color meta tag is present"],
            };
          } else {
            return {
              errors: ["Theme color meta tag is missing"],
              successes: [],
            };
          }
        },
      },
      {
        title: "Open Graph Title",
        description: "Checks if the page has an Open Graph title meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) =>
                tag.tag === "meta" && tag.attributes.property === "og:title"
            )
          ) {
            return { errors: [], successes: ["Open Graph title is present"] };
          } else {
            return { errors: ["Open Graph title is missing"], successes: [] };
          }
        },
      },
      {
        title: "Open Graph Description",
        description:
          "Checks if the page has an Open Graph description meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) =>
                tag.tag === "meta" &&
                tag.attributes.property === "og:description"
            )
          ) {
            return {
              errors: [],
              successes: ["Open Graph description is present"],
            };
          } else {
            return {
              errors: ["Open Graph description is missing"],
              successes: [],
            };
          }
        },
      },
      {
        title: "Open Graph Image",
        description: "Checks if the page has an Open Graph image meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) =>
                tag.tag === "meta" && tag.attributes.property === "og:image"
            )
          ) {
            return { errors: [], successes: ["Open Graph image is present"] };
          } else {
            return { errors: ["Open Graph image is missing"], successes: [] };
          }
        },
      },
      {
        title: "Open Graph Title",
        description: "Checks if the page has an Open Graph title meta tag",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) =>
                tag.tag === "meta" && tag.attributes.property === "og:title"
            )
          ) {
            return { errors: [], successes: ["Open Graph title is present"] };
          } else {
            return { errors: ["Open Graph title is missing"], successes: [] };
          }
        },
      },
      {
        title: "ICO Favicon",
        description:
          "Checks if has a an .ICO favicon which is required for compatibility with older browsers.",
        check: async (data: MetaTag[], baseUrl: string) => {
          const result: CheckResult = {
            errors: [],
            successes: [],
          };

          const iconTag = data.find(
            (tag) =>
              tag.tag === "link" &&
              tag.attributes.rel === "icon" &&
              tag.attributes?.href?.endsWith(".ico")
          );

          if (!iconTag) {
            result.errors.push("ICO Favicon is missing");
            return result;
          }

          const href = this.resolveUrl(baseUrl, iconTag.attributes.href);
          const expectedType = "image/x-icon";
          const iconValidationResult = await this.validateIcon(
            href,
            expectedType
          );
          result.errors.push(...iconValidationResult.errors);
          result.successes.push(...iconValidationResult.successes);
          return result;
        },
      },
      {
        title: "Favicon",
        description: "Checks if the page has a favicon with a valid MIME type.",
        check: async (data: MetaTag[], baseUrl: string) => {
          const result: CheckResult = {
            errors: [],
            successes: [],
          };
          const iconTag = data.find(
            (tag) =>
              tag.tag === "link" &&
              (tag.attributes.rel === "icon" ||
                tag.attributes.rel === "shortcut icon") &&
              ["image/x-icon", "image/png", "image/svg+xml"].includes(
                tag.attributes.type
              )
          );
          if (!iconTag) {
            result.errors.push("Favicon is missing");
            return result;
          }
          const href = this.resolveUrl(baseUrl, iconTag.attributes.href);
          const expectedType = iconTag.attributes.type;
          const iconValidationResult = await this.validateIcon(
            href,
            expectedType
          );
          result.errors.push(...iconValidationResult.errors);
          result.successes.push(...iconValidationResult.successes);
          return result;
        },
      },
      {
        title: "48x48 PNG Favicon",
        description:
          "Checks if the page has a 48x48 PNG favicon for better quality on high-DPI displays.",
        check: async (data: MetaTag[], baseUrl: string) => {
          const result: CheckResult = {
            errors: [],
            successes: [],
          };
          const iconTag = data.find(
            (tag) =>
              tag.tag === "link" &&
              tag.attributes.rel === "icon" &&
              tag.attributes.type === "image/png" &&
              tag.attributes.sizes === "48x48"
          );
          if (!iconTag) {
            return { errors: ["48x48 PNG Favicon is missing"], successes: [] };
          }
          const href = this.resolveUrl(baseUrl, iconTag.attributes.href);
          const expectedType = "image/png";
          const iconValidationResult = await this.validateIcon(
            href,
            expectedType
          );
          result.errors.push(...iconValidationResult.errors);
          result.successes.push(...iconValidationResult.successes);
          return result;
        },
      },
      {
        title: "Shortcut Icon",
        description:
          "Checks if the page has a shortcut icon link rel which is a legacy method for specifying favicons.",
        check: async (data: MetaTag[], baseUrl: string) => {
          const result: CheckResult = {
            errors: [],
            successes: [],
          };
          const iconTag = data.find(
            (tag) =>
              tag.tag === "link" && tag.attributes.rel === "shortcut icon"
          );
          if (!iconTag) {
            result.errors.push("Shortcut Icon is missing");
            return result;
          }
          const href = this.resolveUrl(baseUrl, iconTag.attributes.href);
          const expectedType = iconTag.attributes.type;
          const iconValidationResult = await this.validateIcon(
            href,
            expectedType
          );
          result.errors.push(...iconValidationResult.errors);
          result.successes.push(...iconValidationResult.successes);
          return result;
        },
      },
      {
        title: "Apple Touch Icon",
        description:
          "Checks if the page has an Apple Touch Icon which is used when iOS users add your website to their home screen.",
        check: async (data: MetaTag[], baseUrl: string) => {
          const result: CheckResult = {
            errors: [],
            successes: [],
          };
          const iconTag = data.find(
            (tag) =>
              tag.tag === "link" &&
              tag.attributes.rel === "apple-touch-icon" &&
              tag.attributes.href
          );
          if (!iconTag) {
            result.errors.push("Apple Touch Icon is missing");
            return result;
          }
          const href = this.resolveUrl(baseUrl, iconTag.attributes.href);
          const expectedType = "image/png";
          const iconValidationResult = await this.validateIcon(
            href,
            expectedType
          );
          result.errors.push(...iconValidationResult.errors);
          result.successes.push(...iconValidationResult.successes);
          return result;
        },
      },
      {
        title: "Microsoft Tile Image",
        description:
          "Checks if the page has a Microsoft Tile Image which is used for Windows 8/10/11 tiles.",
        check: async (data: MetaTag[], baseUrl: string) => {
          const metaTag = data.find(
            (tag) =>
              tag.tag === "meta" &&
              tag.attributes.name === "msapplication-TileImage" &&
              tag.attributes.content
          );
          if (!metaTag) {
            return {
              errors: ["Microsoft Tile Image meta tag is missing"],
              successes: [],
            };
          }
          const href = this.resolveUrl(baseUrl, metaTag.attributes.content);
          const result = await this.validateIcon(href);
          return result;
        },
      },
      {
        title: "Web App Manifest",
        description: "Checks if the page has a web app manifest",
        check: async (data: MetaTag[]) => {
          if (
            data.some(
              (tag) => tag.tag === "link" && tag.attributes.rel === "manifest"
            )
          ) {
            return { errors: [], successes: ["Web App Manifest is present"] };
          } else {
            return { errors: ["Web App Manifest is missing"], successes: [] };
          }
        },
      },
    ];

    this.manifestRules = [
      {
        title: "Name",
        description: "Checks if the manifest has a 'name' field",
        check: async (manifest: Manifest) => {
          if (typeof manifest.name === "string") {
            return { errors: [], successes: ["Manifest 'name' is present"] };
          } else {
            return {
              errors: ["Manifest 'name' is missing or not a string"],
              successes: [],
            };
          }
        },
      },
      {
        title: "Short Name",
        description: "Checks if the manifest has a 'short_name' field",
        check: async (manifest: Manifest) => {
          if (typeof manifest.short_name === "string") {
            return {
              errors: [],
              successes: ["Manifest 'short_name' is present"],
            };
          } else {
            return {
              errors: ["Manifest 'short_name' is missing or not a string"],
              successes: [],
            };
          }
        },
      },
      {
        title: "Theme Color",
        description: "Checks if the manifest has a 'theme_color' field",
        check: async (manifest: Manifest) => {
          if (typeof manifest.theme_color === "string") {
            return {
              errors: [],
              successes: ["Manifest 'theme_color' is present"],
            };
          } else {
            return {
              errors: ["Manifest 'theme_color' is missing or not a string"],
              successes: [],
            };
          }
        },
      },
      {
        title: "Background Color",
        description: "Checks if the manifest has a 'background_color' field",
        check: async (manifest: Manifest) => {
          if (typeof manifest.background_color === "string") {
            return {
              errors: [],
              successes: ["Manifest 'background_color' is present"],
            };
          } else {
            return {
              errors: [
                "Manifest 'background_color' is missing or not a string",
              ],
              successes: [],
            };
          }
        },
      },
      {
        title: "192x192 PNG Icon",
        description:
          "Checks if the manifest has a 192x192 PNG icon for Android",
        check: async (manifest: Manifest, baseUrl: string) => {
          const icon = manifest.icons?.find(
            (icon) => icon.type === "image/png" && icon.sizes === "192x192"
          );
          if (!icon) {
            return {
              errors: ["Manifest is missing a 192x192 PNG icon"],
              successes: [],
            };
          }
          const href = this.resolveUrl(baseUrl, icon.src);
          const expectedType = "image/png";
          const result = await this.validateIcon(href, expectedType);
          return result;
        },
      },
      {
        title: "512x512 PNG Icon",
        description:
          "Checks if the manifest has a 512x512 PNG icon for Android",
        check: async (manifest: Manifest, baseUrl: string) => {
          const icon = manifest.icons?.find(
            (icon) => icon.type === "image/png" && icon.sizes === "512x512"
          );
          if (!icon) {
            return {
              errors: ["Manifest is missing a 512x512 PNG icon"],
              successes: [],
            };
          }
          const href = this.resolveUrl(baseUrl, icon.src);
          const expectedType = "image/png";
          const result = await this.validateIcon(href, expectedType);
          return result;
        },
      },
    ];
  }

  async verifyWebsite(baseUrl: string): Promise<ValidationResult> {
    const html = await fetchHtml(baseUrl);
    const metaTagResults = await this.verifyMetaTags(html, baseUrl);
    const manifestHref = this.findManifestUrl(html);

    if (!manifestHref) {
      return {
        metaTags: metaTagResults,
        manifest: null,
      };
    }
    const manifestUrl = this.resolveUrl(baseUrl, manifestHref);
    const manifestJson = await fetchHtml(manifestUrl);
    const manifestResults = await this.verifyManifest(manifestJson, baseUrl);
    return {
      metaTags: metaTagResults,
      manifest: manifestResults,
    };
  }

  private async verifyMetaTags(
    html: string,
    baseUrl: string
  ): Promise<RuleValidationResult[]> {
    const $ = cheerio.load(html);

    const foundMetaTags: MetaTag[] = [];

    $("meta, title, link, html").each((_, elem) => {
      const tag = elem.tagName.toLowerCase();
      const attributes: { [key: string]: string } = {};
      Object.entries(elem.attribs).forEach(([key, value]) => {
        attributes[key] = value;
      });
      foundMetaTags.push({ tag, attributes });
    });
    
    return await this.runValidation(this.metaTagRules, foundMetaTags, baseUrl);
  }

  private async verifyManifest(
    manifestJson: string,
    baseUrl: string
  ): Promise<RuleValidationResult[]> {
    let manifest: Manifest;
    try {
      manifest = JSON.parse(manifestJson);
    } catch (error) {
      return [
        {
          title: "JSON Parsing",
          description: "Checks if the manifest is valid JSON",
          errors: [`Invalid JSON: ${error}`],
          successes: [],
        },
      ];
    }

    return await this.runValidation(this.manifestRules, manifest, baseUrl);
  }

  private async runValidation<T>(
    rules: ValidationRule<T>[],
    data: T,
    baseUrl: string
  ): Promise<RuleValidationResult[]> {
    const results: RuleValidationResult[] = [];

    for (const rule of rules) {
      const { errors, successes } = await rule.check(data, baseUrl);
      const result: RuleValidationResult = {
        title: rule.title,
        description: rule.description,
        errors,
        successes,
      };

      results.push(result);
    }

    // Errors go first, then success with warnings, then success
    const sortedResults = results.sort((a, b) => {
      const calculateScore = (result: RuleValidationResult) => {
        if (result.errors.length > 0 && result.successes.length === 0) return 0;
        if (result.errors.length > 0 && result.successes.length > 0) return 1;
        return 2;
      };
      const aScore = calculateScore(a);
      const bScore = calculateScore(b);
      if (aScore !== bScore) return aScore - bScore;
      return 0;
    });

    return sortedResults;
  }

  private async validateIcon(
    href: string,
    expectedType?: string
  ): Promise<CheckResult> {
    const errors: string[] = [];
    const successes: string[] = [];

    const mimeType = await fetchContentHeaders(href);

    if (!mimeType) {
      errors.push(`Unable to verify MIME type for icon`);
      return { errors, successes };
    }

    successes.push(`Icon is accessible.`);

    if (expectedType) {
      // Workaround for x-icon MIME type
      if (expectedType === "image/x-icon") {
        if (["image/vnd.microsoft.icon", "image/x-icon"].includes(mimeType)) {
          successes.push(`Icon has valid MIME type "${mimeType}"`);
          return { errors, successes };
        }
      }

      if (mimeType !== expectedType) {
        errors.push(
          `Incorrect MIME type for icon. Expected "${expectedType}", got "${mimeType}"`
        );
      } else {
        successes.push(`Icon has valid MIME type "${mimeType}"`);
      }
    }

    return { errors, successes };
  }

  private findManifestUrl(html: string): string | undefined {
    const $ = cheerio.load(html);
    const manifestHref = $("link[rel='manifest']").attr("href");
    if (manifestHref) {
      return manifestHref;
    }
    return undefined;
  }

  private resolveUrl(baseUrl: string, relativeUrl: string): string {
    try {
      const url = new URL(relativeUrl, baseUrl).href;
      return url;
    } catch (error) {
      console.error("Error resolving URL: ", error);
      if (error instanceof TypeError) {
        console.error(
          `Error resolving URL: ${relativeUrl} with base: ${baseUrl}`
        );
      }
      return relativeUrl; // Fallback to the relative URL if URL resolution fails
    }
  }
}

export default MetaValidatorService;
