"use client";

import React, { useState } from "react";
import useCompressorStore from "../hooks/use-image-compressor";
import { formatFileSize } from "@/lib/format-file-size";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DownloadIcon } from "lucide-react";
import { ReloadIcon } from "@radix-ui/react-icons";
import { downloadFile } from "@/lib/download-file";
import { zipBlob } from "@/lib/zip-blob";
import { getExtFromMimeType } from "@/lib/get-ext-from-mime-type";

const formatFileName = (file: File | Blob, name: string) => {
  const formattedName =
    name.lastIndexOf(".") !== -1 ? name.slice(0, name.lastIndexOf(".")) : name;
  const ext = getExtFromMimeType(file.type);
  const newName = `${formattedName}-compressed.${ext}`;
  return newName;
};

export const ImageMetadataDisplay = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const activeImage = useCompressorStore((s) => s.activeImage);
  const files = useCompressorStore((s) => s.files);
  const compressedImages = useCompressorStore((s) => s.compressedImages);
  const isAutoCompressing = useCompressorStore((s) => s.isAutoCompressing);
  const processAll = useCompressorStore((s) => s.processAll);
  const isCompressing = useCompressorStore((s) => s.isCompressing);

  const isAllCompressed = Object.keys(compressedImages).length === files.length;

  if (!activeImage) {
    return null;
  }

  const original = files.find((file) => file.name === activeImage);
  const compressed = compressedImages[activeImage];

  if (!original) {
    return null;
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (Object.keys(compressedImages).length === 1) {
        downloadFile(compressed, formatFileName(compressed, original.name));
        return;
      }

      const allFiles = Object.entries(compressedImages).map(([name, file]) => ({
        name: formatFileName(file, name),
        blob: file,
      }));

      const zip = await zipBlob(allFiles);
      downloadFile(zip, `compressed-images.zip`);
    } catch (error) {
      console.error("Error downloading file:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-col gap-1">
        <div className="text-sm text-foreground">
          <b>File name:</b> {original.name}
        </div>
        <div className="text-sm text-foreground">
          <b>File size: </b>
          {compressed?.size ? (
            <>
              <p className="inline-block line-through">
                {formatFileSize(original.size)}
              </p>{" "}
              <span>{formatFileSize(compressed.size)} </span>{" "}
              <span>
                {(
                  ((original.size - compressed.size) / original.size) *
                  100
                ).toFixed(2)}
                %
              </span>
            </>
          ) : (
            `${formatFileSize(original.size)}`
          )}
        </div>
      </div>
      {(!isAutoCompressing || isAllCompressed) && (
        <>
          <Separator className="mb-1" />
          <div className="flex w-full justify-evenly flex-wrap gap-2">
            {!isAutoCompressing && (
              <Button
                className="flex-1"
                onClick={processAll}
                disabled={files.length === 0 || isCompressing}
              >
                {isCompressing && (
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isCompressing ? "Compressing" : "Compress"}
              </Button>
            )}
            {isAllCompressed && (
              <Button
                className="flex-1"
                onClick={() => handleDownload()}
                disabled={files.length === 0 || isCompressing}
              >
                {isDownloading ? (
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <DownloadIcon className="mr-2 h-4 w-4" />
                )}
                {isDownloading ? "Downloading" : "Download"}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
