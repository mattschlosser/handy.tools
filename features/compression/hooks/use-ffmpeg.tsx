"use client";

import { useCallback, useEffect, useReducer, useMemo, useRef } from "react";
import { isWasmSupported } from "@/lib/is-wasm-supported";
import {
  FFmpegService,
  PreviewOutput,
  ThumbnailOutput,
  TranscodeOptions,
  TranscodeOutput,
} from "@/app/services/ffmpeg";

export type FFmpegState = {
  isLoaded: boolean;
  isLoading: boolean;
  isTranscoding: boolean;
  isGeneratingPreview: boolean;
  isProcessingThumbnail: boolean;
  progress: number;
  error: { type: string; message: string } | null;
};

export type FFmpegAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS" }
  | { type: "LOAD_FAILURE"; error: string }
  | { type: "PROCESS_THUMBNAIL_START" }
  | { type: "PROCESS_THUMBNAIL_SUCCESS" }
  | { type: "PROCESS_THUMBNAIL_FAILURE"; error: string }
  | { type: "PREVIEW_START" }
  | { type: "PREVIEW_SUCCESS" }
  | { type: "PREVIEW_FAILURE"; error: string }
  | { type: "TRANSCODE_START" }
  | { type: "TRANSCODE_PROGRESS"; progress: number }
  | { type: "TRANSCODE_SUCCESS" }
  | { type: "TRANSCODE_FAILURE"; error: string }
  | { type: "ABORT" }
  | { type: "RESET_ERROR" };

export function ffmpegReducer(
  state: FFmpegState,
  action: FFmpegAction
): FFmpegState {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, isLoading: true, error: null };
    case "LOAD_SUCCESS":
      return { ...state, isLoaded: true, isLoading: false };
    case "LOAD_FAILURE":
      return {
        ...state,
        isLoading: false,
        error: { type: "Load Error", message: action.error },
      };
    case "PROCESS_THUMBNAIL_START":
      return { ...state, isProcessingThumbnail: true, error: null };
    case "PROCESS_THUMBNAIL_SUCCESS":
      return { ...state, isProcessingThumbnail: false };
    case "PROCESS_THUMBNAIL_FAILURE":
      return {
        ...state,
        isProcessingThumbnail: false,
        error: { type: "Thumbnail Error", message: action.error },
      };
    case "PREVIEW_START":
      return { ...state, isGeneratingPreview: true, error: null };
    case "PREVIEW_SUCCESS":
      return { ...state, isGeneratingPreview: false };
    case "PREVIEW_FAILURE":
      return {
        ...state,
        isGeneratingPreview: false,
        error: { type: "Estimate Error", message: action.error },
      };
    case "TRANSCODE_START":
      return { ...state, isTranscoding: true, progress: 0, error: null };
    case "TRANSCODE_PROGRESS":
      return { ...state, progress: action.progress };
    case "TRANSCODE_SUCCESS":
      return { ...state, isTranscoding: false, progress: 1 };
    case "TRANSCODE_FAILURE":
      return {
        ...state,
        isTranscoding: false,
        error: { type: "Transcode Error", message: action.error },
      };
    case "RESET_ERROR":
      return { ...state, error: null };

    case "ABORT":
      return {
        ...state,
        isTranscoding: false,
        isGeneratingPreview: false,
        isProcessingThumbnail: false,
        progress: 0,
      };
    default:
      return state;
  }
}

const DEFAULT_BASE_URL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd";

