export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  // Check if the URL parameter is provided and is a string
  if (!url || typeof url !== "string") {
    return Response.json(
      { error: "Missing or invalid url parameter" },
      { status: 400 }
    );
    return;
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
    const response = await fetch(parsedUrl.toString());

    // Check if the fetch was successful
    if (!response.ok) {
      return Response.json(
        {
          error: `Failed to fetch HTML. Status: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Set the Content-Type header to text/html
    // Send the HTML content as the response
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error fetching HTML:", (error as Error).message);
    return Response.json(
      {
        error: "Failed to fetch the specified URL",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
