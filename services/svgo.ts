import { Config } from "svgo";

//@ts-expect-error import not found
import { optimize } from "svgo/dist/svgo.browser";

class SVGO {
  public optimizeSVG(svg: string, options: Config): string {
    console.log("Optimizing SVG...", options);
    const result = optimize(svg, {
      ...options,
    });

    if ("data" in result) {
      return result.data;
    } else {
      throw new Error("SVG optimization failed");
    }
  }
}

export default SVGO;
