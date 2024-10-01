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
import { qualityToCrf } from "@/lib/quality-to-crf";
import { useRef, useState } from "react";
import { downloadFile } from "@/lib/download-file";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Preview } from "@/components/core/preview";
import { PresetOptions, TranscodeOptions } from "./services/ffmpeg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CompressionOptions = {
  quality: number;
  preset: PresetOptions;
  fps: number;
  width?: number;
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
  {
    name: "Slower",
    value: "slower",
  },
  {
    name: "Veryslow",
    value: "veryslow",
  },
];

export default function Dashboard() {
  const [files, setFiles] = useState<File[]>([]);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [thumbnail, setThumbnail] = useState<Thumbnail | null>(null);
  const [originalThumbnail, setOriginalThumbnail] = useState<Thumbnail | null>(
    null
  );
  const [imageUploading, setImageUploading] = useState(false);
  const debounceQualityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [cOptions, setCOptions] = useState<CompressionOptions>({
    quality: 70,
    preset: "superfast",
    fps: 30,
  });

  const {
    error,
    isLoaded: isFfmpegLoaded,
    isLoading: isFfmpegLoading,
    extractThumbnail,
    isTranscoding,
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

    const options: TranscodeOptions = {
      crf: qualityToCrf(cOptions.quality).toString(),
      preset: cOptions.preset,
      fps: cOptions.fps,
      ...(cOptions.width && cOptions.width > 0 && { width: cOptions.width }),
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
      await handleProcessThumbnail(
        file,
        { quality: 100, width: 0, preset: "medium", fps: 1 },
        setOriginalThumbnail
      );
      setImageUploading(false);
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

    const { quality, width, preset, fps } = options;

    const transcodeOptions = {
      crf: qualityToCrf(quality).toString(),
      preset,
      fps,
      ...(width && width > 0 && { width }),
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

  const debouncedHandleProcessThumbnail = (options: CompressionOptions) => {
    if (files.length > 0) {
      if (debounceQualityTimerRef.current) {
        clearTimeout(debounceQualityTimerRef.current);
      }

      debounceQualityTimerRef.current = setTimeout(() => {
        handleProcessThumbnail(files[0], options, setThumbnail);
      }, 300);
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

  const handleWidthChange = (value: string) => {
    const width = parseInt(value);
    const newOptions = {
      ...cOptions,
      width: width,
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
    }
  };

  const isDisabled = !isFfmpegLoaded || isTranscoding;

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
                  Compression speed. A slower preset will provide slightly better compression, but will take
                  longer to process.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="width">Video Width</Label>
                <Input
                  disabled={isDisabled}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  value={cOptions.width}
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
              {/* <div className="flex items-center gap-2">
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
              </div> */}

              <Button
                onClick={handleTranscode}
                disabled={isDisabled || files.length === 0}
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
