import { create } from "zustand";
import ImageCompressor, {
  ImageCompressorOptions,
} from "@/services/image-compressor";
import PQueue from "p-queue";

interface CompressorTask {
  file: File;
  options: ImageCompressorOptions;
}

interface CompressorState {
  compressedImages: Record<string, Blob>;
  isCompressing: boolean;
  isAutoCompressing: boolean;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  errors: string[];
  processedCache: Record<string, Blob>;
  files: File[];
  activeImage: string | null;
  defaultOptions: ImageCompressorOptions;
  imageSpecificOptions: Record<string, ImageCompressorOptions>;

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
  abort: () => void;
}

interface CompressorTaskResult {
  file: File;
  result: Blob;
  cacheKey: string;
}

const CONCURRENCY = 2;

const useCompressorStore = create<CompressorState>((set, get) => {
  const imageCompressor = new ImageCompressor();
  const queue = new PQueue({ concurrency: CONCURRENCY });

  queue.on("active", () => {
    set({ isCompressing: true });
  });

  queue.on("completed", ({ file, result, cacheKey }: CompressorTaskResult) => {
    set((state) => ({
      compressedImages: { ...state.compressedImages, [file.name]: result },
      processedCache: { ...state.processedCache, [cacheKey]: result },
      progress: {
        ...state.progress,
        completed: get().progress.completed + 1,
      },
    }));
  });

  queue.on("idle", () => {
    set({
      isCompressing: false,
      progress: { total: 0, completed: 0, failed: 0 },
    });
  });

  queue.on("add", () => {
    set((state) => ({
      progress: {
        ...state.progress,
        total: get().progress.total + 1,
      },
    }));
  });

  queue.on("error", (error) => {
    set((state) => ({
      progress: {
        ...state.progress,
        failed: state.progress.failed + 1,
      },
      errors: [...state.errors, error.message],
    }));
  });

  const generateCacheKey = (
    file: File,
    options: ImageCompressorOptions
  ): string => {
    return `${file.name}-${JSON.stringify(options)}`;
  };

  const getMergedOptionsForFiles = (
    files: File[],
    defaultOpts: ImageCompressorOptions,
    specificOpts: Record<string, ImageCompressorOptions>
  ) => {
    return files.map((file) => ({
      file,
      options: {
        ...defaultOpts,
        ...specificOpts[file.name],
      },
    }));
  };

  const addToQueue = async (tasks: CompressorTask[]) => {
    if (tasks.length === 0) return;
    await queue.addAll(
      tasks.map(({ file, options }) => {
        return async (): Promise<CompressorTaskResult> => {
          const cacheKey = generateCacheKey(file, options);
          const cachedImage = get().processedCache[cacheKey];

          if (cachedImage) {
            return { file, result: cachedImage, cacheKey };
          }

          const result = await imageCompressor.compressImage(file, options);
          return { file, result, cacheKey };
        };
      })
    );
  };

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
      get().abort();
      const { files, defaultOptions, imageSpecificOptions } = get();
      const tasks = getMergedOptionsForFiles(
        files,
        defaultOptions,
        imageSpecificOptions
      );
      await addToQueue(tasks);
    },

    processImage: async (key: string) => {
      const { files, defaultOptions, imageSpecificOptions } = get();
      const activeImageFile = files.find((file) => file.name === key);
      if (!activeImageFile) return;
      const task = {
        file: activeImageFile,
        options: imageSpecificOptions[activeImageFile.name] || defaultOptions,
      };
      await addToQueue([task]);
    },

    abort: () => {
      queue.clear();
      set({
        isCompressing: false,
        progress: { total: 0, completed: 0, failed: 0 },
      });
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
          processedCache: {},
        }),
        ...(!state.activeImage && files.length > 0 && {
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
