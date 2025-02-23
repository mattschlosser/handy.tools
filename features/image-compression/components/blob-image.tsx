import Image from "next/image";
import React, { useEffect, useState } from "react";

const fileOrBlobToUrl = (src?: Blob | File | null) => {
  if (!src) return null;

  if (src instanceof File) {
    const blob = new Blob([src], { type: src.type });
    return URL.createObjectURL(blob);
  }

  return URL.createObjectURL(src);
};

export const BlobImage = (props: { src: Blob | File }) => {
  const { src } = props;
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    const url = fileOrBlobToUrl(src);
    setImage(url);
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [src]);

  if (!image) return null;

  return (
    <Image
      className="w-full h-full object-contain"
      src={image}
      alt="Image"
      fill
    />
  );
};

BlobImage.displayName = "BlobImage";
