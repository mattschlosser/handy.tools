"use client";

import Confetti from "react-confetti";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SiteUrlInput } from "./components/site-url-input";
import { useMetaVerifier } from "./hooks/use-meta-verifier";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Spinner } from "@/components/ui/spinner";
import { VerificationResult } from "./components/verification-result";
import { AnimatePresence, motion } from "framer-motion";

export default function MetaVerifier() {
  const [showConfetti, setShowConfetti] = useState(false);
  const { error, isVerifying, verifyMeta, result } = useMetaVerifier();

  const handleVerify = async (url: string) => {
    const result = await verifyMeta(url);
    const isSuccessful = result?.metaTags?.every(
      (tag) => tag.errors.length === 0
    );

    if (isSuccessful) {
      setShowConfetti(true);
    }
  };

  const isDisabled = isVerifying;

  return (
    <div className="grow flex flex-col gap-4 h-full w-full md:overflow-hidden">
      <h1 className="text-2xl font-bold">Meta tags verifier</h1>
      <div className="grow flex flex-col gap-4 w-full h-full mx-auto md:overflow-hidden">
        <div className="grow grid items-start md:grid-cols-3 gap-4 w-full h-full mx-auto md:overflow-hidden">
          <div
            className={cn(
              "relative flex flex-col gap-2 md:col-span-2 border p-2 rounded-md bg-card h-full min-h-[300px] overflow-x-auto transition-all duration-200"
            )}
          >
            {isVerifying && (
              <Spinner className="absolute inset-0 m-auto w-12 h-12" />
            )}
            {!isVerifying && result && (
              <div className="flex flex-col gap-6 p-2">
                <div className="flex flex-col gap-4">
                  <div className="text-lg font-semibold">Meta Tags</div>
                  <div className="flex flex-col gap-3">
                    <AnimatePresence>
                      {result.metaTags.map((tag, i) => (
                        <motion.div
                          initial={{ opacity: 0, transform: "translateY(10%)" }}
                          animate={{ opacity: 1, transform: "translateY(0%)" }}
                          exit={{ opacity: 0, transform: "translateY(10%)" }}
                          key={tag.title + i}
                        >
                          <VerificationResult
                            title={tag.title}
                            description={tag.description}
                            errors={tag.errors}
                            successes={tag.successes}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
                {result.manifest && result.manifest?.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <div className="text-lg font-semibold">Web Manifest</div>
                    <div className="flex flex-col gap-3">
                      {result.manifest.map((tag) => (
                        <VerificationResult
                          key={tag.title}
                          title={tag.title}
                          description={tag.description}
                          errors={tag.errors}
                          successes={tag.successes}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <aside className="flex flex-col col-span-1 gap-4 h-full">
            <div className="flex flex-col gap-2 border bg-card p-4 rounded-md">
              <SiteUrlInput
                isVerifying={isVerifying}
                isDisabled={isDisabled}
                onSubmit={handleVerify}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <AlertTitle>{error.type || "Error"}</AlertTitle>
                <AlertDescription>
                  {error.message || "An unexpected error occurred"}
                </AlertDescription>
              </Alert>
            )}
          </aside>
        </div>

        {showConfetti && (
          <Confetti
            numberOfPieces={1000}
            tweenDuration={8000}
            recycle={false}
            onConfettiComplete={() => setShowConfetti(false)}
          />
        )}
      </div>
    </div>
  );
}
