"use client";

import { getRandomId } from "@/lib/get-random-id";
import { getVideoMetadata } from "@/features/compression/lib/get-video-metadata";
import { qualityToCrf } from "@/features/compression/lib/quality-to-crf";
import { FFmpeg, FFFSType } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

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
  frame: Blob;
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

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();

export class FFmpegService {
  public ffmpeg: FFmpeg;
  private abortController: AbortController | null = null;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

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

  transcodeOptionsToArgs(options: TranscodeOptions) {
    const {
      codec = DEFAULT_CODEC,
      quality = DEFAULT_QUALITY,
      scale = DEFAULT_SCALE,
      fps = DEFAULT_FPS,
      removeAudio = DEFAULT_REMOVE_AUDIO,
      preset,
    } = options;

    const args = ["-threads", "2"];

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

    const args = this.transcodeOptionsToArgs(options);

    const result = await this.ffmpeg.exec(
      ["-i", `${inputDir}/${file.name}`, ...args, outputFileName],
      TIMEOUT,
      { signal: abortSignal }
    );

    if (result !== 0) {
      await this.ffmpeg.unmount(inputDir);
      await this.ffmpeg.deleteDir(inputDir);
      throw new Error("Video compression error");
    }

    const fileData = await this.ffmpeg.readFile(outputFileName);
    const data = new Uint8Array(fileData as ArrayBuffer);

    await this.ffmpeg.deleteFile(outputFileName);
    await this.ffmpeg.unmount(inputDir);
    await this.ffmpeg.deleteDir(inputDir);

    return {
      file: new Blob([data.buffer], { type: `video/mp4` }),
      name: outputFileName,
    };
  }

  async extractThumbnail(
    file: File,
    options: TranscodeOptions,
    signal?: AbortSignal
  ): Promise<ThumbnailOutput> {
    this.abortController = new AbortController();
    const abortSignal = signal || this.abortController.signal;

    const tempFileName = `temp-${getRandomId()}.mp4`;
    const outputImageFileName = `thumb-${getRandomId()}.webp`;
    const inputDir = `${INPUT_DIR}-${getRandomId()}`;

    await this.ffmpeg.createDir(inputDir);

    await this.ffmpeg.mount(FFFSType.WORKERFS, { files: [file] }, inputDir);

    const args = this.transcodeOptionsToArgs(options);

    const tempThumbResult = await this.ffmpeg.exec(
      [
        "-i",
        `${inputDir}/${file.name}`,
        "-frames:v",
        "1",
        ...args,
        tempFileName,
      ],
      TIMEOUT,
      { signal: abortSignal }
    );

    if (tempThumbResult !== 0) {
      await this.ffmpeg.unmount(inputDir);
      await this.ffmpeg.deleteDir(inputDir);
      throw new Error("Thumbnail extraction error");
    }

    const tempFileData = await this.ffmpeg.readFile(tempFileName);
    const tempData = new Uint8Array(tempFileData as ArrayBuffer);

    const thumbResult = await this.ffmpeg.exec(
      [
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
        "-preset",
        "picture",
        outputImageFileName,
      ],
      TIMEOUT,
      { signal: abortSignal }
    );

    if (thumbResult !== 0) {
      await this.ffmpeg.deleteFile(tempFileName);
      await this.ffmpeg.unmount(inputDir);
      await this.ffmpeg.deleteDir(inputDir);
      throw new Error("Thumbnail extraction error");
    }

    const fileData = await this.ffmpeg.readFile(outputImageFileName);
    const data = new Uint8Array(fileData as ArrayBuffer);

    await this.ffmpeg.deleteFile(outputImageFileName);
    await this.ffmpeg.deleteFile(tempFileName);
    await this.ffmpeg.unmount(inputDir);
    await this.ffmpeg.deleteDir(inputDir);

    return {
      thumbnail: new Blob([data.buffer], { type: "image/webp" }),
      frame: new Blob([tempData.buffer], { type: "video/mp4" }),
    };
  }

  async generatePreview(
    file: File,
    options: TranscodeOptions,
    signal?: AbortSignal
  ): Promise<PreviewOutput> {
    this.abortController = new AbortController();
    const abortSignal = signal || this.abortController.signal;

    const { duration: totalDuration, sizeMB: originalSizeMB } =
      await getVideoMetadata(file);

    // Sample at the beginning, middle, and end of the video
    const sampleDuration = Math.min(
      options.previewDuration || DEFAULT_PREVIEW_DURATION,
      totalDuration
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
          "0",
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
          "0",
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

    const compressionRatio = sampleOutputSize / originalOutputSize;
    const estimatedSizeMB = originalSizeMB * compressionRatio;

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

  terminate(): void {
    this.ffmpeg.terminate();
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
