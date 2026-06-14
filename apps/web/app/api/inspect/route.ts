import { NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/i;

export async function POST(request: Request) {
  let body: { hash?: unknown };
  try {
    body = (await request.json()) as { hash?: unknown };
  } catch {
    return NextResponse.json({ ok: false, reason: "Bad request." }, { status: 200 });
  }

  if (typeof body?.hash !== "string" || !body.hash) {
    return NextResponse.json(
      { ok: false, reason: "No fingerprint provided." },
      { status: 200 }
    );
  }

  if (!SHA256_HEX_PATTERN.test(body.hash)) {
    return NextResponse.json(
      { ok: false, reason: "Fingerprint must be a 64-character SHA-256 value." },
      { status: 200 }
    );
  }

  try {
    const upstream = await fetch(`${apiBaseUrl()}/assets/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hashes: [body.hash], algorithm: "SHA-256" }),
      cache: "no-store"
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, reason: `Lookup service returned ${upstream.status}.` },
        { status: 200 }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(
      {
        ok: true,
        result: data.results?.[0] ?? { hash: body.hash, matched: false, events: [] }
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? `Lookup service unreachable: ${error.message}.`
            : "Lookup service unreachable."
      },
      { status: 200 }
    );
  }
}
