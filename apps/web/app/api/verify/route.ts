import { NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let manifest: unknown;
  try {
    manifest = await request.json();
  } catch {
    return NextResponse.json(
      { valid: false, reason: "Request body must be valid JSON." },
      { status: 200 }
    );
  }

  try {
    const upstream = await fetch(`${apiBaseUrl()}/manifest/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manifest),
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
