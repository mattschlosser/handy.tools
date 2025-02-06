import SVGO from "@/services/svgo";
import { useReducer } from "react";

type State = {
  minifiedSvg: string;
  isMinifying: boolean;
  error: {
    type: string;
    message: string;
  } | null;
};

type Action =
  | { type: "SET_MINIFIED"; payload: string }
  | { type: "SET_ERROR"; payload: { type: string; message: string } }
  | { type: "START_MINIFYING" }
  | { type: "FINISH_MINIFYING" };

export type MinifierOptions = {
  floatPrecision: number;
}

const initialState: State = {
  minifiedSvg: "",
  isMinifying: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_MINIFIED":
      return {
        ...state,
        minifiedSvg: action.payload,
        isMinifying: false,
        error: null,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, isMinifying: false };
    case "START_MINIFYING":
      return { ...state, isMinifying: true, error: null };
    case "FINISH_MINIFYING":
      return { ...state, isMinifying: false };
    default:
      return state;
  }
}

export function useSvgMinifier() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const minifySvg = async (svg: File, options: MinifierOptions) => {
    try {
      dispatch({ type: "START_MINIFYING" });
      const svgString = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(svg);
      });


      const SVGOService = new SVGO();
      const result = await new Promise<string>((resolve, reject) => {
        try {
          const optimizedSvg = SVGOService.optimizeSVG(svgString, {
            floatPrecision: options.floatPrecision ?? 1,
            plugins: [
              {
                name: "preset-default",
                params: {
                  overrides: {

                  }
                }
              },
            ],
          });
          resolve(optimizedSvg);
        } catch (error) {
          reject(error);
        }
      });

      dispatch({ type: "SET_MINIFIED", payload: result });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: { type: "Error", message: (error as Error).message } });
    } finally {
      dispatch({ type: "FINISH_MINIFYING" });
    }
  }

  return {
    minifiedSvg: state.minifiedSvg,
    isMinifying: state.isMinifying,
    error: state.error,
    minifySvg,
  };
}
