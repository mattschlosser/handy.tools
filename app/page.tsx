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
import { useFfmpeg } from "@/hooks/use-ffmpeg";
import { useRef, useState } from "react";
import { downloadFile } from "@/lib/download-file";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Preview } from "@/components/core/preview";
import { PresetOptions } from "./services/ffmpeg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getVideoMetadata, VideoMetadata } from "@/lib/get-video-metadata";
import { secondsToTimestamp } from "@/lib/seconds-to-timestamp";
import { Separator } from "@/components/ui/separator";

type CompressionOptions = {
  quality: number;
  preset: PresetOptions;
  fps: number;
  scale: number;
};

type Thumbnail = {
  url: string;
  aspectRatio: number;
};

const presets = [
  {
    name: "Ultrafast",
    value: "ultrafast",
  },
  {
    name: "Superfast",
    value: "superfast",
  },
  {
    name: "Veryfast",
    value: "veryfast",
  },
  {
    name: "Faster",
    value: "faster",
  },
  {
    name: "Fast",
    value: "fast",
  },
  {
    name: "Medium",
    value: "medium",
  },
  {
    name: "Slow",
    value: "slow",
  },
];

export default function Dashboard() {
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
  const debounceQualityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [cOptions, setCOptions] = useState<CompressionOptions>({
    quality: 60,
    preset: "faster",
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
        )
      ]);

      setImageUploading(false);
      await handleEstimateOutputSize(file, cOptions)
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
      if (debounceQualityTimerRef.current) {
        clearTimeout(debounceQualityTimerRef.current);
      }

      debounceQualityTimerRef.current = setTimeout(async () => {
        await handleProcessThumbnail(files[0], options, setThumbnail)
        await handleEstimateOutputSize(files[0], options)
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

  const handleQualityChange = (value: number) => {
    const newOptions = {
      ...cOptions,
      quality: value,
    };

    setCOptions(newOptions);
    debouncedHandleProcessThumbnail(newOptions);
  };

  const handleScaleChange = (value: number) => {
    const newOptions = {
      ...cOptions,
      scale: value,
    };
    setCOptions(newOptions);
    debouncedHandleProcessThumbnail(newOptions);
  };

  const handlePresetChange = (value: string) => {
    const newOptions = {
      ...cOptions,
      preset: value as PresetOptions,
    };

    setCOptions(newOptions);
    debouncedHandleProcessThumbnail(newOptions);
  };

  const handleFpsChange = (value: number | string) => {
    if (typeof value === "number") {
      const newOptions = {
        ...cOptions,
        fps: value,
      };

      setCOptions(newOptions);
      debouncedHandleProcessThumbnail(newOptions);
    }
  };

  const isDisabled = !isFfmpegLoaded || isTranscoding

  return (
    <main className="max-w-screen-2xl mx-auto w-full p-4">
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
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="quality">Quality</Label>
                <Slider
                  disabled={isDisabled}
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
                <p className="text-sm text-gray-500">
                  Lower quality will result in smaller file size. At maximum
                  quality the video will still be compressed with
                  minimum impact on quality.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="scale">Scale</Label>
                <Slider
                  disabled={isDisabled}
                  name="scale"
                  id="scale"
                  min={0.01}
                  max={1}
                  step={0.01}
                  defaultValue={[cOptions.scale]}
                  value={[cOptions.scale]}
                  onValueChange={(value) => handleScaleChange(value[0])}
                />
                <p className="text-sm text-gray-500">
                  This will shrink the video dimensions. Will greatly reduce
                  file size.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="preset">Preset</Label>
                  <Select
                    value={cOptions.preset}
                    disabled={isDisabled}
                    onValueChange={(value) => handlePresetChange(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {presets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-gray-500">
                  Compression speed. A slower preset will provide slightly
                  better compression, but will take longer to process. Faster
                  values are recommended for most cases.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="fps">FPS</Label>
                <Input
                  disabled={isDisabled}
                  onChange={(e) => handleFpsChange(parseInt(e.target.value))}
                  value={cOptions.fps}
                  type="number"
                  id="fps"
                  max={120}
                />
                <p className="text-sm text-gray-500">
                  Frames per second. Lower FPS will result in smaller file size
                </p>
              </div>
            </div>
          </div>
          {files && files.length > 0 && (
            <div className="flex flex-col gap-2 mt-auto">
              <div className="flex flex-col gap-1">
                {isEstimating && <div className="text-sm text-foreground"><Spinner className="w-4 h-4 text-white" /> Estimating file size...</div>}
                {videoMetadata?.duration && (
                  <p className="text-sm text-foreground">
                    <b>Video Duration:</b>{" "}
                    {secondsToTimestamp(videoMetadata.duration)}
                  </p>
                )}
                {videoMetadata?.width && videoMetadata?.height && (
                  <div className="text-sm text-foreground">
                    <b>Resolution:</b>{" "}
                    {cOptions.scale && cOptions.scale !== 1 ? (
                      <>
                        <p className="inline-block line-through">
                          {videoMetadata.width}x${videoMetadata.height}
                        </p>{" "}
                        <span>
                          {(videoMetadata.width * cOptions.scale).toFixed(0)}x
                          {(videoMetadata.height * cOptions.scale).toFixed(0)}
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
      </div>
    </main>
  );
}
