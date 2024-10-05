import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ReloadIcon } from "@radix-ui/react-icons";

type SiteUrlInputProps = {
  isVerifying: boolean;
  isDisabled: boolean;
  onSubmit: (url: string) => void;
  className?: string;
};

export function SiteUrlInput(props: SiteUrlInputProps) {
  const { isVerifying, isDisabled, onSubmit, className } = props;
  const [url, setUrl] = useState("");
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label className="text-base font-bold" htmlFor="url">
        Site URL
      </Label>
      <div className="flex flex-col gap-2">
        <Input
          disabled={isVerifying || isDisabled}
          onChange={(e) => setUrl(e.target.value)}
          value={url}
          type="url"
          id="url"
          placeholder="https://example.com"
        />
        <Button onClick={() => onSubmit(url)} disabled={isVerifying}>
          {isVerifying && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          {isVerifying ? "Verifying..." : "Verify"}
        </Button>
      </div>
    </div>
  );
}
