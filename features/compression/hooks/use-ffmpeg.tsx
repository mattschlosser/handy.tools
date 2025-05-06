"use client";

import { useCallback, useEffect, useReducer, useMemo, useRef } from "react";
import { isWasmSupported } from "@/lib/is-wasm-supported";
import {
  FFmpegService,
  PreviewOutput,
  ThumbnailOutput,
  TranscodeOptions,
  TranscodeOutput,
} from "@/services/ffmpeg";

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
  | { type: "TERMINATE" };

/**
 * Reducer function for managing FFmpeg state transitions
 * @param state - Current FFmpeg state
 * @param action - Action to perform on the state
 * @returns Updated FFmpeg state
 */
export function ffmpegReducer(
  state: FFmpegState,
  action: FFmpegAction
): FFmpegState {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, isLoading: true };
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

    case "ABORT":
      return {
        ...state,
        isTranscoding: false,
        isGeneratingPreview: false,
        isProcessingThumbnail: false,
        progress: 0,
      };

    case "TERMINATE":
      return {
        ...state,
        isLoaded: false,
        isLoading: false,
        isTranscoding: false,
        isGeneratingPreview: false,
        isProcessingThumbnail: false,
      };

    default:
      return state;
  }
}

/**
 * Hook for managing FFmpeg video processing operations
 * @returns Object containing FFmpeg state and methods for video processing
 * - state: Current processing state and progress
 * - load: Function to initialize FFmpeg
 * - abort: Function to cancel current operation
 * - transcode: Function to convert video to different format/quality
 * - extractThumbnail: Function to generate video thumbnail
 * - generateVideoPreview: Function to create preview version of video
 */
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

  /**
   * Initializes FFmpeg service and sets up event listeners
   */
  const load = useCallback(async () => {
    if (!ffmpegServiceRef.current) return;
    const ffmpegService = ffmpegServiceRef.current;
    dispatch({ type: "LOAD_START" });
    try {
      await ffmpegService.load();
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
  }, [ffmpegServiceRef]);

  /**
   * Terminates the FFmpeg service and resets the state
   * Need to use this when the ffmpeg service crashes and then reload it
   */
  const terminate = useCallback(() => {
    if (!ffmpegServiceRef.current) return;
    const ffmpegService = ffmpegServiceRef.current;
    ffmpegService.terminate();
    ffmpegServiceRef.current = null;
    dispatch({ type: "TERMINATE" });
  }, [ffmpegServiceRef]);

  /**
   * Transcodes a video file according to specified options
   * @param file - Video file to transcode
   * @param options - Transcoding configuration options
   * @returns Promise resolving to transcode output or null if operation fails/aborts
   */
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
        terminate();
        return null;
      }
    },
    [terminate, ffmpegServiceRef]
  );

  /**
   * Extracts a thumbnail image from a video file
   * @param file - Video file to extract thumbnail from
   * @returns Promise resolving to thumbnail output or null if operation fails/aborts
   */
  const extractThumbnail = useCallback(
    async (file: File): Promise<ThumbnailOutput | null> => {
      if (!ffmpegServiceRef.current) return null;
      const ffmpegService = ffmpegServiceRef.current;
      dispatch({ type: "PROCESS_THUMBNAIL_START" });
      try {
        const result = await ffmpegService.extractThumbnail(file);
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
        terminate();
        return null;
      }
    },
    [terminate, ffmpegServiceRef]
  );

  /**
   * Generates a preview version of a video file
   * @param file - Video file to generate preview from
   * @param options - Preview generation configuration options
   * @returns Promise resolving to preview output or null if operation fails/aborts
   */
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
        terminate();
        return null;
      }
    },
    [terminate, ffmpegServiceRef]
  );

  /**
   * Aborts current FFmpeg operation
   */
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
      void load();
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
