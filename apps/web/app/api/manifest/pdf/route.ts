import { NextResponse } from "next/server";
import { apiBaseUrl, manifestDownloadFilename, projectIdFromSearchParam } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = projectIdFromSearchParam(url.searchParams);
  if (!projectId) {
    return NextResponse.json({ error: "Invalid project_id" }, { status: 400 });
  }

  const response = await fetch(`${apiBaseUrl()}/manifest/${encodeURIComponent(projectId)}/pdf`, {
    method: "POST",
    cache: "no-store"
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `API returned ${response.status}` },
      { status: response.status }
    );
  }

  const body = await response.arrayBuffer();
  return new Response(body, {
    headers: {
      "Content-Disposition": `attachment; filename="${manifestDownloadFilename(projectId, "pdf")}"`,
      "Content-Type": "application/pdf"
    }
  });
}
