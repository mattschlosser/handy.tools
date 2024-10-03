import React, { useRef, useEffect } from "react";
import { ReactCompareSlider } from "react-compare-slider";

interface PreviewProps {
  videoPreview: {
    original: Blob;
    compressed: Blob;
  };
}

function PreviewComponent(props: PreviewProps) {
  const { videoPreview } = props;
  const { original, compressed } = videoPreview;

  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const compressedVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const originalVideo = originalVideoRef.current;
    const compressedVideo = compressedVideoRef.current;
    let originalEnded = false;
    let compressedEnded = false;

    if (originalVideo && compressedVideo) {
      const handleReady = () => {
        if (
          originalVideo.readyState === 4 &&
          compressedVideo.readyState === 4
        ) {
          originalVideo.play();
          compressedVideo.play();
        }
      };

      originalVideo.addEventListener("loadeddata", handleReady);
      compressedVideo.addEventListener("loadeddata", handleReady);

      const tryToPlay = () => {
        if (!originalEnded || !compressedEnded) return;
        originalVideo.play();
        compressedVideo.play();
        originalEnded = false;
        compressedEnded = false;
      };

      const handleFirstEnded = () => {
        originalEnded = true;
        tryToPlay();
      };

      const handleSecondEnded = () => {
        compressedEnded = true;
        tryToPlay();
      };

      originalVideo.addEventListener("ended", handleFirstEnded);
      compressedVideo.addEventListener("ended", handleSecondEnded);

      return () => {
        originalVideo.removeEventListener("loadeddata", handleReady);
        compressedVideo.removeEventListener("loadeddata", handleReady);
        originalVideo.removeEventListener("ended", handleFirstEnded);
        compressedVideo.removeEventListener("ended", handleSecondEnded);
      };
    }
  }, []);

  return (
    <ReactCompareSlider
      className="w-full h-full"
      itemOne={<BlobVideo src={compressed} ref={compressedVideoRef} />}
      itemTwo={<BlobVideo src={original} ref={originalVideoRef} />}
    />
  );
}

const BlobVideo = React.forwardRef<HTMLVideoElement, { src: Blob }>(
  (props, ref) => {
    const { src } = props;
    const blobUrl = React.useMemo(() => URL.createObjectURL(src), [src]);

    useEffect(() => {
      return () => URL.revokeObjectURL(blobUrl);
    }, [blobUrl]);

    return (
      <video
        ref={ref}
        muted
        className="w-full h-full object-contain"
        src={blobUrl}
      />
    );
  }
);

BlobVideo.displayName = "BlobVideo";

export const Preview = React.memo(PreviewComponent);
