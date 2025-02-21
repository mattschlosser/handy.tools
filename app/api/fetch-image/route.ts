const supportedImageExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url || typeof url !== "string") {
    return Response.json(
      { error: "Missing or invalid url parameter" },
      { status: 400 }
    );
  }

  if (!supportedImageExtensions.some((ext) => url.endsWith(ext))) {
    return Response.json(
      { error: "Invalid image url" },
      { status: 400 }
    );
  }

  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return Response.json(
        {
          error: "Invalid URL protocol. Only HTTP and HTTPS are allowed.",
        },
        { status: 400 }
      );
    }

    const response = await fetch(parsedUrl.toString());

    if (!response.ok) {
      return Response.json(
        {
          error: `Failed to fetch image. Status: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type");

    if (!contentType) {
      return Response.json(
        {
          error: "No content type found",
        },
        { status: 404 }
      );
    }

    if (!contentType.startsWith("image/")) {
      return Response.json(
        {
          error: "URL does not point to an image",
        },
        { status: 400 }
      );
    }

    const imageData = await response.blob();

    return new Response(imageData, {
      headers: {
        "Content-Type": contentType
      },
      status: 200,
    });

  } catch (error) {
    console.error("Error fetching image:", (error as Error).message);
    return Response.json(
      {
        error: "Failed to fetch image",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
