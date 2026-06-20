import { NextResponse } from "next/server";
import { apiBaseUrl, isValidProjectId } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FORWARDED_FILTERS = ["start_date", "end_date", "tool", "asset", "asset_type"] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("project_id")?.trim();
  if (!projectId || !isValidProjectId(projectId)) {
    return NextResponse.json({ error: "Invalid project_id" }, { status: 400 });
  }

  const params = new URLSearchParams();
  params.set("project_id", projectId);
  for (const key of FORWARDED_FILTERS) {
    const value = url.searchParams.get(key)?.trim();
    if (value) {
      params.set(key, value);
    }
  }

  try {
    const response = await fetch(`${apiBaseUrl()}/events?${params.toString()}`, {
      cache: "no-store"
    });

    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/json"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to reach API"
      },
      { status: 502 }
    );
  }
}
