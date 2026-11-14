import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url query parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  // Strict allowlist: only proxy official NASA SVS visualization assets
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== "svs.gsfc.nasa.gov" ||
    !parsed.pathname.startsWith("/vis/")
  ) {
    return NextResponse.json(
      { error: "Only https://svs.gsfc.nasa.gov/vis/... URLs are allowed" },
      { status: 403 }
    );
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream SVS returned HTTP ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "URL did not return an image asset" },
        { status: 415 }
      );
    }

    const bytes = await upstream.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch NASA SVS asset" },
      { status: 502 }
    );
  }
}
