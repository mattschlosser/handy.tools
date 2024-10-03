"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  BikeIcon,
  CarFrontIcon,
  CookingPotIcon,
  LucideIcon,
  RocketIcon,
} from "lucide-react";
import { useState } from "react";

export type CompressionOptions = {
  quality: number;
  preset: (typeof presets)[number]["value"];
  fps: number;
  scale: number;
};

type BasicPresets = "basic" | "super" | "ultra" | "cooked";

type ConfigOption = {
  value: string;
  icon: LucideIcon;
  title: string;
  description: string;
  options: CompressionOptions;
};

const toggleConfig: ConfigOption[] = [
  {
    value: "basic",
    icon: BikeIcon,
    title: "Basic",
    description: "Basic compression with minimal loss in quality",
    options: {
      quality: 90,
      preset: "superfast",
      fps: 30,
      scale: 1,
    },
  },
  {
    value: "super",
    icon: CarFrontIcon,
    title: "Medium",
    description: "Medium compression with some loss in quality",
    options: {
      quality: 65,
      preset: "veryfast",
      fps: 30,
      scale: 1,
    },
  },
  {
    value: "ultra",
    icon: RocketIcon,
    title: "Strong",
    description: "String compression with loss in quality",
    options: {
      quality: 50,
      preset: "veryfast",
      fps: 30,
      scale: 1,
    },
  },
  {
    value: "cooked",
    icon: CookingPotIcon,
    title: "Cooked",
    description: "Deep fried with extra crunch",
    options: {
      quality: 30,
      preset: "veryfast",
      fps: 30,
      scale: 1,
    },
  },
] as const;

export const presets = [
  {
    name: "Ultra Fast",
    value: "ultrafast",
  },
  {
    name: "Super Fast",
    value: "superfast",
  },
  {
    name: "Very Fast",
    value: "veryfast",
  },
  {
    name: "Faster",
    value: "faster",
  },
  {
    name: "Fast",
    value: "fast",
  },
  {
    name: "Medium",
    value: "medium",
  },
  {
    name: "Slow",
    value: "slow",
  },
] as const;

interface VideoSettingsProps {
  isDisabled: boolean;
  cOptions: CompressionOptions;
  onOptionsChange: (options: CompressionOptions) => void;
}

export function VideoSettings({
  isDisabled,
  cOptions,
  onOptionsChange,
}: VideoSettingsProps) {
  const [basicPreset, setBasicPreset] = useState<BasicPresets>("super");

  const handleQualityChange = (value: number) => {
    onOptionsChange({
      ...cOptions,
      quality: value,
    });
  };

  const handleScaleChange = (value: number) => {
    onOptionsChange({
      ...cOptions,
      scale: value,
    });
  };

  const handlePresetChange = (value: string) => {
    onOptionsChange({
      ...cOptions,
      preset: value as CompressionOptions["preset"],
    });
  };

  const handleFpsChange = (value: number | string) => {
    if (typeof value === "number") {
      onOptionsChange({
        ...cOptions,
        fps: value,
      });
    }
  };

  const handleBasicPresetChange = (value: BasicPresets) => {
    if (!value) return;
    const preset = toggleConfig.find((config) => config.value === value);
    setBasicPreset(value);
    if (preset) {
      onOptionsChange(preset.options);
    }
  };

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>
      <TabsContent className="flex flex-col gap-1" value="basic">
        <h3 className="text-base font-bold">Preset</h3>
        <ToggleGroup
          value={basicPreset}
          onValueChange={handleBasicPresetChange}
          className="w-full flex-col items-start gap-2"
          type="single"
          size="lg"
        >
          {toggleConfig.map((config) => (
            <ToggleItem key={config.value} {...config} />
          ))}
        </ToggleGroup>
      </TabsContent>
      <TabsContent className="flex flex-col gap-4" value="advanced">
        <div className="flex flex-col gap-2">
          <Label className="text-base font-bold" htmlFor="quality">
            Quality
          </Label>
          <Slider
            disabled={isDisabled}
            name="quality"
            id="quality"
            min={0}
            max={100}
            step={1}
            defaultValue={[cOptions.quality]}
            value={[cOptions.quality]}
            onValueChange={(value) => {
              handleQualityChange(value[0]);
            }}
          />
          <p className="text-sm text-gray-500">
            Lower quality will result in smaller file size. At maximum quality
            the video will still be compressed with minimum impact on quality.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-base font-bold" htmlFor="scale">
            Scale
          </Label>
          <Slider
            disabled={isDisabled}
            name="scale"
            id="scale"
            min={0.01}
            max={1}
            step={0.01}
            defaultValue={[cOptions.scale]}
            value={[cOptions.scale]}
            onValueChange={(value) => handleScaleChange(value[0])}
          />
          <p className="text-sm text-gray-500">
            This will shrink the video resolution. Can greatly reduce file
            size.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <Label className="text-base font-bold" htmlFor="preset">
              Preset
            </Label>
            <Select
              value={cOptions.preset}
              disabled={isDisabled}
              onValueChange={(value) => handlePresetChange(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-gray-500">
            Compression speed. A slower preset will provide slightly better
            quality, but will take longer to process. Faster values are
            recommended for most cases.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-base font-bold" htmlFor="fps">
            FPS
          </Label>
          <Input
            disabled={isDisabled}
            onChange={(e) => handleFpsChange(parseInt(e.target.value))}
            value={cOptions.fps}
            type="number"
            id="fps"
            max={120}
          />
          <p className="text-sm text-gray-500">
            Frames per second. Lower FPS will result in smaller file size
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}

interface ToggleItemProps {
  value: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const ToggleItem: React.FC<ToggleItemProps> = ({
  value,
  icon: Icon,
  title,
  description,
}) => (
  <ToggleGroupItem
    variant='outline'
    className="flex flex-row w-full justify-start items-center gap-3 h-16"
    value={value}
    name={value}
    aria-label={`Toggle ${value}`}
  >
    <Icon className="h-7 w-7 flex-shrink-0" />
    <div className="flex flex-col text-left">
      <div className="text-sm font-semibold">{title}</div>
      <p className="text-xs">{description}</p>
    </div>
  </ToggleGroupItem>
);
