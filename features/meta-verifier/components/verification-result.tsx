import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { CircleAlertIcon, CircleCheckIcon, CircleXIcon } from "lucide-react";

interface VerificationResultProps {
  title: string;
  found: boolean;
  description: string;
  errors: string[] | null;
  className?: string;
}

export function VerificationResult(props: VerificationResultProps) {
  const { title, found, description, errors, className } = props;
  const isSuccess = found && !errors?.length;
  const isWarning = found && errors && errors?.length > 0;
  const isNotFound = !found;

  return (
    <Alert
      variant={isSuccess ? "success" : isWarning ? "warning" : "destructive"}
      className={cn(className)}
    >
      {isSuccess && <CircleCheckIcon className="h-5 w-5" />}
      {isWarning && <CircleAlertIcon className="h-5 w-5" />}
      {isNotFound && <CircleXIcon className="h-5 w-5" />}

      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p className="text-xs">{description}</p>
        {isWarning && (
          <div className="flex flex-col">
            <p className="text-sm font-semibold">Issues:</p>
            <ul className="list-disc pl-4">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
