export type VideoMetadata = {
  duration: number;
  width: number;
  height: number;
  size: number;
  sizeMB: number;
};

export async function getVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
        sizeMB: file.size / 1024 / 1024,
      });
    };

    video.onerror = () => {
      reject("Error loading video");
    };

    video.src = URL.createObjectURL(file);
  });
}
