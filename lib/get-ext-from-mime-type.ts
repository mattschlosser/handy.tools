export const getExtFromMimeType = (mime: string) => {
  return mime.split("/")[1];
};
