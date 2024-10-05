"use client";

import Confetti from "react-confetti";
import Dropzone from "@/components/ui/dropzone";
import { ExclamationTriangleIcon, ReloadIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  GenerateIconsOptions,
  useFaviconGenerator,
} from "./hooks/use-favicon-generator";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { downloadFile } from "@/lib/download-file";
import { Checkbox } from "@/components/ui/checkbox";
import { Instructions } from "./components/instructions";
import { cn } from "@/lib/utils";
import ColorPicker from "@/components/ui/color-picker";

const faviconSizeOptions = [16, 32, 48, 64, 128, 256, 512];

export default function FaviconGenerator() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<GenerateIconsOptions>({
    faviconSizes: [16, 32, 48, 256],
    themeColor: "#000000",
    backgroundColor: "#ffffff",
  });

  const {
    error,
    isGenerating,
    isLoading: isFaviconGeneratorLoading,
    isReady: isFaviconGeneratorReady,
    generateIcons,
  } = useFaviconGenerator();

  const handleFileAccepted = (file: File) => {
    setFiles([file]);
  };

  const handleFaviconSizesChange = (size: number) => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      faviconSizes: prevOptions.faviconSizes.includes(size)
        ? prevOptions.faviconSizes.filter((s) => s !== size)
        : [...prevOptions.faviconSizes, size],
    }));
  };

  const handleGenerateFavicon = async () => {
    if (files.length === 0) return;
    const result = await generateIcons(files[0], options);
    if (result) {
      downloadFile(result, "icons.zip");
      setShowConfetti(true);
      setIsGenerated(true);
    }
  };

  const isDisabled = isGenerating || isFaviconGeneratorLoading;

  return (
    <div className="grow flex flex-col gap-4 h-full w-full md:overflow-hidden">
      <h1 className="text-2xl font-bold">Favicon Generator</h1>
      <div className="grow grid items-start md:grid-cols-3 gap-4 w-full h-full mx-auto md:overflow-hidden">
        <div
          className={cn(
            "flex flex-col gap-2 md:col-span-2 border p-2 rounded-md bg-card h-full min-h-[300px] overflow-x-auto transition-all duration-200",
            isGenerated && "md:col-span-3"
          )}
        >
          <div className="relative flex w-full items-center justify-center h-full md:overflow-hidden">
            {isGenerated && (
              <div className="w-full h-full">
                <Instructions options={options} />
              </div>
            )}
            {!isGenerated && files.length === 0 && isFaviconGeneratorReady && (
              <Dropzone
                containerClassName="w-full h-full"
                dropZoneClassName="w-full h-full"
                filesUploaded={files}
                setFilesUploaded={setFiles}
                maxFiles={1}
                maxSize={1024 * 1024 * 2}
                accept={{
                  "image/jpeg": [".jpeg", ".jpg"],
                  "image/png": [".png"],
                  "image/webp": [".webp"],
                }}
                onDropAccepted={(files) => handleFileAccepted(files[0])}
              />
            )}
            {isFaviconGeneratorLoading && (
              <Spinner className="absolute inset-0 m-auto w-12 h-12" />
            )}
            {!isGenerated && files.length > 0 && (
              <div className="relative w-full h-full flex bg-black rounded-md md:overflow-hidden">
                <Image
                  src={URL.createObjectURL(files[0])}
                  alt="Uploaded file"
                  className="w-full h-full object-contain"
                  fill
                />
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
        {!isGenerated && (
          <aside className="flex flex-col col-span-1 gap-4 h-full">
            <div className="flex flex-col gap-2 border bg-card p-4 rounded-md">
              <h2 className="text-xl font-semibold">Settings</h2>
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-bold">Theme Color</h3>
                <ColorPicker
                  value={options.themeColor}
                  onChange={(color) =>
                    setOptions((prevOptions) => ({
                      ...prevOptions,
                      themeColor: color,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-bold">Background Color</h3>
                <ColorPicker
                  value={options.backgroundColor}
                  onChange={(color) =>
                    setOptions((prevOptions) => ({
                      ...prevOptions,
                      backgroundColor: color,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-bold">Favicon sizes</h3>
                {faviconSizeOptions.map((size) => (
                  <div key={size} className="flex items-center space-x-2">
                    <Checkbox
                      id={`faviconSize-${size}`}
                      disabled={isDisabled}
                      checked={options.faviconSizes.includes(size)}
                      onCheckedChange={() => handleFaviconSizesChange(size)}
                    />
                    <label
                      htmlFor={`faviconSize-${size}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {size}x{size}px
                    </label>
                  </div>
                ))}
                <p className="text-sm text-gray-500">
                  The selected sizes will be embedded into the generated .ico
                  file
                </p>
              </div>
            </div>
            <AnimatePresence>
              {files && files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-2 mt-auto border bg-card p-4 rounded-md"
                >
                  <Button
                    className="flex-1"
                    onClick={handleGenerateFavicon}
                    disabled={isDisabled || files.length === 0}
                  >
                    {isGenerating && (
                      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isGenerating ? "Working on it..." : "Generate"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        )}
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
