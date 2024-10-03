"use client";

import Confetti from "react-confetti";
import { Button } from "@/components/ui/button";
import Dropzone from "@/components/ui/dropzone";
import {
  ReloadIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import { Progress } from "@/components/ui/progress";
import { useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Preview } from "@/components/core/preview";
import {
  getVideoMetadata,
  VideoMetadata,
} from "@/features/compression/lib/get-video-metadata";
import { Separator } from "@/components/ui/separator";
import {
  CompressionOptions,
  VideoSettings,
} from "@/features/compression/components/video-settings";
import { downloadFile } from "@/lib/download-file";
import { useFfmpeg } from "@/features/compression/hooks/use-ffmpeg";
import { VideoMetadataDisplay } from "./components/video-metadata-display";

type Thumbnail = {
  url: string;
  aspectRatio: number;
};

export default function Compressor() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [thumbnail, setThumbnail] = useState<Thumbnail | null>(null);
  const [originalThumbnail, setOriginalThumbnail] = useState<Thumbnail | null>(
    null
  );
  const [imageUploading, setImageUploading] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(
    null
  );
  const debouncePreviewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [cOptions, setCOptions] = useState<CompressionOptions>({
    quality: 65,
    preset: "veryfast",
    fps: 30,
    scale: 1,
  });

  const {
    error,
    isLoaded: isFfmpegLoaded,
    isLoading: isFfmpegLoading,
    isTranscoding,
    isEstimating,
    isProcessingThumbnail,
    estimateOutputSize,
    extractThumbnail,
    progress,
    transcode,
  } = useFfmpeg();

  const handleTranscode = async () => {
    if (!isFfmpegLoaded) {
      console.error("FFmpeg not loaded");
      return;
    }

    const file = files[0];
    if (!file) {
      console.error("No file to transcode");
      return;
    }

    const result = await transcode(file, cOptions);

    setShowConfetti(true);
    if (!result) return;
    const { file: output, name } = result;
    downloadFile(output, name);
  };

  const handleFileAccepted = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    const file = acceptedFiles[0];

    if (file) {
      setImageUploading(true);
      await Promise.all([
        getVideoMetadata(file).then((metadata) => setVideoMetadata(metadata)),
        handleProcessThumbnail(file, cOptions, setThumbnail),
        handleProcessThumbnail(
          file,
          { quality: 100, scale: 1, preset: "medium", fps: 1 },
          setOriginalThumbnail
        ),
      ]);

      setImageUploading(false);
      await handleEstimateOutputSize(file, cOptions);
    }
  };

  const handleProcessThumbnail = async (
    file: File,
    options: CompressionOptions,
    onComplete: (thumbnail: Thumbnail) => void
  ) => {
    if (!file) {
      return;
    }

    const result = await extractThumbnail(file, options);

    if (!result) {
      return;
    }

    const { thumbnail } = result;

    const url = URL.createObjectURL(thumbnail);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      onComplete({
        url,
        aspectRatio: img.width / img.height,
      });
    };
  };

  const debouncedHandleProcessThumbnail = (options: CompressionOptions) => {
    if (files.length > 0) {
      if (debouncePreviewTimerRef.current) {
        clearTimeout(debouncePreviewTimerRef.current);
      }

      debouncePreviewTimerRef.current = setTimeout(async () => {
        await handleProcessThumbnail(files[0], options, setThumbnail);
        await handleEstimateOutputSize(files[0], options);
      }, 300);
    }
  };

  const handleEstimateOutputSize = async (
    file: File,
    options: CompressionOptions
  ) => {
    if (!isFfmpegLoaded) return;

    try {
      const size = await estimateOutputSize(file, options);
      setEstimatedSize(size);
    } catch (error) {
      console.error("Error estimating output size:", error);
    }
  };

  const handleOptionsChange = (options: CompressionOptions) => {
    setCOptions(options);
    debouncedHandleProcessThumbnail(options);
  };

  const isDisabled = !isFfmpegLoaded || isTranscoding;

  return (
    <div className="grid md:grid-cols-3 gap-4 w-full mx-auto">
      <div className="flex flex-col gap-2 md:col-span-2 border p-2 rounded">
        <div className="relative flex items-center justify-center aspect-square">
          {files.length === 0 && !isFfmpegLoading && (
            <Dropzone
              containerClassName="w-full h-full"
              dropZoneClassName="w-full h-full"
              filesUploaded={files}
              setFilesUploaded={setFiles}
              onDropAccepted={handleFileAccepted}
              disabled={isDisabled}
            />
          )}
          {(imageUploading || isFfmpegLoading) && (
            <Spinner className="absolute inset-0 m-auto w-12 h-12" />
          )}
          {files.length > 0 &&
            thumbnail &&
            originalThumbnail &&
            !imageUploading && (
              <div className="relative w-full h-full flex">
                <Preview
                  thumbnail={thumbnail}
                  originalThumbnail={originalThumbnail}
                />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setFiles([])}
                  className="absolute top-4 right-4"
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
                {isProcessingThumbnail && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Spinner className="border-white" />
                  </div>
                )}
              </div>
            )}
        </div>
        <Progress value={!isTranscoding ? 0 : progress * 100} />
        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <AlertTitle>{error.type || "Error"}</AlertTitle>
            <AlertDescription>
              {error.message || "An unexpected error occurred"}
            </AlertDescription>
          </Alert>
        )}
      </div>
      <aside className="flex flex-col col-span-1 border p-4 gap-6 rounded">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Settings</h2>
          <VideoSettings
            isDisabled={isDisabled}
            cOptions={cOptions}
            onOptionsChange={handleOptionsChange}
          />
        </div>
        {files && files.length > 0 && (
          <div className="flex flex-col gap-2 mt-auto">
            {videoMetadata && (
              <VideoMetadataDisplay
                isEstimating={isEstimating}
                videoMetadata={videoMetadata}
                cOptions={cOptions}
                estimatedSize={estimatedSize}
              />
            )}
            <Separator />
            <Button
              onClick={handleTranscode}
              disabled={isDisabled || files.length === 0 || isEstimating}
            >
              {isTranscoding && (
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isTranscoding ? "Compressing" : "Compress"}
            </Button>
          </div>
        )}
      </aside>
      {showConfetti && (
        <Confetti
          numberOfPieces={1000}
          tweenDuration={8000}
          recycle={false}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}
    </div>
  );
}
