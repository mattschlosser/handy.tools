"use client";

import { getRandomId } from "@/lib/get-random-id";
import { getVideoMetadata } from "@/features/compression/lib/get-video-metadata";
import { qualityToCrf } from "@/features/compression/lib/quality-to-crf";
import { FFmpeg, FFFSType } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { secondsToTimestamp } from "@/features/compression/lib/seconds-to-timestamp";
import { timestampToSeconds } from "@/features/compression/lib/timestamp-to-seconds";

export type PresetOptions =
  | "ultrafast"
  | "superfast"
  | "veryfast"
  | "faster"
  | "fast"
  | "medium"
  | "slow"
  | "slower"
  | "veryslow";

export type TranscodeOptions = {
  codec?: string;
  quality?: number;
  format?: string;
  scale?: number;
  width?: number;
  height?: number;
  /**
   * Where to start the video from, Format: hh:mm:ss
   */
  trimStart?: string;
  trimEnd?: string;
  preset?: PresetOptions;
  fps?: number;
  removeAudio?: boolean;
  previewDuration?: number;
};

export type TranscodeOutput = {
  file: Blob;
  name: string;
};

export type ThumbnailOutput = {
  thumbnail: Blob;
};

export type PreviewOutput = {
  original: Blob;
  compressed: Blob;
  estimatedSize: number;
};

const DEFAULT_PREVIEW_DURATION = 3;
const DEFAULT_CODEC = "libx264";
const DEFAULT_QUALITY = 100;
const DEFAULT_SCALE = 1;
const DEFAULT_REMOVE_AUDIO = false;
const DEFAULT_FPS = 30;
const INPUT_DIR = "/input";
const TIMEOUT = -1;

/**
 * Sanitizes a filename by replacing non-alphanumeric characters with underscores
 * and converting to lowercase
 * @param name - The original filename
 * @returns The sanitized filename
 */
const sanitizeFileName = (name: string) =>
  name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();

