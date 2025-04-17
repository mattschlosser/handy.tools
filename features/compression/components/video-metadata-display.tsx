import React from "react";
import { secondsToTimestamp } from "../lib/seconds-to-timestamp";

interface VideoMetadata {
  duration?: number;
  width?: number;
  height?: number;
  sizeMB?: number;
}

interface COptions {
  scale?: number;
  width?: number;
  height?: number;
}

interface VideoMetadataDisplayProps {
  videoMetadata: VideoMetadata;
  cOptions: COptions;
  estimatedSize?: number | null;
}

export function VideoMetadataDisplay({
  videoMetadata,
  cOptions,
  estimatedSize,
}: VideoMetadataDisplayProps) {
  return (
    <div className="flex flex-col gap-1">
      {videoMetadata?.duration && (
        <p className="text-sm text-foreground">
          <b>Video Duration:</b> {secondsToTimestamp(videoMetadata.duration)}
        </p>
      )}
      {videoMetadata?.width && videoMetadata?.height && (
        <div className="text-sm text-foreground">
          <b>Resolution:</b>{" "}
          {(cOptions.scale && cOptions.scale !== 1)  || (cOptions.width && cOptions.height) ? (
            <>
              <p className="inline-block line-through">
                {videoMetadata.width}x${videoMetadata.height}
              </p>{" "}
              <span>
                {(cOptions.width || (videoMetadata.width * cOptions.scale!)).toFixed(0)}x
                {(cOptions.height || (videoMetadata.height * cOptions.scale!)).toFixed(0)}
              </span>
            </>
          ) : (
            `${videoMetadata.width}x${videoMetadata.height}`
          )}
        </div>
      )}
      {videoMetadata?.sizeMB && (
        <div className="text-sm text-foreground">
          <b>File size: </b>
          {estimatedSize ? (
            <>
              <p className="inline-block line-through">
                {videoMetadata.sizeMB.toFixed(2)}MB
              </p>{" "}
              <span>{estimatedSize}MB </span>{" "}
              <span>
                {(
                  ((videoMetadata.sizeMB - estimatedSize) /
                    videoMetadata.sizeMB) *
                  100
                ).toFixed(2)}
                %
              </span>
            </>
          ) : (
            `${videoMetadata.sizeMB.toFixed(2)}MB`
          )}
        </div>
      )}
    </div>
  );
}
