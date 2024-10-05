"use server";

const fetchFaviconHeaders = async (
  faviconUrl: string
): Promise<string | undefined | null> => {
  try {
    const response = await fetch(faviconUrl, { method: "HEAD" });
    const headers = response.headers.get("content-type");
    return headers;
  } catch (error) {
    return undefined;
  }
};

export default fetchFaviconHeaders;
