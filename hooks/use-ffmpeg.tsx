"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { isWasmSupported } from "@/lib/is-wasm-supported";

export type TranscodeOptions = {
  codec?: string;
  crf?: string;
  format?: string;
  width?: number;
};

export type TranscodeOutput = {
  file: Blob;
  name: string;
};

export type ThumbnailOutput = {
  thumbnail: Blob;
  frame: Blob;
};

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();

export const useFfmpeg = () => {
  const ffmpegRef = useRef<FFmpeg | null>(null);

  if (ffmpegRef.current === null && typeof window !== "undefined") {
    ffmpegRef.current = new FFmpeg();
  }

  const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false);
  const [isFfmpegLoading, setIsFfmpegLoading] = useState(false);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<{ type: string; message: string } | null>(
    null
  );

  const load = useCallback(
    async (customBaseURL?: string) => {
      if (!ffmpegRef.current) {
        console.error("FFmpeg instance is not available.");
        return;
      }

      console.log("🔄 Loading ffmpeg...");

      const baseURL =
        customBaseURL || "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd";

      const ffmpeg = ffmpegRef.current;

      ffmpeg.on("log", ({ message }) => {
        console.info("FFMPEG Log:", message);
      });

      ffmpeg.on("progress", ({ progress }) => {
        setProgress(progress);
      });

      try {
        // toBlobURL is used to bypass CORS issues
        setIsFfmpegLoading(true);
        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript"
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm"
          ),
          workerURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.worker.js`,
            "text/javascript"
          ),
        });
        setIsFfmpegLoaded(true);
      } catch (error) {
        console.error("Failed to load ffmpeg:", error);
        throw error;
      } finally {
        setIsFfmpegLoading(false);
      }
    },
    [ffmpegRef]
  );

  const transcode = useCallback(
    async (
      file: File,
      options: TranscodeOptions = {}
    ): Promise<TranscodeOutput | null> => {
      if (!ffmpegRef.current) {
        throw new Error("FFmpeg not loaded");
      }

      if (isTranscoding || isEstimating) {
        console.log("Transcoding in progress, skipping thumbnail extraction");
        return null;
      }

      const ffmpeg = ffmpegRef.current;

      const { codec = "libx264", crf = "34", format = "mp4", width } = options;

      const sanitizedInputFileName = sanitizeFileName(file.name);
      const outputFileName = `${sanitizedInputFileName
        .split(".")
        .slice(0, -1)
        .join(".")}-compressed.${format}`;

      try {
        setProgress(0);
        setIsTranscoding(true);

        // Write the input file to ffmpeg's virtual file system
        await ffmpeg.writeFile(sanitizedInputFileName, await fetchFile(file));

        // Execute the ffmpeg command with user-defined options
        const args = ["-c:v", codec, "-crf", crf];

        if (width) {
          args.push("-vf", `scale=${width}:-2`);
        }

        const result = await ffmpeg.exec([
          "-i",
          sanitizedInputFileName,
          ...args,
          outputFileName,
        ]);

        if (result !== 0) {
          console.error("Video compression error:", result);
          setError({
            type: "Video compression error",
            message: "The resulting file may be too large to process.",
          });
          return null;
        }

        // Read the output file from ffmpeg's virtual file system
        const fileData = await ffmpeg.readFile(outputFileName);
        const data = new Uint8Array(fileData as ArrayBuffer);
        setProgress(1); // Transcoding complete

        // Return the transcoded file as a Blob

        return {
          file: new Blob([data.buffer], {
            type: `video/${format}`,
          }),
          name: outputFileName,
        };
      } catch (error) {
        console.error("Transcoding error:", error);
        throw error;
      } finally {
        // Clean up the virtual file system
        await ffmpeg.deleteFile(sanitizedInputFileName);
        await ffmpeg.deleteFile(outputFileName);
        setIsTranscoding(false);
      }
    },
    [ffmpegRef, isTranscoding, isEstimating]
  );

  const extractThumbnail = useCallback(
    async (
      file: File,
      options: TranscodeOptions = {}
    ): Promise<ThumbnailOutput | null> => {
      if (!ffmpegRef.current) {
        throw new Error("FFmpeg not loaded");
      }

      if (isTranscoding || isEstimating) {
        console.log("Transcoding in progress, skipping thumbnail extraction");
        return null;
      }

      const { crf = "34", codec = "libx264", width } = options;

      const ffmpeg = ffmpegRef.current;

      const sanitizedInputFileName = sanitizeFileName(file.name);
      const tempFileName = "temp.mp4"; // Temporary video for thumbnail
      const outputImageFileName = "thumb"; // Output image file name

      try {
        setError(null);
        // Write the input file to ffmpeg's virtual file system
        await ffmpeg.writeFile(sanitizedInputFileName, await fetchFile(file));

        // Create 1 frame long video from the input file
        const args = ["-c:v", codec, "-crf", crf];

        if (width) {
          args.push("-vf", `scale=${width}:-2`);
        }

        console.log("🚀 ~ useFfmpeg ~ args:", args);

        const tempThumbResult = await ffmpeg.exec([
          "-i",
          sanitizedInputFileName,
          "-frames:v",
          "1",
          ...args,
          tempFileName,
        ]);

        if (tempThumbResult !== 0) {
          console.error("Thumbnail extraction error:", tempThumbResult);
          setError({
            type: "Thumbnail extraction error",
            message: "The resulting file may be too large to process.",
          });
          return null;
        }

        // Execute ffmpeg command to extract a frame at the specified time offset
        const thumbResult = await ffmpeg.exec([
          "-i",
          tempFileName,
          "-frames:v",
          "1",
          "-f",
          "image2",
          "-update",
          "1",
          "-c:v",
          "libwebp",
          "-crf",
          crf,
          "-preset",
          "picture",
          outputImageFileName,
        ]);

        if (thumbResult !== 0) {
          console.error("Thumbnail extraction error:", tempThumbResult);
          setError({
            type: "Thumbnail extraction error",
            message: "The resulting file may be too large to process.",
          });
          return null;
        }

        // Read the output image file from ffmpeg's virtual file system
        const fileData = await ffmpeg.readFile(outputImageFileName);
        const tempFileData = await ffmpeg.readFile(tempFileName);

        const tempData = new Uint8Array(tempFileData as ArrayBuffer);
        const data = new Uint8Array(fileData as ArrayBuffer);

        const output = {
          thumbnail: new Blob([data.buffer], {
            type: "image/webp",
          }),
          frame: new Blob([tempData.buffer], {
            type: "video/mp4",
          }),
        };
        // Return the image data as a Blob
        return output;
      } catch (error) {
        console.error("Thumbnail extraction error:", error);
        throw error;
      } finally {
        console.log("FINALLY");
        // Clean up the virtual file system
        await ffmpeg.deleteFile(tempFileName);
        await ffmpeg.deleteFile(sanitizedInputFileName);
        await ffmpeg.deleteFile(outputImageFileName);
      }
    },
    [ffmpegRef, isTranscoding, isEstimating]
  );

  const estimateSize = useCallback(
    async (
      file: File,
      options: TranscodeOptions = {}
    ): Promise<number | null> => {
      if (!ffmpegRef.current) {
        throw new Error("FFmpeg not loaded");
      }

      if(isTranscoding || isEstimating) {
        console.log("Transcoding in progress, skipping size estimation");
        return null;
      }

      const ffmpeg = ffmpegRef.current;
      const sanitizedInputFileName = sanitizeFileName(file.name) + "_estimate";
      const outputFileName = `${sanitizedInputFileName}-estimate.mp4`;

      const { crf = "34", codec = "libx264", width } = options;

      try {
        setIsEstimating(true);
  
        await ffmpeg.writeFile(
          sanitizedInputFileName,
          await fetchFile(file)
        );

        const args = ["-c:v", codec, "-crf", crf];

        if (width) {
          args.push("-vf", `scale=${width}:-2`);
        }

        const result = await ffmpeg.exec([
          "-i",
          sanitizedInputFileName,
          ...args,
          "-t",
          "1",
          outputFileName,
        ]);

        if (result !== 0) {
          console.error("Thumbnail extraction error:", result);
          setError({
            type: "Estimate size error",
            message: "The resulting file may be too large to process.",
          });
          return null;
        }

        const fileData = await ffmpeg.readFile(outputFileName);
        const data = new Uint8Array(fileData as ArrayBuffer);
        const blob = new Blob([data.buffer], {
          type: `video/mp4`,
        });

        return blob.size;
      } catch (error) {
        console.error("Estimate size error:", error);
        throw error;
      } finally {
        setIsEstimating(false);
        await ffmpeg.deleteFile(sanitizedInputFileName);
      }
    },
    [ffmpegRef, isTranscoding, isEstimating]
  );

  useEffect(() => {
    if (!isWasmSupported()) {
      console.error("Your browser doesn't support WebAssembly.");
      return;
    }

    const isLoaded = ffmpegRef.current?.loaded;

    if (!isLoaded) {
      void load();
    }
  }, [load]);

  return {
    isFfmpegLoading,
    isFfmpegLoaded,
    isTranscoding,
    isEstimating,
    estimateSize,
    progress,
    load,
    transcode,
    extractThumbnail,
    error,
  };
};
