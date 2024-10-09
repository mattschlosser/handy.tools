"use server";

const fetchHtml = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { method: "GET" });
    const text = await response.text();
    return text;
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

export default fetchHtml;
