"use client";

import { useCallback, useEffect, useReducer, useMemo, useRef } from "react";
import { isWasmSupported } from "@/lib/is-wasm-supported";
import {
  FFmpegService,
  ThumbnailOutput,
  TranscodeOptions,
  TranscodeOutput,
} from "@/app/services/ffmpeg";

// ffmpegReducer.ts
export type FFmpegState = {
  isLoaded: boolean;
  isLoading: boolean;
  isTranscoding: boolean;
  isEstimating: boolean;
  progress: number;
  error: { type: string; message: string } | null;
};

export type FFmpegAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS" }
  | { type: "LOAD_FAILURE"; error: string }
  | { type: "TRANSCODE_START" }
  | { type: "TRANSCODE_PROGRESS"; progress: number }
  | { type: "TRANSCODE_SUCCESS" }
  | { type: "TRANSCODE_FAILURE"; error: string }
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
    isEstimating: false,
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
      dispatch({ type: "TRANSCODE_START" });
      try {
        const result = await ffmpegService.extractThumbnail(file, options);
        dispatch({ type: "TRANSCODE_SUCCESS" });
        return result;
      } catch (error) {
        dispatch({
          type: "TRANSCODE_FAILURE",
          error: (error as Error).message,
        });
        return null;
      }
    },
    [ffmpegServiceRef]
  );

  useEffect(() => {
    if (!isWasmSupported()) {
      console.error("Your browser doesn't support WebAssembly.");
      return;
    }

    if (!ffmpegServiceRef.current) {
      ffmpegServiceRef.current = new FFmpegService();
    }

    if (!state.isLoaded && !state.isLoading) {
      void load();
    }
  
  }, [load, state.isLoaded, state.isLoading, ffmpegServiceRef]);

  return useMemo(
    () => ({
      ...state,
      load,
      transcode,
      extractThumbnail,
    }),
    [state, load, transcode, extractThumbnail]
  );
};
