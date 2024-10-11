const fetchHtml = async (url: string): Promise<string> => {
  const response = await fetch(`/api/fetch-html?url=${url}`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const text = await response.text();
  return text;
};

export default fetchHtml;
