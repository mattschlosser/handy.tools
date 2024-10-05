"use client";

import { zipBlob } from "@/lib/zip-blob";
import { MagickService } from "@/services/image-magick";

import { useReducer, useEffect, useRef } from "react";

export type GenerateIconsOptions = {
  faviconSizes: number[];
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
          name: "favicon-16x16.png",
        },
        {
          size: 32,
          name: "favicon-32x32.png",
        },
        {
          size: 48,
          name: "favicon-48x48.png",
        },
        {
          size: 64,
          name: "favicon-64x64.png",
        },
        {
          size: 180,
          name: "apple-touch-icon.png",
        },
        {
          size: 192,
          name: "android-chrome-192x192.png",
        },
        {
          size: 512,
          name: "android-chrome-512x512.png",
        },
      ];

      const manifestBlob = createWebManifestBlob("Your site name", "Site Name");
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

  const createWebManifestBlob = (name: string, shortName: string): Blob => {
    const manifest = {
      name,
      short_name: shortName,
      icons: [
        {
          src: "/android-chrome-192x192.png",
          type: "image/png",
          sizes: "192x192",
        },
        {
          src: "/android-chrome-512x512.png",
          type: "image/png",
          sizes: "512x512",
        },
        {
          src: "/apple-touch-icon.png",
          type: "image/png",
          sizes: "180x180",
        },
        {
          src: "/favicon.ico",
          type: "image/x-icon",
          sizes: "48x48 72x72 96x96 128x128 256x256",
        },
      ],
      theme_color: "#ffffff",
      background_color: "#ffffff",
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
