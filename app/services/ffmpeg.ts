"use client";

import { getRandomId } from "@/lib/get-random-id";
import { getVideoMetadata } from "@/lib/get-video-metadata";
import { qualityToCrf } from "@/lib/quality-to-crf";
import { FFmpeg } from "@ffmpeg/ffmpeg";
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
};

export type TranscodeOutput = {
  file: Blob;
  name: string;
};

export type ThumbnailOutput = {
  thumbnail: Blob;
  frame: Blob;
};

const ESTIMATE_SAMPLE_DURATION = 1;
const DEFAULT_CODEC = "libx264";
const DEFAULT_QUALITY = 100;
const DEFAULT_SCALE = 1;
const DEFAULT_FPS = 30;
const INPUT_DIR = "/input";

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();

export class FFmpegService {
  public ffmpeg: FFmpeg;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async load(baseURL: string): Promise<void> {
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
      preset,
    } = options;

    const args = [];

    if (codec) {
      args.push("-c:v", codec);
    }

    if (quality) {
      args.push("-crf", qualityToCrf(quality).toString());
    }

    if (scale) {
      const scaledWidth = `round(iw*${scale}/2)*2`;
      args.push("-vf", `scale=${scaledWidth}:-2`);
    }

    if (preset) {
      args.push("-preset", preset);
    }

    if (fps) {
      args.push("-r", `${fps}`);
    }

    return args;
  }

  async transcode(
    file: File,
    options: TranscodeOptions
  ): Promise<TranscodeOutput> {
    const sanitizedInputFileName = sanitizeFileName(file.name);
    const inputDir = `${INPUT_DIR}-${getRandomId()}`;
    const outputFileName = `${sanitizedInputFileName
      .split(".")
      .slice(0, -1)
      .join(".")}-compressed-${getRandomId()}.mp4`;

    await this.ffmpeg.createDir(inputDir);

    // @ts-expect-error WORKERFS is not defined
    await this.ffmpeg.mount("WORKERFS", { files: [file] }, inputDir);

    const args = this.transcodeOptionsToArgs(options);

    const result = await this.ffmpeg.exec([
      "-i",
      `${inputDir}/${file.name}`,
      ...args,
      outputFileName,
    ]);

    if (result !== 0) {
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
    options: TranscodeOptions
  ): Promise<ThumbnailOutput> {
    const tempFileName = `temp-${getRandomId()}.mp4`;
    const outputImageFileName = `thumb-${getRandomId()}.webp`;
    const inputDir = `${INPUT_DIR}-${getRandomId()}`;

    await this.ffmpeg.createDir(inputDir);

    // @ts-expect-error WORKERFS is not defined
    await this.ffmpeg.mount("WORKERFS", { files: [file] }, inputDir);

    const args = this.transcodeOptionsToArgs(options);

    const tempThumbResult = await this.ffmpeg.exec([
      "-i",
      `${inputDir}/${file.name}`,
      "-frames:v",
      "1",
      ...args,
      tempFileName,
    ]);

    if (tempThumbResult !== 0) {
      throw new Error("Thumbnail extraction error");
    }

    const tempFileData = await this.ffmpeg.readFile(tempFileName);
    const tempData = new Uint8Array(tempFileData as ArrayBuffer);

    const thumbResult = await this.ffmpeg.exec([
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
    ]);

    if (thumbResult !== 0) {
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

  async estimateOutputSize(
    file: File,
    options: TranscodeOptions
  ): Promise<number> {
    const { duration: totalDuration } = await getVideoMetadata(file);

    // Sample at the beginning, middle, and end of the video
    const sampleDuration = ESTIMATE_SAMPLE_DURATION;
    const samplePositions = [];

    if (totalDuration > sampleDuration) {
      samplePositions.push(0);
    }

    if (totalDuration / 2 > sampleDuration) {
      samplePositions.push(totalDuration / 2);
    }

    if (totalDuration - sampleDuration > 0) {
      samplePositions.push(totalDuration - sampleDuration);
    }

    // Process all sample positions in parallel
    const sampleSizes = await Promise.all(
      samplePositions.map(async (position) => {
        const sampleOutputFileName = `sample_output-${getRandomId()}.mp4`;
        const inputDir = `${INPUT_DIR}-${getRandomId()}`;

        await this.ffmpeg.createDir(inputDir);

        // @ts-expect-error WORKERFS is not defined
        await this.ffmpeg.mount("WORKERFS", { files: [file] }, inputDir);

        const args = this.transcodeOptionsToArgs(options);

        // Extract a sample segment
        const result = await this.ffmpeg.exec([
          "-ss",
          position.toString(),
          "-i",
          `${inputDir}/${file.name}`,
          "-t",
          sampleDuration.toString(),
          ...args,
          sampleOutputFileName,
        ]);

        if (result !== 0) {
          throw new Error("Error encoding sample segment");
        }

        // Read the output file and calculate size
        const sampleOutputData = await this.ffmpeg.readFile(
          sampleOutputFileName
        );
        const sampleSize = (sampleOutputData as Uint8Array).length;

        // Clean up
        await this.ffmpeg.deleteFile(sampleOutputFileName);
        await this.ffmpeg.unmount(inputDir);
        await this.ffmpeg.deleteDir(inputDir);

        return sampleSize;
      })
    );

    const totalSampleSizeBytes = sampleSizes.reduce(
      (sum, size) => sum + size,
      0
    );

    const averageSampleSizePerSecond =
      totalSampleSizeBytes / (sampleDuration * samplePositions.length);
    const estimatedTotalSizeBytes = averageSampleSizePerSecond * totalDuration;
    const estimatedSizeMB = estimatedTotalSizeBytes / (1024 * 1024);
    return Math.round(estimatedSizeMB * 100) / 100; // Round to 2 decimal places
  }

  terminate(): void {
    this.ffmpeg.terminate();
  }
}
