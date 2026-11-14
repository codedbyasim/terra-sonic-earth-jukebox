import { NextRequest, NextResponse } from "next/server";
import { NASA_DATASETS } from "@/lib/nasa-datasets";
import type { SVSApiMetadata } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const svsId = Number.parseInt(id, 10);

  if (Number.isNaN(svsId) || svsId <= 0) {
    return NextResponse.json({ error: "Invalid SVS ID" }, { status: 400 });
  }

  const dataset = NASA_DATASETS.find((d) => d.svsId === svsId);

  try {
    const response = await fetch(`https://svs.gsfc.nasa.gov/${svsId}/`, {
      signal: AbortSignal.timeout(4500),
      headers: {
        Accept: "text/html",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`SVS returned HTTP ${response.status}`);
    }

    const html = await response.text();
    const titleMatch =
      html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ??
      html.match(/<title>([^<]+)<\/title>/i);
    const descMatch =
      html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ??
      html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);

    const absMatches =
      html.match(
        /https?:\/\/svs\.gsfc\.nasa\.gov\/vis\/[a-zA-Z0-9_\/.-]+\.(?:jpg|png)/gi
      ) ?? [];
    const relMatches = (
      html.match(/\/vis\/a0[0-9]+\/[a-zA-Z0-9_\/.-]+\.(?:jpg|png)/gi) ?? []
    ).map((u) => `https://svs.gsfc.nasa.gov${u}`);

    const mediaImages = [...new Set([...absMatches, ...relMatches])]
      .filter((u) => !u.includes("_thm") && !u.includes("SIGGRAPH"))
      .slice(0, 8);

    const metadata: SVSApiMetadata = {
      svsId,
      title: titleMatch
        ? titleMatch[1].replace(/\s*-\s*NASA.*$/i, "").trim()
        : (dataset?.title ?? `NASA SVS #${svsId}`),
      description: descMatch
        ? descMatch[1].replace(/&#x27;/g, "'").trim()
        : (dataset?.scienceSummary ?? ""),
      releaseDate: dataset?.timeframe ?? "NASA SVS Official Archive",
      previewImageUrl: mediaImages[0] ?? dataset?.frames[0]?.remoteUrl ?? null,
      mediaImages,
      credits: "NASA Goddard Space Flight Center Scientific Visualization Studio",
      source: "live-svs-page",
    };

    return NextResponse.json(metadata);
  } catch {
    const metadata: SVSApiMetadata = {
      svsId,
      title: dataset?.title ?? `NASA SVS #${svsId}`,
      description:
        dataset?.scienceSummary ??
        "NASA Scientific Visualization Studio Earth Information Center dataset.",
      releaseDate: dataset?.timeframe ?? "EIC Archive",
      previewImageUrl: dataset?.frames[0]?.localSrc ?? null,
      mediaImages: dataset?.frames.map((f) => f.localSrc) ?? [],
      credits: "NASA Goddard Space Flight Center Scientific Visualization Studio",
      source: "verified-local-archive",
    };
    return NextResponse.json(metadata);
  }
}
