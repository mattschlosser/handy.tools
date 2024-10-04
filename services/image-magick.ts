import {
  initializeImageMagick,
  ImageMagick,
  MagickImageCollection,
  MagickFormat,
} from "@imagemagick/magick-wasm";

export class MagickService {
  private initialized: boolean = false;

  public async initMagick(): Promise<void> {
    if (!this.initialized) {
      // @ts-expect-error - Load WASM
      const magickWasm = await import("@imagemagick/magick-wasm/magick.wasm");
      const magickBuffer = await fetch(magickWasm.default).then((res) =>
        res.arrayBuffer()
      );
      await initializeImageMagick(magickBuffer);
      this.initialized = true;
    }
  }

  public async generateFavicon(file: File): Promise<Blob> {
    if (!this.initialized) {
      throw new Error("ImageMagick has not been initialized.");
    }

    return new Promise(async (resolve, reject) => {
      try {
        const imageBuffer = await file.arrayBuffer();
        const imageData = new Uint8Array(imageBuffer);

        ImageMagick.read(imageData, async (image) => {
          const sizes = [16, 32, 48, 64];
          const images = MagickImageCollection.create();

          image.clone((img) => {
            img.resize(sizes[0], sizes[0]);
            images.push(img);

            image.clone((img2) => {
              img.resize(sizes[1], sizes[1]);
              images.push(img2);

              image.clone((img3) => {
                img.resize(sizes[2], sizes[2]);
                images.push(img3);

                image.clone((img4) => {
                  img.resize(sizes[3], sizes[3]);
                  images.push(img4);

                  images.write(MagickFormat.Ico, (data) => {
                    resolve(new Blob([data], { type: "image/x-icon" }));
                  });
                });
              });
            });
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public isReady(): boolean {
    return this.initialized;
  }
}
