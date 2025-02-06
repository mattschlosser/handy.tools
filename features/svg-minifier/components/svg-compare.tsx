import Image from "next/image";
import { useRef } from "react";
import { ReactCompareSlider } from "react-compare-slider";
import {
  ReactZoomPanPinchContentRef,
  TransformComponent,
} from "react-zoom-pan-pinch";
import { TransformWrapper } from "react-zoom-pan-pinch";

type SVGCompareProps = {
  original: string;
  minified: string;
};

export function SVGCompare({ original, minified }: SVGCompareProps) {
  const itemOneRef = useRef<ReactZoomPanPinchContentRef>(null);
  const itemTwoRef = useRef<ReactZoomPanPinchContentRef>(null);
  const activeItemRef = useRef<"one" | "two" | null>(null);

  const handleSync = (
    current: ReactZoomPanPinchContentRef | null,
    other: ReactZoomPanPinchContentRef | null,
    activeItem: "one" | "two"
  ) => {
    if (!current || !other || activeItemRef.current !== activeItem) return;
    const currentState = current.instance.getContext().state;

    other.setTransform(
      currentState.positionX,
      currentState.positionY,
      currentState.scale,
      0,
      "linear"
    );
  };

  return (
    <ReactCompareSlider
      onlyHandleDraggable
      className="w-full h-full"
      itemOne={
        <TransformWrapper
          ref={itemOneRef}
          onTransformed={(ref) => {
            handleSync(ref, itemTwoRef.current, "one");
          }}
          onPanning={() => {
            activeItemRef.current = "one";
          }}
          onZoom={() => {
            activeItemRef.current = "one";
          }}
          onWheel={() => {
            activeItemRef.current = "one";
          }}
        >
          <TransformComponent
            contentClass="!w-full !h-full"
            wrapperClass="!w-full !h-full overflow-hidden rounded-md"
          >
            <Image
              src={minified}
              alt="Uploaded file"
              className="w-full h-full object-contain"
              fill
            />
          </TransformComponent>
        </TransformWrapper>
      }
      itemTwo={
        <TransformWrapper
          ref={itemTwoRef}
          onTransformed={(ref) => {
            handleSync(ref, itemOneRef.current, "two");
          }}
          onPanning={() => {
            activeItemRef.current = "two";
          }}
          onZoom={() => {
            activeItemRef.current = "two";
          }}
          onWheel={() => {
            activeItemRef.current = "two";
          }}
        >
          <TransformComponent
            contentClass="!w-full !h-full"
            wrapperClass="!w-full !h-full overflow-hidden rounded-md"
          >
            <Image
              src={original}
              alt="Uploaded file"
              className="w-full h-full object-contain"
              fill
            />
          </TransformComponent>
        </TransformWrapper>
      }
    />
  );
}
