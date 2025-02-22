import React from "react";
import { ReactCompareSlider } from "react-compare-slider";
import { BlobImage } from "./blob-image";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import useCompressorStore from "../hooks/use-image-compressor";

export const ImagePreview = () => {
  const files = useCompressorStore((s) => s.files);
  const activeImage = useCompressorStore((s) => s.activeImage);
  const setActiveImage = useCompressorStore((s) => s.setActiveImage);
  const originalFiles = useCompressorStore((s) => s.files);
  const compressedFiles = useCompressorStore((s) => s.compressedImages);

  const [emblaRef] = useEmblaCarousel(
    {
      skipSnaps: true,
    },
    []
  );

  if (!activeImage) {
    return null;
  }

  const original = originalFiles.find((file) => file.name === activeImage);
  const compressed = compressedFiles[activeImage];

  return (
    <div className="relative w-full h-full">
      {compressed && original && (
        <ReactCompareSlider
          className="w-full h-full"
          itemOne={<BlobImage src={compressed} />}
          itemTwo={<BlobImage src={original} />}
        />
      )}
      {!compressed && original && (
        <BlobImage src={original}  />
      )}
      {files && files.length > 1 && (
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <div className="relative w-full" ref={emblaRef}>
            <div className="-mr-2 md:-mr-4 flex touch-pan-y items-stretch">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="relative flex shrink-0 pr-2 md:pr-4 grow-0 basis-[80px] md:basis-[15%]"
                >
                  <button
                    className={cn(
                      "relative border-2 aspect-square overflow-hidden rounded-md w-full bg-background",
                      file.name === activeImage && "border-primary"
                    )}
                    onClick={() => setActiveImage(file.name)}
                  >
                    <BlobImage src={file} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
