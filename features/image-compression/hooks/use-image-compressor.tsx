"use client";

import { create } from "zustand";
import { ImageCompressorOptions } from "@/services/image-compressor/image-compressor";
import { ImageCompressorWorkerManager } from "@/services/image-compressor/image-compressor-worker-manager";

interface CompressorState {
  compressedImages: Record<string, Blob>;
  isCompressing: boolean;
  isAutoCompressing: boolean;
  errors: string[];
  files: File[];
  activeImage: string | null;
  defaultOptions: ImageCompressorOptions;
  imageSpecificOptions: Record<string, ImageCompressorOptions>;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };

  // Actions
  processAll: () => Promise<void>;
  processImage: (key: string) => Promise<void>;
  setFiles: (files: File[]) => void;
  setActiveImage: (key: string) => void;
  setDefaultOptions: (options: ImageCompressorOptions) => void;
  setIsAutoCompressing: (isAutoCompressing: boolean) => void;
  setImageSpecificOptions: (
    key: string,
    options: ImageCompressorOptions
  ) => void;
  clearErrors: (filename: string) => void;
}

const useCompressorStore = create<CompressorState>((set, get) => {
  const workerPool = new ImageCompressorWorkerManager();

  if (workerPool) {
    workerPool.onPoolManagerEvent = (event) => {
      const { type, payload } = event;

      switch (type) {
        case "TASK_COMPLETED":
          set((state) => ({
            compressedImages: {
              ...state.compressedImages,
              [payload.fileName]: payload.blob,
            },
          }));
          break;

        case "TASK_FAILED":
          set((state) => ({
            errors: [...state.errors, payload.error],
          }));
          break;

        case "ALL_TASKS_COMPLETED":
          set({
            isCompressing: false,
          });
          break;

        case "PROGRESS_UPDATE":
          set({
            progress: payload.progress,
            isCompressing: payload.progress.completed < payload.progress.total,
          });
          break;
      }
    };
  }

  return {
    compressedImages: {},
    activeImage: null,
    isAutoCompressing: true,
    isCompressing: false,
    progress: { total: 0, completed: 0, failed: 0 },
    errors: [],
    processedCache: {},
    files: [],
    imageSpecificOptions: {},
    defaultOptions: {
      quality: 75,
      outputType: "jpeg",
    },

    processAll: async () => {
      if (!workerPool) return;
      const { files, defaultOptions, imageSpecificOptions } = get();
      const tasks = await Promise.all(
        files.map(async (file) => {
          const options = {
            ...defaultOptions,
            ...imageSpecificOptions[file.name],
          };
          return { file, options };
        })
      );

      workerPool.addTasks(tasks);
    },

    processImage: async (key: string) => {
      if (!workerPool) return;
      const { files, defaultOptions, imageSpecificOptions } = get();
      const file = files.find((f) => f.name === key);
      if (!file) return;

      const options = {
        ...defaultOptions,
        ...imageSpecificOptions[file.name],
      };

      workerPool.addTasks([{ file, options }]);
    },

    clearErrors: () => {
      set({ errors: [] });
    },

    setFiles: (files: File[]) => {
      set((state) => ({
        files: files ?? [],
        ...(files.length === 0 && {
          activeImage: null,
          compressedImages: {},
        }),
        ...(!state.activeImage &&
          files.length > 0 && {
            activeImage: files[0].name ?? null,
          }),
      }));
    },

    setActiveImage: (key: string) => {
      set({ activeImage: key });
    },

    setDefaultOptions: (options: ImageCompressorOptions) => {
      set({ defaultOptions: options });
    },

    setImageSpecificOptions: (key: string, options: ImageCompressorOptions) => {
      set((state) => ({
        imageSpecificOptions: { ...state.imageSpecificOptions, [key]: options },
      }));
    },

    setIsAutoCompressing: (isAutoCompressing: boolean) => {
      set({ isAutoCompressing });
    },
  };
});

export default useCompressorStore;
