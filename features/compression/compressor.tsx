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
import { VideoPreview } from "./components/video-preview";

export default function Compressor() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [videoPreview, setVideoPreview] = useState<{
    original: Blob;
    compressed: Blob;
  } | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
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
    isGeneratingPreview,
    generateVideoPreview,
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
      setVideoUploading(true);
      await Promise.all([
        getVideoMetadata(file).then((metadata) => setVideoMetadata(metadata)),
        handleGeneratePreview(file, cOptions),
      ]);

      setVideoUploading(false);
    }
  };

  const handleGeneratePreview = async (
    file: File,
    options: CompressionOptions
  ) => {
    if (!isFfmpegLoaded) return;

    try {
      const result = await generateVideoPreview(file, options);
      if (!result) return;
      const { original, compressed, estimatedSize: size } = result;
      setEstimatedSize(size);
      setVideoPreview({ original, compressed });
    } catch (error) {
      console.error("Error estimating output size:", error);
    }
  };

  const debouncedGeneratePreview = (options: CompressionOptions) => {
    if (files.length > 0) {
      if (debouncePreviewTimerRef.current) {
        clearTimeout(debouncePreviewTimerRef.current);
      }

      debouncePreviewTimerRef.current = setTimeout(async () => {
        await handleGeneratePreview(files[0], options);
      }, 300);
    }
  };

  const handleOptionsChange = (options: CompressionOptions) => {
    setCOptions(options);
    debouncedGeneratePreview(options);
  };

  const isDisabled = !isFfmpegLoaded || isTranscoding;

  return (
    <div className="grow flex flex-col gap-4 h-full w-full md:max-h-[calc(100dvh-64px-48px)]">
      <h1 className="text-2xl font-bold">The Compressor</h1>
      <div className="grow grid items-start md:grid-cols-3 gap-4 w-full h-full mx-auto overflow-hidden">
        <div className="flex flex-col gap-2 md:col-span-2 border p-2 rounded-md bg-card h-full min-h-[300px] max-h-[847px]">
          <div className="relative flex items-center justify-center h-full">
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
            {(videoUploading || isFfmpegLoading) && (
              <Spinner className="absolute inset-0 m-auto w-12 h-12" />
            )}
            {files.length > 0 && videoPreview && !videoUploading && (
              <div className="relative w-full h-full flex bg-black rounded-md overflow-hidden">
                <VideoPreview videoPreview={videoPreview} />
                <Button
                  size="icon"
                  onClick={() => setFiles([])}
                  className="absolute top-4 right-4"
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
                {isGeneratingPreview && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Spinner className="border-white" />
                  </div>
                )}
                {isTranscoding && (
                  <Progress
                    className="absolute w-full bottom-0"
                    value={progress * 100}
                  />
                )}
              </div>
            )}
          </div>
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
        <aside className="flex flex-col col-span-1 gap-4 h-full overflow-auto">
          <div className="flex flex-col gap-2 border bg-card p-4 rounded-md md:h-full md:overflow-y-auto">
            <h2 className="text-xl font-semibold">Settings</h2>
            <VideoSettings
              isDisabled={isDisabled}
              cOptions={cOptions}
              onOptionsChange={handleOptionsChange}
            />
          </div>
          {files && files.length > 0 && (
            <div className="flex flex-col gap-2 mt-auto border bg-card p-4 rounded-md">
              <h2 className="text-xl font-semibold">Details</h2>
              {videoMetadata && (
                <VideoMetadataDisplay
                  videoMetadata={videoMetadata}
                  cOptions={cOptions}
                  estimatedSize={estimatedSize}
                />
              )}
              <Separator />
              <Button
                onClick={handleTranscode}
                disabled={
                  isDisabled || files.length === 0 || isGeneratingPreview
                }
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
    </div>
  );
}
