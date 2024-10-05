"use client";

import { zipBlob } from "@/lib/zip-blob";
import { MagickService } from "@/services/image-magick";

import { useReducer, useEffect, useRef } from "react";

export type GenerateIconsOptions = {
  faviconSizes: number[];
  themeColor: string;
  backgroundColor: string;
};
interface MagickState {
  isReady: boolean;
  isLoading: boolean;
  isGenerating: boolean;
  error: { type: string; message: string } | null;
}

type MagickAction =
  | { type: "INIT_START" }
  | { type: "INIT_SUCCESS" }
  | { type: "INIT_FAILURE"; payload: { type: string; message: string } | null }
  | { type: "GENERATE_FAVICON_START" }
  | { type: "GENERATE_FAVICON_SUCCESS" }
  | {
      type: "GENERATE_FAVICON_FAILURE";
      payload: { type: string; message: string } | null;
    };

function faviconGeneratorReducer(
  state: MagickState,
  action: MagickAction
): MagickState {
  switch (action.type) {
    case "INIT_START":
      return { ...state, isLoading: true, error: null };
    case "INIT_SUCCESS":
      return { ...state, isReady: true, isLoading: false };
    case "INIT_FAILURE":
      return { ...state, isLoading: false, error: action.payload };
    case "GENERATE_FAVICON_START":
      return { ...state, isGenerating: true, error: null };
    case "GENERATE_FAVICON_SUCCESS":
      return { ...state, isGenerating: false };
    case "GENERATE_FAVICON_FAILURE":
      return { ...state, isGenerating: false, error: action.payload };
    default:
      return state;
  }
}

export function useFaviconGenerator() {
  const magickServiceRef = useRef<MagickService>(new MagickService());

  const [state, dispatch] = useReducer(faviconGeneratorReducer, {
    isReady: false,
    isLoading: false,
    isGenerating: false,
    error: null,
  });

  const generateIcons = async (file: File, options: GenerateIconsOptions) => {
    try {
      dispatch({ type: "GENERATE_FAVICON_START" });
      const { faviconSizes } = options;

      const config = [
        {
          size: 16,
          name: "icon-16x16.png",
        },
        {
          size: 32,
          name: "icon-32x32.png",
        },
        {
          size: 48,
          name: "icon-48x48.png",
        },
        {
          size: 256,
          name: "mstile-256x256.png",
        },
        {
          size: 180,
          name: "apple-touch-icon.png",
        },
        {
          size: 192,
          name: "icon-192x192.png",
        },
        {
          size: 512,
          name: "icon-512x512.png",
        },
      ];

      const manifestBlob = createWebManifestBlob(
        "Your site name",
        "Site Name",
        options
      );
      const favicon = await magickServiceRef.current.generateFavicon(
        file,
        faviconSizes
      );
      const icons = await Promise.all(
        config.map(async ({ size, name }) => {
          const blob = await magickServiceRef.current.generateIcon(file, size);
          return { name, blob };
        })
      );

      const archive = await zipBlob([
        ...icons,
        { name: "favicon.ico", blob: favicon },
        { name: "site.webmanifest", blob: manifestBlob },
      ]);

      dispatch({ type: "GENERATE_FAVICON_SUCCESS" });

      return archive;
    } catch (error) {
      if (error instanceof Error) {
        dispatch({
          type: "GENERATE_FAVICON_FAILURE",
          payload: { type: "Generation error", message: error.message },
        });
      } else {
        dispatch({
          type: "GENERATE_FAVICON_FAILURE",
          payload: {
            type: "Generation error",
            message: "An unknown error occurred.",
          },
        });
      }

      return null;
    }
  };

  const createWebManifestBlob = (
    name: string,
    shortName: string,
    options: GenerateIconsOptions
  ): Blob => {
    const { themeColor, backgroundColor } = options;
    const manifest = {
      name,
      short_name: shortName,
      icons: [
        {
          src: "/icon-192x192.png",
          type: "image/png",
          sizes: "192x192",
        },
        {
          src: "/icon-512x512.png",
          type: "image/png",
          sizes: "512x512",
        },
      ],
      theme_color: themeColor,
      background_color: backgroundColor,
      display: "standalone",
    };

    const manifestJson = JSON.stringify(manifest, null, 2);
    return new Blob([manifestJson], { type: "application/manifest+json" });
  };

  useEffect(() => {
    const magickService = magickServiceRef.current;
    if (!magickService) return;
    const isReady = magickService.isReady();

    if (isReady) {
      console.log("Magick is ready");
      dispatch({ type: "INIT_SUCCESS" });
      return;
    }

    if (!isReady) {
      dispatch({ type: "INIT_START" });
      magickService
        .initMagick()
        .then(() => {
          dispatch({ type: "INIT_SUCCESS" });
        })
        .catch((error) => {
          dispatch({ type: "INIT_FAILURE", payload: error.message });
        });
    }
  }, [magickServiceRef]);

  return {
    ...state,
    generateIcons,
    magickService: magickServiceRef.current,
  };
}
