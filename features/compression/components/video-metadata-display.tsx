import React, { useMemo } from "react";
import { secondsToTimestamp } from "../lib/seconds-to-timestamp";
import { timestampToSeconds } from "../lib/timestamp-to-seconds";

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
  /** hh:mm:ss */
  trimStart?: string;
  trimEnd?: string;
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

  const calculateVideoDuration = (duration: number) => {
    if (cOptions.trimStart && cOptions.trimEnd) {
      return secondsToTimestamp(
        timestampToSeconds(cOptions.trimEnd) -
          timestampToSeconds(cOptions.trimStart)
      );
    }
    if (cOptions.trimEnd) {
      return cOptions.trimEnd;
    }
    if (cOptions.trimStart) {
      return secondsToTimestamp(
        duration - timestampToSeconds(cOptions.trimStart)
      );
    }
    return secondsToTimestamp(duration);
  }

  const duration = useMemo(
    () => videoMetadata?.duration && calculateVideoDuration(videoMetadata.duration), 
    [videoMetadata.duration, cOptions.trimStart, cOptions.trimEnd]
  );

  return (
    <div className="flex flex-col gap-1">
      {duration && (
        <p className="text-sm text-foreground">
          <b>Video Duration:</b> {duration}
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
