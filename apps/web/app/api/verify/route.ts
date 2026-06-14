import { NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_VERIFY_MANIFEST_BYTES = 1_048_576;

async function readBoundedJsonObject(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsedLength = Number.parseInt(contentLength, 10);
    if (Number.isFinite(parsedLength) && parsedLength > MAX_VERIFY_MANIFEST_BYTES) {
      return {
        error: NextResponse.json(
          { valid: false, reason: "Manifest verification payload exceeds 1 MB." },
          { status: 413 }
        )
      };
    }
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return {
      error: NextResponse.json(
        { valid: false, reason: "Request body must be valid JSON." },
        { status: 200 }
      )
    };
  }

  const chunks: Uint8Array[] = [];
  let bytesRead = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    bytesRead += value.byteLength;
    if (bytesRead > MAX_VERIFY_MANIFEST_BYTES) {
      return {
        error: NextResponse.json(
          { valid: false, reason: "Manifest verification payload exceeds 1 MB." },
          { status: 413 }
        )
      };
    }

    chunks.push(value);
  }

  const body = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const rawJson = new TextDecoder().decode(body);
  let manifest: unknown;
  try {
    manifest = JSON.parse(rawJson);
  } catch {
    return {
      error: NextResponse.json(
        { valid: false, reason: "Request body must be valid JSON." },
        { status: 200 }
      )
    };
  }

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return {
      error: NextResponse.json(
        { valid: false, reason: "Manifest payload must be a JSON object." },
        { status: 200 }
      )
    };
  }

  return { rawJson };
}

export async function POST(request: Request) {
  const parsed = await readBoundedJsonObject(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const upstream = await fetch(`${apiBaseUrl()}/manifest/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: parsed.rawJson,
      cache: "no-store"
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { valid: false, reason: `Verifier service returned ${upstream.status}.` },
        { status: 200 }
      );
    }

    const body = await upstream.json();
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        reason:
          error instanceof Error
            ? `Verifier service is unreachable: ${error.message}.`
            : "Verifier service is unreachable."
      },
      { status: 200 }
    );
  }
}
