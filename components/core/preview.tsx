import React from "react";
import { ReactCompareSlider } from "react-compare-slider";
import NextImage from "next/image";

type PreviewProps = {
  thumbnail: {
    url: string;
    aspectRatio: number;
  };
  originalThumbnail: {
    url: string;
    aspectRatio: number;
  };
};

const Preview: React.FC<PreviewProps> = React.memo((props: PreviewProps) => {
  const { thumbnail, originalThumbnail } = props;

  return (
    <ReactCompareSlider
      className="w-full h-full"
      itemOne={
        <NextImage
          src={thumbnail.url}
          alt="Thumbnail"
          style={{ aspectRatio: thumbnail.aspectRatio }}
          className="object-contain rounded bg-black"
          fill
        />
      }
      itemTwo={
        <NextImage
          src={originalThumbnail.url}
          alt="Thumbnail"
          style={{ aspectRatio: originalThumbnail.aspectRatio }}
          className="object-contain rounded bg-black"
          fill
        />
      }
    />
  );
});

Preview.displayName = "Preview";

export { Preview };
