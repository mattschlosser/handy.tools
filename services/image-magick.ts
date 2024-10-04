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

  public async generateIcon(file: File, size: number): Promise<Blob> {
    if (!this.initialized) {
      throw new Error("ImageMagick has not been initialized.");
    }

    return new Promise(async (resolve, reject) => {
      try {
        const imageBuffer = await file.arrayBuffer();
        const imageData = new Uint8Array(imageBuffer);

        ImageMagick.read(imageData, async (image) => {
          image.resize(size, size);
          image.write(MagickFormat.Png, (data) => {
            resolve(new Blob([data], { type: "image/png" }));
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public async generateFavicon(
    file: File,
    sizes: number[] = [16, 32, 48, 64]
  ): Promise<Blob> {
    if (!this.initialized) {
      throw new Error("ImageMagick has not been initialized.");
    }

    return new Promise(async (resolve, reject) => {
      try {
        const imageBuffer = await file.arrayBuffer();
        const imageData = new Uint8Array(imageBuffer);

        ImageMagick.read(imageData, (image) => {
          const images = MagickImageCollection.create();

          const cloneAndResize = (index: number) => {
            if (index >= sizes.length) {
              images.write(MagickFormat.Ico, (data) => {
                resolve(new Blob([data], { type: "image/x-icon" }));
              });
              return;
            }

            image.clone((img) => {
              img.resize(sizes[index], sizes[index]);
              images.push(img);
              cloneAndResize(index + 1);
            });
          };

          cloneAndResize(0);
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
