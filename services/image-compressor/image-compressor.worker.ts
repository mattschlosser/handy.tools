import ImageCompressor, { ImageCompressorOptions } from "./image-compressor";

export interface SerializableTask {
  fileData: {
    arrayBuffer: ArrayBuffer;
    name: string;
    type: string;
  };
  options: ImageCompressorOptions;
  cacheKey: string;
}

export type WorkerMessage =
  | {
      type: "COMPRESSION_COMPLETE";
      payload: {
        fileName: string;
        blob: Blob;
        cacheKey: string;
      };
    }
  | {
      type: "COMPRESSION_ERROR";
      payload: {
        fileName: string;
        error: string;
        cacheKey: string;
      };
    }
  | {
      type: "COMPRESSION_ABORTED";
      payload: null;
    };

export type WorkerRequest = {
  type: "ADD_TASK";
  payload: { task: SerializableTask };
};

const imageCompressor = new ImageCompressor();

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { type, payload } = event.data;

  switch (type) {
    case "ADD_TASK": {
      const task = payload.task;
      if (!task) return;

      try {
        const { fileData, options } = task;
        const compressedBlob = await imageCompressor.compressImage(
          fileData,
          options
        );
        console.log("WORKER COMPLETE");
        self.postMessage({
          type: "COMPRESSION_COMPLETE",
          payload: {
            fileName: fileData.name,
            blob: compressedBlob,
            cacheKey: task.cacheKey,
          },
        });
      } catch (error) {
        self.postMessage({
          type: "COMPRESSION_ERROR",
          payload: {
            fileName: task.fileData.name,
            error: error instanceof Error ? error.message : "Unknown error",
            cacheKey: task.cacheKey,
          },
        });
      }
      break;
    }
  }
};
