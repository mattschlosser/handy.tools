"use client";
import { Button } from "@/components/ui/button";
import Dropzone from "@/components/ui/dropzone";
import {
  ReloadIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { TranscodeOptions, useFfmpeg } from "@/hooks/use-ffmpeg";
import { qualityToCrf } from "@/lib/quality-to-crf";
import { useRef, useState } from "react";
import { downloadFile } from "@/lib/download-file";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Preview } from "@/components/core/preview";

type CompressionOptions = {
  quality: number;
  width: number;
};

type Thumbnail = {
  url: string;
  aspectRatio: number;
};

export default function Dashboard() {
  const [files, setFiles] = useState<File[]>([]);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [thumbnail, setThumbnail] = useState<Thumbnail | null>(null);
  const [originalThumbnail, setOriginalThumbnail] = useState<Thumbnail | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const debounceQualityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [cOptions, setCOptions] = useState<CompressionOptions>({
    quality: 30,
    width: 0,
  });

  const {
    error,
    isFfmpegLoading,
    isFfmpegLoaded,
    extractThumbnail,
    isTranscoding,
    progress,
    transcode,
    isEstimating,
    estimateSize,
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

    const options: TranscodeOptions = {
      crf: qualityToCrf(cOptions.quality).toString(),
      ...(cOptions.width > 0 && { width: cOptions.width }),
    };

    const result = await transcode(file, options);
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
      await handleProcessThumbnail(file, cOptions, setThumbnail);
      await handleProcessThumbnail(file, { quality: 100, width: 0}, setOriginalThumbnail);

      // Determine duration of the video in seconds
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        setDuration(video.duration);
        URL.revokeObjectURL(video.src);
        setImageUploading(false);
      };
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

    const { quality, width } = options;

    const transcodeOptions = {
      crf: qualityToCrf(quality).toString(),
      ...(width > 0 && { width }),
    };

    setThumbnailLoading(true);
    const result = await extractThumbnail(file, transcodeOptions);

    if (!result) {
      setThumbnailLoading(false);
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
      setThumbnailLoading(false);
    };
  };

  const handleQualityChange = (value: number) => {
    const newOptions = {
      ...cOptions,
      quality: value,
    };

    setCOptions(newOptions);

    if (files.length > 0) {
      if (debounceQualityTimerRef.current) {
        clearTimeout(debounceQualityTimerRef.current);
      }

      debounceQualityTimerRef.current = setTimeout(() => {
        handleProcessThumbnail(files[0], newOptions, setThumbnail);
      }, 300);
    }
  };

  const handleWidthChange = (value: string) => {
    const width = parseInt(value);
    const newOptions = {
      ...cOptions,
      width: width,
    };
    setCOptions(newOptions);
    if (files.length > 0) {
      if (debounceQualityTimerRef.current) {
        clearTimeout(debounceQualityTimerRef.current);
      }

      debounceQualityTimerRef.current = setTimeout(() => {
        handleProcessThumbnail(files[0], newOptions, setThumbnail);
      }, 300);
    }
  };

  const handleEstimateSize = async (file: File) => {
    if (!file || !duration) {
      return;
    }

    const options = {
      crf: qualityToCrf(cOptions.quality).toString(),
      ...(cOptions.width > 0 && { width: cOptions.width }),
    };
    const aSecondOfVideo = await estimateSize(file, options);
    if (!aSecondOfVideo) return;
    const totalSize = aSecondOfVideo * duration;
    setEstimatedSize(totalSize);
  };

  if(isFfmpegLoading) {
    return (
      <main className="flex items-center justify-center h-screen">
        <Spinner className="w-20 h-20" />
      </main>
    )
  }

  return (
    <main className="max-w-screen-2xl mx-auto w-full p-4">
      <div className="grid md:grid-cols-3 gap-4 w-full mx-auto">
        <div className="flex flex-col gap-2 md:col-span-2 border p-2 rounded">
          <div className="relative flex items-center justify-center aspect-square">
            {files.length === 0 && (
              <Dropzone
                containerClassName="w-full h-full"
                dropZoneClassName="w-full h-full"
                filesUploaded={files}
                setFilesUploaded={setFiles}
                onDropAccepted={handleFileAccepted}
              />
            )}
            {imageUploading && <Spinner className="absolute inset-0 m-auto w-12 h-12" />}
            {files.length > 0 && thumbnail && originalThumbnail && !imageUploading && (
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
                {thumbnailLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Spinner />
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
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="quality">Quality</Label>
                <Slider
                  name="quality"
                  id="quality"
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={[cOptions.quality]}
                  value={[cOptions.quality]}
                  onValueChange={(value) => {
                    handleQualityChange(value[0]);
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="width">Video Width</Label>
                <Input
                  onChange={(e) => handleWidthChange(e.target.value)}
                  type="number"
                  id="width"
                  max={6500}
                  min={0}
                />
                <p className="text-sm text-gray-500">
                  This will shrink/scale the video. Will result in higher/lower
                  file size
                </p>
              </div>
            </div>
          </div>
          {files && files.length > 0 && (
            <div className="flex flex-col gap-2 mt-auto">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleEstimateSize(files[0])}
                  disabled={isEstimating || isTranscoding}
                >
                  {isEstimating && (
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEstimating ? "Estimating" : "Estimate Size"}
                </Button>
                {estimatedSize && (
                  <p className="text-sm text-gray-500">
                    Estimated size:{" "}
                    {estimatedSize
                      ? (estimatedSize / 1024 / 1024).toFixed(2)
                      : 0}
                    MB
                  </p>
                )}
              </div>

              <Button
                onClick={handleTranscode}
                disabled={isTranscoding || !isFfmpegLoaded}
              >
                {isTranscoding && (
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isTranscoding ? "Compressing" : "Compress"}
              </Button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
