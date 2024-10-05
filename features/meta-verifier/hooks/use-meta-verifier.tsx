import fetchHtml from "@/lib/fetch-html";
import MetaVerifierService, {
  VerificationResult,
} from "@/services/meta-verifier";
import { useReducer, useCallback } from "react";

interface MetaVerifierState {
  result: VerificationResult | null;
  isVerifying: boolean;
  error: { type: string; message: string } | null;
}

type MetaVerifierAction =
  | { type: "START_VERIFICATION" }
  | { type: "VERIFICATION_SUCCESS", payload: VerificationResult }
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
  const metaVerifierService = new MetaVerifierService();

  const verifyMeta = useCallback(
    async (baseUrl: string): Promise<VerificationResult | undefined> => {
      dispatch({ type: "START_VERIFICATION" });
      try {
        const html = await fetchHtml(baseUrl);
        const result = await metaVerifierService.parseMeta(html, baseUrl);
        dispatch({ type: "VERIFICATION_SUCCESS", payload: result });
        return result;
      } catch (error) {
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
    []
  );

  return {
    ...state,
    verifyMeta,
  };
}
