"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Dropzone from "@/components/ui/dropzone";
import { TrashIcon } from "@radix-ui/react-icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import useCompressorStore from "./hooks/use-image-compressor";
import { ImageCompressorOptions } from "@/services/image-compressor";
import { ImagePreview } from "./components/image-preview";
import { ImageCompressionSettings } from "./components/image-compression-settings";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageMetadataDisplay } from "./components/image-metadata";
import { Spinner } from "@/components/ui/spinner";

export default function ImageCompressor() {
  const debouncePreviewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCompressing = useCompressorStore((s) => s.isCompressing);
  const processAll = useCompressorStore((s) => s.processAll);
  const processImage = useCompressorStore((s) => s.processImage);
  const setFiles = useCompressorStore((s) => s.setFiles);
  const files = useCompressorStore((s) => s.files);
  const activeImage = useCompressorStore((s) => s.activeImage);
  const isAutoCompressing = useCompressorStore((s) => s.isAutoCompressing);

  const debouncedProcessAll = () => {
    if (!isAutoCompressing) return;
    if (debouncePreviewTimerRef.current) {
      clearTimeout(debouncePreviewTimerRef.current);
    }

    debouncePreviewTimerRef.current = setTimeout(() => {
      processAll();
    }, 300);
  };

  const debouncedProcessImage = (key: string) => {
    if (key) {
      if (debouncePreviewTimerRef.current) {
        clearTimeout(debouncePreviewTimerRef.current);
      }

      debouncePreviewTimerRef.current = setTimeout(() => {
        processImage(key);
      }, 300);
    }
  };

  const handleDropAccepted = async (newFiles: File[]) => {
    setFiles(newFiles);

    // TODO: Be smart and do this based on file size
    if (!isAutoCompressing) return;
    await processAll();
  };

  return (
    <div className="grow flex flex-col gap-4 h-full w-full overflow-hidden">
      <h1 className="text-2xl font-bold">Image Compressor</h1>
      <div className="grow grid items-start md:grid-cols-3 gap-4 w-full h-full mx-auto overflow-hidden">
        <div className="relative flex flex-col gap-2 md:col-span-2 border p-2 rounded-md bg-card h-full min-h-[300px] max-h-[847px]">
          <div className="relative flex items-center justify-center h-full">
            {files.length === 0 && (
              <Dropzone
                containerClassName="w-full h-full"
                dropZoneClassName="w-full h-full"
                filesUploaded={files}
                setFilesUploaded={(files: File[]) => setFiles(files)}
                onDropAccepted={handleDropAccepted}
                maxSize={1024 * 1024 * 1024 * 2}
                accept={{
                  "image/jpeg": [".jpg", ".jpeg"],
                  "image/png": [".png"],
                  "image/webp": [".webp"],
                  "image/avif": [".avif"],
                  "image/heic": [".heic"],
                  "image/heif": [".heif"],
                }}
              />
            )}
            {files.length > 0 && (
              <div className="relative w-full h-full flex bg-black rounded-md overflow-hidden">
                <ImagePreview />
                <Button
                  size="icon"
                  onClick={() => setFiles([])}
                  className="absolute top-4 right-4"
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
          {isCompressing && files.length > 1 && (
            <AnimatePresence>
              <motion.div
                className="absolute bottom-0 left-0 w-full p-2"
                initial={{ opacity: 0, transform: "translateY(10%)" }}
                animate={{ opacity: 1, transform: "translateY(0%)" }}
                exit={{ opacity: 0, transform: "translateY(10%)" }}
              >
                <CompressionProgress />
              </motion.div>
            </AnimatePresence>
          )}
          {isCompressing && files.length === 1 && (
            <AnimatePresence>
              <motion.div
                className="absolute bottom-1 left-1 backdrop-blur p-1 px-2 rounded-md bg-black bg-opacity-50 flex items-center gap-2"
                initial={{ opacity: 0, transform: "translateY(10%)" }}
                animate={{ opacity: 1, transform: "translateY(0%)" }}
                exit={{ opacity: 0, transform: "translateY(10%)" }}
              >
                <Spinner className="border-white w-4 h-4 border-2" />
                <span className="text-sm text-white">Compressing Image</span>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        <aside className="flex flex-col col-span-1 gap-4 h-full overflow-hidden">
          <div className="flex flex-col p-1 border bg-card rounded-md overflow-hidden">
            <ScrollArea>
              <div className="flex p-3 flex-col gap-2 grow">
                <h2 className="text-xl font-semibold">Default Settings</h2>
                <DefaultCompressionSettings
                  onOptionsChange={debouncedProcessAll}
                />
              </div>
            </ScrollArea>
          </div>

          {files.length > 1 && activeImage && (
            <div className="flex flex-col p-1 border bg-card rounded-md overflow-hidden">
              <ScrollArea>
                <div className="flex p-3 flex-col gap-2 grow">
                  <h2 className="text-xl font-semibold">Image Settings</h2>
                  <ImageSpecificCompressionSettings
                    onOptionsChange={() => debouncedProcessImage(activeImage)}
                  />
                  <p className="text-sm text-muted-foreground">
                    These settings will be used for the selected image.
                  </p>
                </div>
              </ScrollArea>
            </div>
          )}
          {files.length > 0 && (
            <div className="flex flex-col gap-2 border bg-card p-4 rounded-md">
              <h2 className="text-xl font-semibold">Details</h2>
              <ImageMetadataDisplay />
            </div>
          )}
          {files.length === 0 && (
            <div className="flex flex-col border bg-card p-1 rounded-md md:min-h-[130px] overflow-hidden">
              <ScrollArea className="p-3">
                <h2 className="text-xl font-semibold pb-2">💡 Good to know</h2>
                <div className="flex flex-col gap-2">
                  <p className="text-sm">
                    The compression runs entirely in your browser. No data is
                    stored on the server. Because of this, there are some
                    limitations of speed and file size.
                  </p>
                </div>
              </ScrollArea>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

type ImageCompressionSettingsProps = {
  onOptionsChange: (options: ImageCompressorOptions) => void;
};

const ImageSpecificCompressionSettings = (
  props: ImageCompressionSettingsProps
) => {
  const { onOptionsChange } = props;
  const activeImage = useCompressorStore((s) => s.activeImage);
  const defaultOptions = useCompressorStore((s) => s.defaultOptions);
  const imageSpecificOptions = useCompressorStore(
    (s) => s.imageSpecificOptions
  );
  const setImageSpecificOptions = useCompressorStore(
    (s) => s.setImageSpecificOptions
  );

  if (!activeImage) return null;
  return (
    <ImageCompressionSettings
      options={imageSpecificOptions[activeImage] || defaultOptions}
      onOptionsChange={(options) => {
        onOptionsChange(options);
        setImageSpecificOptions(activeImage, options);
      }}
    />
  );
};

const DefaultCompressionSettings = (props: ImageCompressionSettingsProps) => {
  const { onOptionsChange } = props;
  const processAll = useCompressorStore((s) => s.processAll);
  const isAutoCompressing = useCompressorStore((s) => s.isAutoCompressing);
  const setIsAutoCompressing = useCompressorStore(
    (s) => s.setIsAutoCompressing
  );
  const defaultOptions = useCompressorStore((s) => s.defaultOptions);
  const handleDefaultOptionsChange = useCompressorStore(
    (s) => s.setDefaultOptions
  );
  return (
    <ImageCompressionSettings
      options={defaultOptions}
      onOptionsChange={(options) => {
        onOptionsChange(options);
        handleDefaultOptionsChange(options);
      }}
    >
      <p className="text-sm text-muted-foreground">
        These settings will be used for all images unless otherwise specified.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label className="text-base font-bold" htmlFor="autocompress">
          Auto Compress
        </Label>
        <div className="flex items-center gap-3">
          <Switch
            id="autocompress"
            checked={isAutoCompressing}
            onCheckedChange={(checked) => {
              setIsAutoCompressing(checked);
              if (checked) {
                processAll();
              }
            }}
          />
          <p className="text-sm text-muted-foreground">
            Automatically compress when changing options
          </p>
        </div>
      </div>
    </ImageCompressionSettings>
  );
};

const CompressionProgress = () => {
  const progress = useCompressorStore((s) => s.progress);
  return (
    <Progress
      className="w-full"
      value={(progress.completed / progress.total) * 100}
    />
  );
};