export const useFfmpeg = () => {
  const [state, dispatch] = useReducer(ffmpegReducer, {
    isLoaded: false,
    isLoading: false,
    isTranscoding: false,
    isGeneratingPreview: false,
    isProcessingThumbnail: false,
    progress: 0,
    error: null,
  });

  const ffmpegServiceRef = useRef<null | FFmpegService>(null);

  const load = useCallback(
    async (customBaseURL?: string) => {
      if (!ffmpegServiceRef.current) return;
      const ffmpegService = ffmpegServiceRef.current;
      const baseURL = customBaseURL || DEFAULT_BASE_URL;
      dispatch({ type: "LOAD_START" });
      try {
        await ffmpegService.load(baseURL);
        dispatch({ type: "LOAD_SUCCESS" });

        ffmpegService.ffmpeg.on("progress", (progress) => {
          dispatch({ type: "TRANSCODE_PROGRESS", progress: progress.progress });
        });

        ffmpegService.ffmpeg.on("log", (log) => {
          console.info(log);
        });
      } catch (error) {
        console.error(error);
        dispatch({ type: "LOAD_FAILURE", error: (error as Error).message });
      }
    },
    [ffmpegServiceRef]
  );

  const transcode = useCallback(
    async (
      file: File,
      options: TranscodeOptions
    ): Promise<TranscodeOutput | null> => {
      if (!ffmpegServiceRef.current) return null;
      const ffmpegService = ffmpegServiceRef.current;
      dispatch({ type: "TRANSCODE_START" });
      try {
        const result = await ffmpegService.transcode(file, options);
        dispatch({ type: "TRANSCODE_SUCCESS" });
        return result;
      } catch (error) {
        console.error(error);
        if (error instanceof Error && error.name === "AbortError") {
          dispatch({ type: "ABORT" });
          return null;
        }
        dispatch({
          type: "TRANSCODE_FAILURE",
          error: (error as Error).message,
        });
        return null;
      }
    },
    [ffmpegServiceRef]
  );

  const extractThumbnail = useCallback(
    async (
      file: File,
      options: TranscodeOptions
    ): Promise<ThumbnailOutput | null> => {
      if (!ffmpegServiceRef.current) return null;
      const ffmpegService = ffmpegServiceRef.current;
      dispatch({ type: "PROCESS_THUMBNAIL_START" });
      try {
        const result = await ffmpegService.extractThumbnail(file, options);
        dispatch({ type: "PROCESS_THUMBNAIL_SUCCESS" });
        return result;
      } catch (error) {
        console.error(error);
        if (error instanceof Error && error.name === "AbortError") {
          dispatch({ type: "ABORT" });
          return null;
        }
        dispatch({
          type: "PROCESS_THUMBNAIL_FAILURE",
          error: (error as Error).message,
        });
        return null;
      }
    },
    [ffmpegServiceRef]
  );

  const generateVideoPreview = useCallback(
    async (
      file: File,
      options: TranscodeOptions
    ): Promise<PreviewOutput | null> => {
      if (!ffmpegServiceRef.current) return null;
      const ffmpegService = ffmpegServiceRef.current;
      dispatch({ type: "PREVIEW_START" });
      try {
        const result = await ffmpegService.generatePreview(file, options);
        dispatch({ type: "PREVIEW_SUCCESS" });
        return result;
      } catch (error) {
        console.error(error);
        if (error instanceof Error && error.name === "AbortError") {
          dispatch({ type: "ABORT" });
          return null;
        }
        dispatch({
          type: "PREVIEW_FAILURE",
          error: (error as Error).message,
        });
        return null;
      }
    },
    [ffmpegServiceRef]
  );

  const abort = useCallback(() => {
    if (ffmpegServiceRef.current) {
      ffmpegServiceRef.current.abort();
      dispatch({ type: "ABORT" });
    }
  }, [ffmpegServiceRef]);

  useEffect(() => {
    if (!isWasmSupported()) {
      console.error("Your browser doesn't support WebAssembly.");
      return;
    }

    if (!ffmpegServiceRef.current) {
      ffmpegServiceRef.current = new FFmpegService();
    }

    if (!state.isLoaded && !state.isLoading) {
      void load(""); // use local ffmpeg
    }
  }, [load, state.isLoaded, state.isLoading, ffmpegServiceRef]);

  return useMemo(
    () => ({
      ...state,
      load,
      abort,
      transcode,
      extractThumbnail,
      generateVideoPreview,
    }),
    [state, load, transcode, extractThumbnail, generateVideoPreview, abort]
  );
};
