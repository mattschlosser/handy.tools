import { convertSVGToPNG } from "@/features/favicon-generator/lib/convert-svg-to-png";
import {
  initializeImageMagick,
  ImageMagick,
  MagickImageCollection,
  MagickFormat,
} from "@imagemagick/magick-wasm";

export class MagickService {
  private initialized: boolean = false;

  /**
   * Initializes the ImageMagick WASM module.
   * This must be called before using any other methods in this service.
   * @returns Promise that resolves when initialization is complete
   */
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

  /**
   * Generates a square PNG image of the specified size from the input file.
   * @param file - The source image file to process
   * @param size - The desired width and height of the output image in pixels
   * @returns Promise that resolves with a PNG Blob of the resized image
   * @throws Error if ImageMagick is not initialized
   */
  public async generateIcon(file: File, size: number): Promise<Blob> {
    if (!this.initialized) {
      throw new Error("ImageMagick has not been initialized.");
    }

    if (file.type === "image/svg+xml") {
      try {
        const pngFile = await convertSVGToPNG(file, size, size);
        return pngFile;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(error.message);
        }
        throw new Error("Failed to convert SVG to PNG.");
      }
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

  /**
   * Generates a multi-size ICO favicon file from the input image.
   * @param file - The source image file to process
   * @param sizes - Array of sizes in pixels for the favicon (defaults to [16, 32, 48, 64])
   * @returns Promise that resolves with an ICO Blob containing all specified sizes
   * @throws Error if ImageMagick is not initialized
   */
  public async generateFavicon(
    file: File,
    sizes: number[] = [16, 32, 48, 64]
  ): Promise<Blob> {
    if (!this.initialized) {
      throw new Error("ImageMagick has not been initialized.");
    }

    return new Promise(async (resolve, reject) => {
      try {
        let imageFile = file;
        if (file.type === "image/svg+xml") {
          imageFile = await convertSVGToPNG(file, sizes[0], sizes[0]);
        }

        const imageBuffer = await imageFile.arrayBuffer();
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

  /**
   * Checks if the ImageMagick service has been initialized.
   * @returns boolean indicating whether the service is ready to use
   */
  public isReady(): boolean {
    return this.initialized;
  }
}
