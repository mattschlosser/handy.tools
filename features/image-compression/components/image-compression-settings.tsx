"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  getDefaultsForOutputType,
  ImageCompressorOptions,
  ImageCompressorOutputType,
} from "@/services/image-compressor";

interface ImageCompressionSettingsProps {
  options: ImageCompressorOptions;
  onOptionsChange: (options: ImageCompressorOptions) => void;
  children?: React.ReactNode;
}

// TODO: Add resolution option

export function ImageCompressionSettings({
  options,
  onOptionsChange,
  children,
}: ImageCompressionSettingsProps) {
  const handleOutputTypeChange = (value: ImageCompressorOutputType) => {
    if (!value) return;
    onOptionsChange(getDefaultsForOutputType(value));
  };

  const renderFormatSpecificSettings = () => {
    switch (options.outputType) {
      case "jpeg":
        return (
          <SliderInput
            value={options.quality}
            onChange={(value) =>
              onOptionsChange({
                ...options,
                quality: value,
              })
            }
          />
        );

      // TODO: Need better way to compress png
      case "png":
        return null;

      case "webp":
        return (
          <SliderInput
            value={options.quality}
            onChange={(value) =>
              onOptionsChange({
                ...options,
                quality: value,
              })
            }
          />
        );

      case "avif":
        return (
          <>
            <SliderInput
              value={options.quality}
              onChange={(value) =>
                onOptionsChange({
                  ...options,
                  quality: value,
                })
              }
            />
            <SliderInput
              label="Sharpness"
              value={options.sharpness}
              onChange={(value) =>
                onOptionsChange({ ...options, sharpness: value })
              }
            />
          </>
        );

      case "jxl":
        return (
          <SliderInput
            value={options.quality}
            onChange={(value) =>
              onOptionsChange({
                ...options,
                quality: value,
              })
            }
          />
        );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className="text-base font-bold" htmlFor="output-format">
          Output Format
        </Label>
        <ToggleGroup
          value={options.outputType}
          type="single"
          className="justify-start"
          onValueChange={(value) =>
            handleOutputTypeChange(value as ImageCompressorOutputType)
          }
        >
          <ToggleGroupItem
            variant="outline"
            value="jpeg"
            aria-label="Toggle JPEG"
          >
            JPEG
          </ToggleGroupItem>
          <ToggleGroupItem
            variant="outline"
            value="png"
            aria-label="Toggle PNG"
          >
            PNG
          </ToggleGroupItem>
          <ToggleGroupItem
            variant="outline"
            value="webp"
            aria-label="Toggle WebP"
          >
            WebP
          </ToggleGroupItem>
          {/* TODO: Need to fix rendering for them */}
          {/* <ToggleGroupItem
            variant="outline"
            value="avif"
            aria-label="Toggle AVIF"
          >
            AVIF
          </ToggleGroupItem> */}
          {/* <ToggleGroupItem
            variant="outline"
            value="jxl"
            aria-label="Toggle JXL"
          >
            JXL
          </ToggleGroupItem> */}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        {renderFormatSpecificSettings()}
      </div>
      {children}
    </div>
  );
}

interface SliderInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function SliderInput({
  label = "Quality",
  value,
  onChange,
  disabled = false,
}: SliderInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-base font-bold" htmlFor="quality">
        {label}
      </Label>
      <Slider
        name="quality"
        id="quality"
        min={1}
        max={100}
        step={1}
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        disabled={disabled}
      />
    </div>
  );
}
