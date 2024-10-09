import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { CircleCheckIcon, CircleXIcon } from "lucide-react";

interface VerificationResultProps {
  title: string;
  description: string;
  errors?: string[];
  successes?: string[];
  className?: string;
}

export function VerificationResult(props: VerificationResultProps) {
  const { title, description, errors = [], successes = [], className } = props;
  const isSuccess = errors?.length === 0;
  const isError = errors?.length > 0 && successes?.length === 0;

  const messages = [
    ...(successes || []).map((m) => ({
      message: m,
      type: "success",
    })),
    ...(errors || []).map((m) => ({
      message: m,
      type: "error",
    })),
  ].sort((a) => (a.type === "success" ? -1 : 1));

  return (
    <Alert
      variant={isSuccess ? "success" : isError ? "destructive" : "warning"}
      className={cn(className)}
    >
      <AlertTitle className="text-base font-bold mb-0">{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p className="text-sm">{description}</p>
        {messages.length > 0 && (
          <ul className="flex flex-col gap-1">
            {messages.map((m, i) => (
              <li key={i} className="text-xs">
                <div className="flex gap-1.5">
                  {m.type === "error" && (
                    <CircleXIcon className="h-4 w-4 text-destructive" />
                  )}
                  {m.type === "success" && (
                    <CircleCheckIcon className="h-4 w-4 text-success" />
                  )}
                  {m.message}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
