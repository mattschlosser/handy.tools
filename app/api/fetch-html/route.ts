export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url || typeof url !== "string") {
    return Response.json(
      { error: "Missing or invalid url parameter" },
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
          error: `Failed to fetch HTML. Status: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const html = await response.text();
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
