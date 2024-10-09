"use server";

const fetchContentHeaders = async (
  faviconUrl: string
): Promise<string | undefined | null> => {
  try {
    const response = await fetch(faviconUrl, { method: "HEAD" });
    const headers = response.headers.get("content-type");
    return headers;
  } catch (error) {
    console.error("Error", error);
    if (error instanceof Error) {
      throw new Error(
        "Unable to fetch the URL. Please ensure the URL is correct and accessible."
      );
    }
    throw new Error("Unable to fetch the URL. Please try again later.");
  }
};

export default fetchContentHeaders;
