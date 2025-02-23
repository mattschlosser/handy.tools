"use client";

import { ImageCompressorOptions } from "./image-compressor";
import { WorkerMessage, WorkerRequest } from "./image-compressor.worker";

const getConcurrency = () => {
  if (typeof navigator === "undefined") return 4;
  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 2) return 1;
  if (cores <= 4) return cores - 1;
  return Math.floor(cores * 0.75);
};

const CONCURRENCY = getConcurrency();

export interface CompressionTask {
  file: File;
  options: ImageCompressorOptions;
}

interface QueueTask extends CompressionTask {
  cacheKey: string;
}

interface ProgressInfo {
  total: number;
  completed: number;
  failed: number;
}

export type PoolManagerEvent =
  | {
      type: "TASK_COMPLETED";
      payload: {
        fileName: string;
        blob: Blob;
      };
    }
  | {
      type: "TASK_FAILED";
      payload: {
        fileName: string;
        error: string;
      };
    }
  | {
      type: "ALL_TASKS_COMPLETED";
      payload: null;
    }
  | {
      type: "PROGRESS_UPDATE";
      payload: {
        progress: ProgressInfo;
      };
    };

export class ImageCompressorWorkerManager {
  private workers: Worker[] = [];
  private workerStates: Map<Worker, { busy: boolean }> = new Map();
  private taskQueue: QueueTask[] = [];
  private processedCache: Record<string, Blob> = {};
  private workerCount: number;
  private progress: ProgressInfo = {
    total: 0,
    completed: 0,
    failed: 0,
  };

  constructor(workerCount = CONCURRENCY) {
    this.workerCount = workerCount;
  }

  public onPoolManagerEvent?: (event: PoolManagerEvent) => void;

  private emitEvent(event: PoolManagerEvent) {
    this.onPoolManagerEvent?.(event);
  }

  private emitProgress() {
    this.emitEvent({
      type: "PROGRESS_UPDATE",
      payload: {
        progress: { ...this.progress },
      },
    });
  }

  private initializeWorkers() {
    if (typeof navigator === "undefined") return;
    if (this.workers.length > 0) return;

    for (let i = 0; i < this.workerCount; i++) {
      console.log("Initializing worker", i);
      const worker = new Worker(
        new URL("./image-compressor.worker.ts", import.meta.url),
        { type: "module" }
      );

      worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const { type, payload } = event.data;
        switch (type) {
          case "COMPRESSION_COMPLETE": {
            const cacheKey = payload.cacheKey;
            this.processedCache[cacheKey] = payload.blob;
            this.progress.completed += 1;

            this.emitEvent({
              type: "TASK_COMPLETED",
              payload: {
                fileName: payload.fileName,
                blob: payload.blob,
              },
            });
            this.emitProgress();
            break;
          }

          case "COMPRESSION_ERROR": {
            this.progress.failed += 1;
            this.emitEvent({
              type: "TASK_FAILED",
              payload: {
                fileName: payload.fileName,
                error: payload.error,
              },
            });
            this.emitProgress();
            break;
          }
        }
  
        if (
          type === "COMPRESSION_COMPLETE" ||
          type === "COMPRESSION_ERROR" ||
          type === "COMPRESSION_ABORTED"
        ) {
          this.workerStates.set(worker, { busy: false });
          this.processTasks();
          this.checkCompletion();
        }
      };

      this.workers.push(worker);
      this.workerStates.set(worker, { busy: false });
    }
  }

  public addTasks(tasks: CompressionTask[]) {
    // TODO: Fix bug where adding new tasks don't stop the previous tasks from completing
    // this.terminate();
    this.clearTasks();
    this.initializeWorkers();

    const tasksWithCacheKey = tasks.map((task) => {
      return {
        ...task,
        cacheKey: this.generateCacheKey(task.file.name, task.options),
      };
    });

    const nonCachedTasks = tasksWithCacheKey.filter((task) => {
      if (this.processedCache[task.cacheKey]) {
        this.progress.total += 1;
        this.progress.completed += 1;
        this.emitEvent({
          type: "TASK_COMPLETED",
          payload: {
            fileName: task.file.name,
            blob: this.processedCache[task.cacheKey],
          },
        });
        this.emitProgress();
        return false;
      }
      return true;
    });

    this.progress.total += nonCachedTasks.length;
    this.taskQueue.push(...nonCachedTasks);
    this.processTasks();
    this.emitProgress();
  }

  public terminate() {
    console.log("Terminating workers");
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.clearTasks();
    this.workerStates.clear();
  }

  private clearTasks() {
    this.taskQueue = [];
    this.progress = {
      total: 0,
      completed: 0,
      failed: 0,
    };
    this.emitProgress();
  }

  private checkCompletion() {
    const busyWorkers = this.getBusyWorkersCount();
    const remainingTasks = this.taskQueue.length;

    if (busyWorkers === 0 && remainingTasks === 0) {
      this.clearProgress();
      this.emitEvent({
        type: "ALL_TASKS_COMPLETED",
        payload: null,
      });
    }
  }

  private getAvailableWorker(): Worker | null {
    return (
      this.workers.find((worker) => !this.workerStates.get(worker)?.busy) ||
      null
    );
  }

  private async processTasks() {
    if (this.taskQueue.length === 0) return;
    while (this.taskQueue.length > 0) {
      const availableWorker = this.getAvailableWorker();
      if (!availableWorker) return;

      const task = this.taskQueue.shift();
      if (!task) return;

      const serializableTask = await this.createSerializableTask(
        task.file,
        task.options
      );

      const message: WorkerRequest = {
        type: "ADD_TASK",
        payload: { task: { ...serializableTask, cacheKey: task.cacheKey } },
      };

      this.workerStates.set(availableWorker, { busy: true });
      availableWorker.postMessage(message);
    }
  }

  private createSerializableTask = async (
    file: File,
    options: ImageCompressorOptions
  ) => {
    const arrayBuffer = await file.arrayBuffer();
    return {
      fileData: {
        arrayBuffer,
        name: file.name,
        type: file.type,
      },
      options,
    };
  };

  private generateCacheKey(
    fileName: string,
    options?: ImageCompressorOptions
  ): string {
    return `${fileName}-${JSON.stringify(options)}`;
  }

  private clearProgress() {
    this.progress = {
      total: 0,
      completed: 0,
      failed: 0,
    };
    this.emitProgress();
  }

  private getBusyWorkersCount(): number {
    return Array.from(this.workerStates.values()).filter((state) => state.busy)
      .length;
  }
}