export class FFmpegService {
  public ffmpeg: FFmpeg;
  private abortController: AbortController | null = null;
  private durationRatio: number = 1;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  /**
   * Loads the FFmpeg core, WebAssembly, and worker files
   * @param baseURL - Base URL for loading FFmpeg assets
   */
  async load(baseURL = ""): Promise<void> {
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });
  }
  

  /**
   * 
   * @returns Timestamp of duration if set in options, in format HH:mm:ss
   */
  calculateDurationFromOptions(options: TranscodeOptions): number | null {
    const { trimStart, trimEnd } = options;
    if (trimEnd) {
      // convert trim end relative to trim start, which is possibly ss, mm:ss, or  HH:mm:ss, if trim start exists
      if (trimStart) {
        const startSeocnds = timestampToSeconds(trimStart);
        const endSeconds = timestampToSeconds(trimEnd);
        const duration = endSeconds - startSeocnds;
        return Math.max(0, duration);
      }
      return timestampToSeconds(trimEnd);
    }
    return null;
  }

  getDurationRatio() {
    return this.durationRatio;
  }

  /**
   * Converts transcode options into FFmpeg input arguments
   * @param options - Transcoding options including codec, quality, scale, etc.
   * @returns Array of FFmpeg input arguments
   */
  async transcodeOptionsToInputArgs(file: File, options: TranscodeOptions) {
    const { trimStart } = options;
    const args: string[] = [];

    if (trimStart) {
      args.push("-ss", trimStart);
    }

    const duration = this.calculateDurationFromOptions(options);
    if (duration) {
        // we are trimming the video, we need to set the duration ratio
      let metadata = await getVideoMetadata(file);
      this.durationRatio = duration / metadata.duration;
      args.push("-t", duration.toString());
    } else {
      this.durationRatio = 1;
    }

    return args;
  }

  /**
   * Converts transcode options into FFmpeg command line arguments
   * @param options - Transcoding options including codec, quality, scale, etc.
   * @returns Array of FFmpeg command arguments
   */
  transcodeOptionsToArgs(options: TranscodeOptions) {
    const {
      codec = DEFAULT_CODEC,
      quality = DEFAULT_QUALITY,
      scale = DEFAULT_SCALE,
      fps = DEFAULT_FPS,
      removeAudio = DEFAULT_REMOVE_AUDIO,
      preset,
    } = options;

    const args = ["-threads", `${navigator.hardwareConcurrency || 2}`];

    if (removeAudio) {
      args.push("-an");
    } else {
      args.push("-c:a", "copy");
    }

    if (codec) {
      args.push("-c:v", codec);
    }

    if (quality) {
      args.push("-crf", qualityToCrf(quality).toString());
    }

    if (scale && scale < 1) {
      const scaledWidth = `round(iw*${scale}/2)*2`;
      args.push("-vf", `scale=${scaledWidth}:-2`);
    } else if (options.width && options.height) {
      args.push("-vf", `scale=${options.width}:${options.height}`);
    } else if (options.width) {
      args.push("-vf", `scale=${options.width}:-2`);
    }

    if (preset) {
      args.push("-preset", preset);
    }

    if (fps) {
      args.push("-r", `${fps}`);
    }

    console.log(`FFMPEG ARGS: ${args}`);

    return args;
  }

  /**
   * Transcodes a video file using specified options
   * @param file - Input video file
   * @param options - Transcoding options
   * @param signal - Optional AbortSignal for cancellation
   * @returns Promise containing the transcoded file and filename
   */
  async transcode(
    file: File,
    options: TranscodeOptions,
    signal?: AbortSignal
  ): Promise<TranscodeOutput> {
    this.abortController = new AbortController();
    const abortSignal = signal || this.abortController.signal;
    const sanitizedInputFileName = sanitizeFileName(file.name);
    const inputDir = `${INPUT_DIR}-${getRandomId()}`;
    const outputFileName = `${sanitizedInputFileName
      .split(".")
      .slice(0, -1)
      .join(".")}-compressed-${getRandomId()}.mp4`;

    await this.ffmpeg.createDir(inputDir);

    await this.ffmpeg.mount(FFFSType.WORKERFS, { files: [file] }, inputDir);

    const inputArgs = await this.transcodeOptionsToInputArgs(file, options);
    const args = this.transcodeOptionsToArgs(options);

    const result = await this.ffmpeg.exec(
      [...inputArgs, "-i", `${inputDir}/${file.name}`, ...args, outputFileName],
      TIMEOUT,
      { signal: abortSignal }
    );

    if (result !== 0) {
      await this.ffmpeg.unmount(inputDir);
      await this.ffmpeg.deleteDir(inputDir);
      throw new Error("Video compression error");
    }

    const fileData = await this.ffmpeg.readFile(outputFileName);
    const data = new Uint8Array(fileData as unknown as ArrayBuffer);

    await this.ffmpeg.deleteFile(outputFileName);
    await this.ffmpeg.unmount(inputDir);
    await this.ffmpeg.deleteDir(inputDir);

    return {
      file: new Blob([data.buffer], { type: `video/mp4` }),
      name: outputFileName,
    };
  }

  /**
   * Extracts a thumbnail from a video file
   * @param file - Input video file
   * @param signal - Optional AbortSignal for cancellation
   * @returns Promise containing the thumbnail (WebP)
   */
  async extractThumbnail(
    file: File,
    signal?: AbortSignal
  ): Promise<ThumbnailOutput> {
    this.abortController = new AbortController();
    const abortSignal = signal || this.abortController.signal;

    const outputImageFileName = `thumb-${getRandomId()}.webp`;
    const inputDir = `${INPUT_DIR}-${getRandomId()}`;

    await this.ffmpeg.createDir(inputDir);

    await this.ffmpeg.mount(FFFSType.WORKERFS, { files: [file] }, inputDir);

    const thumbResult = await this.ffmpeg.exec(
      [
        "-i",
        `${inputDir}/${file.name}`,
        "-frames:v",
        "1",
        "-f",
        "image2",
        "-update",
        "1",
        "-c:v",
        "libwebp",
        "-preset",
        "picture",
        outputImageFileName,
      ],
      TIMEOUT,
      { signal: abortSignal }
    );

    if (thumbResult !== 0) {
      await this.ffmpeg.unmount(inputDir);
      await this.ffmpeg.deleteDir(inputDir);
      throw new Error("Thumbnail extraction error");
    }

    const fileData = await this.ffmpeg.readFile(outputImageFileName);
    const data = new Uint8Array(fileData as unknown as ArrayBuffer);

    await this.ffmpeg.deleteFile(outputImageFileName);
    await this.ffmpeg.unmount(inputDir);
    await this.ffmpeg.deleteDir(inputDir);

    return {
      thumbnail: new Blob([data.buffer], { type: "image/webp" }),
    };
  }


  /**
   * Generates a preview of the video compression by processing a short segment
   * @param file - Input video file
   * @param options - Transcoding options
   * @param signal - Optional AbortSignal for cancellation
   * @returns Promise containing original and compressed previews, and estimated final size
   */
  async generatePreview(
    file: File,
    options: TranscodeOptions,
    signal?: AbortSignal
  ): Promise<PreviewOutput> {
    this.abortController = new AbortController();
    const abortSignal = signal || this.abortController.signal;

    const { duration: totalDuration, sizeMB: originalSizeMB } =
      await getVideoMetadata(file);
 
    const trimDuartionSeconds = this.calculateDurationFromOptions(options);

    const sampleDuration = Math.min(
      options.previewDuration || DEFAULT_PREVIEW_DURATION,
      trimDuartionSeconds || totalDuration
    );
    const sampleOutputFileName = `sample_output-${getRandomId()}.mp4`;
    const originalOutputFileName = `original_output-${getRandomId()}.mp4`;
    const inputDir = `${INPUT_DIR}-${getRandomId()}`;

    await this.ffmpeg.createDir(inputDir);

    await this.ffmpeg.mount(FFFSType.WORKERFS, { files: [file] }, inputDir);

    const args = this.transcodeOptionsToArgs(options);

    const result = await Promise.all([
      this.ffmpeg.exec(
        [
          "-ss",
          options?.trimStart ?? "0",
          "-i",
          `${inputDir}/${file.name}`,
          "-t",
          sampleDuration.toString(),
          "-c",
          "copy",
          originalOutputFileName,
        ],
        TIMEOUT,
        { signal: abortSignal }
      ),
      this.ffmpeg.exec(
        [
          "-ss",
          options?.trimStart ?? "0",
          "-i",
          `${inputDir}/${file.name}`,
          "-t",
          sampleDuration.toString(),
          ...args,
          sampleOutputFileName,
        ],
        TIMEOUT,
        { signal: abortSignal }
      ),
    ]);

    if (result.some((r) => r !== 0)) {
      await this.ffmpeg.unmount(inputDir);
      await this.ffmpeg.deleteDir(inputDir);
      throw new Error("Error encoding sample segment");
    }

    const sampleOutputData = await this.ffmpeg.readFile(sampleOutputFileName);
    const originalOutputData = await this.ffmpeg.readFile(
      originalOutputFileName
    );
    const sampleOutputSize = (sampleOutputData as Uint8Array).length;
    const originalOutputSize = (originalOutputData as Uint8Array).length;

    const durationRatio = trimDuartionSeconds ? trimDuartionSeconds / totalDuration : 1;
    const compressionRatio = sampleOutputSize / durationRatio / originalOutputSize;

    const estimatedSizeMB = originalSizeMB * compressionRatio * durationRatio;

    // Clean up
    await this.ffmpeg.deleteFile(sampleOutputFileName);
    await this.ffmpeg.deleteFile(originalOutputFileName);
    await this.ffmpeg.unmount(inputDir);
    await this.ffmpeg.deleteDir(inputDir);

    return {
      original: new Blob([originalOutputData], {
        type: "video/mp4",
      }),
      compressed: new Blob([sampleOutputData], {
        type: "video/mp4",
      }),
      estimatedSize: Math.round(estimatedSizeMB * 100) / 100, // Round to 2 decimal places,
    };
  }

  /**
   * Terminates the FFmpeg instance
   */
  terminate(): void {
    this.ffmpeg.terminate();
  }

  /**
   * Aborts any ongoing FFmpeg operations
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
