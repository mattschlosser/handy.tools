import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { parseMeta } from "../../lib/parse-meta";
import { ReloadIcon } from "@radix-ui/react-icons";
import fetchHtml from "../../lib/fetch-html";

export function MetaIconVerifier() {
  const [url, setUrl] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    // Verify the site URL
    setIsVerifying(true);
    const html = await fetchHtml(url);
    console.log(html);
    const result = await parseMeta(html, url);
    console.log("🚀 ~ handleVerify ~ result:", result);
    setIsVerifying(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <Label className="text-base font-bold" htmlFor="url">
          Site URL
        </Label>
        <Input
          onChange={(e) => setUrl(e.target.value)}
          value={url}
          type="text"
          id="url"
        />
      </div>
      <Button
        className="flex-1"
        variant="secondary"
        onClick={() => handleVerify()}
        disabled={isVerifying}
      >
        {isVerifying && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
        {isVerifying ? "Processing" : "Verify"}
      </Button>
    </div>
  );
}
