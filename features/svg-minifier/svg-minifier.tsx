"use client";

import Dropzone from "@/components/ui/dropzone";
import { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { MinifierOptions, useSvgMinifier } from "./hooks/use-svg-minifier";
import { SVGCompare } from "./components/svg-compare";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SvgMinifier() {
  const [files, setFiles] = useState<File[]>([]);
  const { minifiedSvg, isMinifying, error, minifySvg } = useSvgMinifier();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [options, setOptions] = useState<MinifierOptions>({
    floatPrecision: 1,
  });

  console.log("🚀 ~ SvgMinifier ~ isMinifying:", isMinifying)

  const handleMinify = useCallback(
    async (file: File) => {
      const result = await minifySvg(file, options);
      console.log(result);
    },
    [minifySvg, options]
  );

  const handleFileAccepted = (file: File) => {
    setFiles([file]);
    handleMinify(file);
  };

  const handleOptionChange = (option: keyof MinifierOptions, value: number) => {
    setOptions((prev) => ({ ...prev, [option]: value }));
    if (files.length > 0) {
      handleMinifyDebounced(files[0]);
    }
  };

  const handleMinifyDebounced = useCallback(
    (file: File) => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
        handleMinify(file);
      }, 1000);
    },
    [handleMinify]
  );

  const gotFiles = files.length > 0;

  const originalSrc = useMemo(() => {
    if (files.length > 0) {
      return URL.createObjectURL(files[0]);
    }
    return "";
  }, [files]);

  const minifiedSrc = useMemo(() => {
    if (minifiedSvg) {
      return URL.createObjectURL(
        new Blob([minifiedSvg], { type: "image/svg+xml" })
      );
    }
    return "";
  }, [minifiedSvg]);

  return (
    <div className="grow flex flex-col gap-4 h-full w-full md:overflow-hidden">
      <h1 className="text-2xl font-bold">SVG Minifier</h1>
      <div className="grow grid items-start md:grid-cols-3 gap-4 w-full h-full mx-auto md:overflow-hidden">
        <div
          className={cn(
            "flex flex-col gap-2 md:col-span-2 border p-2 rounded-md bg-card h-full min-h-[300px] overflow-x-auto transition-all duration-200"
          )}
        >
          <div className="relative flex w-full items-center justify-center h-full md:overflow-hidden">
            {!gotFiles && (
              <Dropzone
                containerClassName="w-full h-full"
                dropZoneClassName="w-full h-full"
                filesUploaded={files}
                setFilesUploaded={setFiles}
                maxFiles={1}
                accept={{
                  "image/svg+xml": [".svg"],
                }}
                onDropAccepted={(files) => handleFileAccepted(files[0])}
              />
            )}
            {gotFiles && (
              <div className="relative w-full h-full">
                <SVGCompare original={originalSrc} minified={minifiedSrc} />
                <Button
                  size="icon"
                  onClick={() => setFiles([])}
                  className="absolute top-4 right-4"
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
              </div>
            )}
            {isMinifying && (
              <AnimatePresence>
                <motion.div
                  className="absolute bottom-1 left-1 backdrop-blur p-1 px-2 rounded-md bg-black bg-opacity-50 flex items-center gap-2"
                  initial={{ opacity: 0, transform: "translateY(10%)" }}
                  animate={{ opacity: 1, transform: "translateY(0%)" }}
                  exit={{ opacity: 0, transform: "translateY(10%)" }}
                >
                  <Spinner className="border-white w-4 h-4 border-2" />
                  <span className="text-sm text-white">Generating preview</span>
                </motion.div>
              </AnimatePresence>
            )}
            {/* {isFaviconGeneratorLoading && (
              <Spinner className="absolute inset-0 m-auto w-12 h-12" />
            )} */}
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

        <aside className="flex flex-col col-span-1 gap-4 h-full">
          <div className="flex flex-col gap-2 border bg-card p-4 rounded-md">
            <h2 className="text-xl font-semibold">Settings</h2>
            <div className="flex flex-col gap-2">
              <Label className="text-base font-bold" htmlFor="precision">
                Precision
              </Label>
              <Slider
                name="p"
                id="precision"
                min={0.01}
                max={10}
                step={0.01}
                defaultValue={[options.floatPrecision]}
                value={[options.floatPrecision]}
                onValueChange={(value) => {
                  handleOptionChange("floatPrecision", value[0]);
                }}
              />
              <p className="text-sm text-gray-500">
                Lower quality will result in smaller file size. At maximum
                quality the video will still be compressed with minimum impact
                on quality.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
