import { NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("project_id") ?? "prj_week_zero";

  const response = await fetch(`${apiBaseUrl()}/manifest/${projectId}`, {
    method: "POST",
    cache: "no-store"
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `API returned ${response.status}` },
      { status: response.status }
    );
  }

  const body = await response.text();
  return new Response(body, {
    headers: {
      "Content-Disposition": `attachment; filename="lineage-${projectId}-manifest.json"`,
      "Content-Type": "application/json"
    }
  });
}
