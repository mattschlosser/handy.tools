const fetchImage = async (
  url: string
): Promise<Blob | undefined | null> => {
  const response = await fetch(`/api/fetch-image?url=${url}`);
  if (!response.ok) {
    const error = await response.json();
    console.error("Error fetching Image:", error.error);
    throw new Error(error.error);
  }

  const image = await response.blob();
  return image;
};

export default fetchImage;
