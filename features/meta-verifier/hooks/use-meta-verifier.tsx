import MetaValidatorService, {
  ValidationResult,
} from "@/services/meta-validator";
import { useReducer, useCallback, useMemo } from "react";

interface MetaVerifierState {
  result: ValidationResult | null;
  isVerifying: boolean;
  error: { type: string; message: string } | null;
}

type MetaVerifierAction =
  | { type: "START_VERIFICATION" }
  | { type: "VERIFICATION_SUCCESS"; payload: ValidationResult }
  | {
      type: "VERIFICATION_ERROR";
      payload: { type: string; message: string } | null;
    };

const initialState: MetaVerifierState = {
  result: null,
  isVerifying: false,
  error: null,
};

function metaVerifierReducer(
  state: MetaVerifierState,
  action: MetaVerifierAction
): MetaVerifierState {
  switch (action.type) {
    case "START_VERIFICATION":
      return { ...state, isVerifying: true, error: null };
    case "VERIFICATION_SUCCESS":
      return {
        ...state,
        result: action.payload,
        isVerifying: false,
        error: null,
      };
    case "VERIFICATION_ERROR":
      return { ...state, isVerifying: false, error: action.payload };
    default:
      return state;
  }
}

export function useMetaVerifier() {
  const [state, dispatch] = useReducer(metaVerifierReducer, initialState);
  const metaVerifierService = useMemo(() => new MetaValidatorService(), []);

  const verifyMeta = useCallback(
    async (baseUrl: string): Promise<ValidationResult | undefined> => {
      dispatch({ type: "START_VERIFICATION" });
      try {
        const url =
          baseUrl.includes("http") || baseUrl.includes("https")
            ? baseUrl
            : `https://${baseUrl}`;
        const result = await metaVerifierService.verifyWebsite(url);
        dispatch({ type: "VERIFICATION_SUCCESS", payload: result });
        return result;
      } catch (error) {
        console.error("Error verifying: ", error);
        if (error instanceof Error) {
          dispatch({
            type: "VERIFICATION_ERROR",
            payload: {
              type: "VERIFICATION_ERROR",
              message: error.message,
            },
          });
        } else
          dispatch({
            type: "VERIFICATION_ERROR",
            payload: {
              type: "VERIFICATION_ERROR",
              message: "An error occurred while verifying the meta tags.",
            },
          });
      }
    },
    [metaVerifierService]
  );

  return {
    ...state,
    verifyMeta,
  };
}
