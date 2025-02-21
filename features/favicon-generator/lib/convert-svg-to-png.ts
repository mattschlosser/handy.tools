export const convertSVGToPNG = (
  svgFile: File,
  width: number,
  height: number
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error("Failed to read the SVG file."));
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Failed to convert canvas to PNG."));
            return;
          }

          const pngFile = new File([blob], "converted.png", {
            type: "image/png",
          });
          resolve(pngFile);
        }, "image/png");
      };

      img.onerror = () =>
        reject(new Error("Failed to load the SVG as an image."));
      img.src = e.target.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read the SVG file."));
    reader.readAsDataURL(svgFile);
  });
};
