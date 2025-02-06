const fetchContentHeaders = async (
  faviconUrl: string
): Promise<string | undefined | null> => {
  const response = await fetch(`/api/fetch-content-type?url=${faviconUrl}`);
  if (!response.ok) {
    const error = await response.json();
    console.error("Error fetching Content Headers:", error.error);
    throw new Error(error.error);
  }

  const headers = await response.text();
  return headers;
};

export default fetchContentHeaders;
