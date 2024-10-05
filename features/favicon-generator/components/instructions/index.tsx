import { CodeHighlight } from "@/components/ui/code-highlight";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateNextJsCode } from "./generate-nextjs-code";
import { generateJsxCode } from "./generate-jsx-code";
import { generateHtmlCode } from "./generate-html-code";
import { Button } from "@/components/ui/button";

export function Instructions() {
  return (
    <div className="w-full h-full flex flex-col gap-2">
      <Tabs className="w-full h-full grow overflow-y-auto" defaultValue="html">
        <TabsList className="grid w-full gap-2 grid-cols-3">
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="jsx">JSX</TabsTrigger>
          <TabsTrigger value="nextjs">NextJS</TabsTrigger>
        </TabsList>

        <TabsContent value="html">
          <p className="p-2 text-base">
            Copy the following code and paste it in your {`<head>`} tag.
          </p>
          <CodeHighlight
            language="markup"
            code={generateHtmlCode()}
            className="w-full"
          />
        </TabsContent>
        <TabsContent value="jsx">
          <p className="p-2 text-base">
            Copy the following code and paste it in your HTML {`<head>`} tag.
          </p>
          <CodeHighlight
            code={generateJsxCode()}
            language="jsx"
            className="w-full"
          />
        </TabsContent>
        <TabsContent value="nextjs">
          <p className="p-2 text-base">
            Copy the following code and paste it in your _layout meta config.
          </p>
          <CodeHighlight code={generateNextJsCode()} className="w-full" />
        </TabsContent>
      </Tabs>
      <div className="p-2 w-full mt-auto flex items-center justify-between gap-2 border bg-background rounded-md">
        <p className="p-2 text-base">
          Done? Use the meta verification tool to verify that everything is in
          place.
        </p>
        <Button>Verify Meta</Button>
      </div>
    </div>
  );
}
