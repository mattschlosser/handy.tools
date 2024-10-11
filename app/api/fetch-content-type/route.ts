export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  // Check if the URL parameter is provided and is a string
  if (!url || typeof url !== "string") {
    return Response.json(
      { error: "Missing or invalid url parameter" },
      { status: 400 }
    );
  }

  try {
    // Validate the URL format
    const parsedUrl = new URL(url);

    // Optional: Restrict to certain protocols (e.g., http and https)
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return Response.json(
        {
          error: "Invalid URL protocol. Only HTTP and HTTPS are allowed.",
        },
        { status: 400 }
      );
    }

    // Fetch the HTML content from the provided URL
    const response = await fetch(parsedUrl.toString(), { method: "HEAD" });

    // Check if the fetch was successful
    if (!response.ok) {
      return Response.json(
        {
          error: `Failed to fetch Content Headers. Status: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const headers = await response.headers.get("content-type");

    if (headers === null) {
      return Response.json(
        {
          error: "No content type found",
        },
        { status: 404 }
      );
    }

    return new Response(headers, {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching Content Headers:", (error as Error).message);
    return Response.json(
      {
        error: "Failed to fetch Content Type",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
