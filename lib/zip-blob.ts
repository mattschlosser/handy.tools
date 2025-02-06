import { BlobWriter, BlobReader, ZipWriter } from "@zip.js/zip.js";

export async function zipBlob(
  files: { name: string; blob: Blob }[]
): Promise<Blob> {
  const zipWriter = new ZipWriter(new BlobWriter("application/zip"));

  await Promise.all(
    files.map(async ({ name, blob }) => {
      await zipWriter.add(name, new BlobReader(blob));
    })
  );

  return zipWriter.close();
}
