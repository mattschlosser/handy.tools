import Image from "next/image";
import React, { useEffect } from "react";

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

  const blobUrl = React.useMemo(() => fileOrBlobToUrl(src), [src]);

  useEffect(() => {
    if (blobUrl) {
      return () => URL.revokeObjectURL(blobUrl);
    }
  }, [blobUrl]);

  if (!blobUrl) return null;

  return (
    <Image
      className="w-full h-full object-contain"
      src={blobUrl}
      alt="Image"
      fill
    />
  );
};

BlobImage.displayName = "BlobImage";
