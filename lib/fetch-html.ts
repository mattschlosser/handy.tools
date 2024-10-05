"use server";

const fetchHtml = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { method: "GET" });
    const text = await response.text();
    console.log("🚀 ~ fetchHtml ~ text:", text)
    return text
  } catch (error) {
    throw new Error(
      "Unable to fetch the URL. Please ensure the URL is correct and accessible."
    );
  }
};

export default fetchHtml;
