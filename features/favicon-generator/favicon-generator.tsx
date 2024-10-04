"use client";

import Confetti from "react-confetti";
import Dropzone from "@/components/ui/dropzone";
import { ExclamationTriangleIcon, ReloadIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useFaviconGenerator } from "./hooks/use-favicon-generator";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { downloadFile } from "@/lib/download-file";

export default function FaviconGenerator() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const {
    error,
    isGenerating,
    isLoading: isFaviconGeneratorLoading,
    isReady: isFaviconGeneratorReady,
    generateFavIcon,
  } = useFaviconGenerator();
  console.log(
    "🚀 ~ FaviconGenerator ~ isFaviconGeneratorReady:",
    isFaviconGeneratorReady
  );
  console.log(
    "🚀 ~ FaviconGenerator ~ isFaviconGeneratorLoading:",
    isFaviconGeneratorLoading
  );
  console.log("🚀 ~ FaviconGenerator ~ error:", error);

  const handleFileAccepted = (file: File) => {
    setFiles([file]);
  };

  const handleGenerateFavicon = async () => {
    if (files.length === 0) return;
    const result = await generateFavIcon(files[0]);
    if (result) {
      downloadFile(result, "favicon.ico");
      setShowConfetti(true);
    }
    console.log("🚀 ~ handleGenerateFavicon ~ result:", result);
  };

  const isDisabled = isGenerating || isFaviconGeneratorLoading;

  return (
    <div className="grow flex flex-col gap-4 h-full w-full overflow-hidden">
      <h1 className="text-2xl font-bold">The FavIcon generator</h1>
      <div className="grow grid items-start md:grid-cols-3 gap-4 w-full h-full mx-auto overflow-hidden">
        <div className="flex flex-col gap-2 md:col-span-2 border p-2 rounded-md bg-card h-full min-h-[300px] max-h-[847px]">
          <div className="relative flex items-center justify-center h-full">
            {files.length === 0 && isFaviconGeneratorReady && (
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
                // disabled={isDisabled}
              />
            )}
            {isFaviconGeneratorLoading && (
              <Spinner className="absolute inset-0 m-auto w-12 h-12" />
            )}
            {files.length > 0 && (
              <div className="relative w-full h-full flex bg-black rounded-md overflow-hidden">
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
        <aside className="flex flex-col col-span-1 gap-4 h-full overflow-auto">
          <div className="flex flex-col gap-2 border bg-card p-4 rounded-md md:h-full md:overflow-y-auto">
            <h2 className="text-xl font-semibold">Settings</h2>
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
