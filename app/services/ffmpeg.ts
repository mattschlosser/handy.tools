"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

export type PresetOptions = 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';

export type TranscodeOptions = {
  codec?: string;
  crf?: string;
  format?: string;
  width?: number;
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

const DEFAULT_CODEC = "libx264";
const DEFAULT_CRF = "34";
const DEFAULT_FORMAT = "mp4";
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

  async transcode(
    file: File,
    options: TranscodeOptions
  ): Promise<TranscodeOutput> {
    const {
      codec = DEFAULT_CODEC,
      crf = DEFAULT_CRF,
      format = DEFAULT_FORMAT,
      width,
      preset,
      fps,
    } = options;

    const sanitizedInputFileName = sanitizeFileName(file.name);
    const outputFileName = `${sanitizedInputFileName
      .split(".")
      .slice(0, -1)
      .join(".")}-compressed-${new Date().getMilliseconds()}.${format}`;

    await this.ffmpeg.createDir(INPUT_DIR);
    await this.ffmpeg.mount("WORKERFS", { files: [file] }, INPUT_DIR);

    const args = ["-c:v", codec, "-crf", crf];

    if (width) {
      args.push("-vf", `scale=${width}:-2`);
    }
    
    if(preset) {
      args.push("-preset", preset);
    }

    if(fps) {
      args.push("-r", `${fps}`);
    }

    const result = await this.ffmpeg.exec([
      "-i",
      `${INPUT_DIR}/${file.name}`,
      ...args,
      outputFileName,
    ]);

    if (result !== 0) {
      throw new Error("Video compression error");
    }

    const fileData = await this.ffmpeg.readFile(outputFileName);
    const data = new Uint8Array(fileData as ArrayBuffer);

    await this.ffmpeg.unmount(INPUT_DIR);
    await this.ffmpeg.deleteDir(INPUT_DIR);

    return {
      file: new Blob([data.buffer], { type: `video/${format}` }),
      name: outputFileName,
    };
  }

  async extractThumbnail(
    file: File,
    options: TranscodeOptions
  ): Promise<ThumbnailOutput> {
    const { crf = DEFAULT_CRF, codec = DEFAULT_CODEC, width, preset, fps } = options;
    const tempFileName = "temp.mp4";
    const outputImageFileName = "thumb";

    await this.ffmpeg.createDir(INPUT_DIR);
    await this.ffmpeg.mount("WORKERFS", { files: [file] }, INPUT_DIR);

    const args = ["-c:v", codec, "-crf", crf];

    if (width) {
      args.push("-vf", `scale=${width}:-2`);
    }

    if(preset) {
      args.push("-preset", preset);
    }

    if(fps) {
      args.push("-r", `${fps}`);
    }

    console.log("🚀 ~ FFmpegService ~ args:", args)
    const tempThumbResult = await this.ffmpeg.exec([
      "-i",
      `${INPUT_DIR}/${file.name}`,
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
      "-crf",
      crf,
      "-preset",
      "picture",
      outputImageFileName,
    ]);

    if (thumbResult !== 0) {
      throw new Error("Thumbnail extraction error");
    }

    const fileData = await this.ffmpeg.readFile(outputImageFileName);
    const data = new Uint8Array(fileData as ArrayBuffer);

    await this.ffmpeg.unmount(INPUT_DIR);
    await this.ffmpeg.deleteDir(INPUT_DIR);

    return {
      thumbnail: new Blob([data.buffer], { type: "image/webp" }),
      frame: new Blob([tempData.buffer], { type: "video/mp4" }),
    };
  }

  terminate(): void {
    this.ffmpeg.terminate();
  }
}
