"use server";

const fetchHtml = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { method: "GET" });
    return await response.text();
  } catch (error) {
    throw new Error(
      "Unable to fetch the URL. Please ensure the URL is correct and accessible."
    );
  }
};

export default fetchHtml;
