export type AIEvent = {
  event_id: string;
  project_id: string;
  occurred_at: string;
  tool_identifier: string;
  tool_version: string | null;
  model_identifier: string;
  prompt_text: string;
  output_asset_url: string;
  output_asset_hash_value: string | null;
  output_asset_type: string;
  operator_user_id: string;
  operator_human_name: string | null;
  parent_event_ids: string[];
  created_at: string;
};

export type EventListResponse = {
  project_id: string;
  count: number;
  events: AIEvent[];
};

export type EventFilters = {
  project_id: string;
  start_date?: string;
  end_date?: string;
  tool?: string;
  asset?: string;
  asset_type?: string;
};

export type EventFetchResult =
  | { ok: true; data: EventListResponse }
  | { ok: false; error: string; data: EventListResponse };

export type VerificationResult =
  | {
      valid: true;
      manifestId: string;
      projectId: string;
      generatedAt: string;
      eventCount: number;
      publicKeyFingerprint: string;
      digestAlgorithm: string;
    }
  | { valid: false; reason: string };

const LOCAL_API_PROTOCOL = "http";
const LOCAL_API_HOST = "localhost";
const LOCAL_API_PORT = "8000";
const LOCAL_API_URL = `${LOCAL_API_PROTOCOL}://${LOCAL_API_HOST}:${LOCAL_API_PORT}`;
export const PROJECT_ID_PATTERN = /^prj_[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/;

export function apiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  return configuredUrl ? configuredUrl.replace(/\/+$/, "") : LOCAL_API_URL;
}

function appendIfPresent(params: URLSearchParams, key: string, value?: string) {
  if (value?.trim()) {
    params.set(key, value.trim());
  }
}

export async function fetchEvents(filters: EventFilters): Promise<EventFetchResult> {
  const params = new URLSearchParams();
  params.set("project_id", filters.project_id);
  appendIfPresent(params, "start_date", filters.start_date);
  appendIfPresent(params, "end_date", filters.end_date);
  appendIfPresent(params, "tool", filters.tool);
  appendIfPresent(params, "asset", filters.asset);
  appendIfPresent(params, "asset_type", filters.asset_type);

  try {
    const response = await fetch(`${apiBaseUrl()}/events?${params.toString()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `API returned ${response.status}`,
        data: { project_id: filters.project_id, count: 0, events: [] }
      };
    }

    return { ok: true, data: (await response.json()) as EventListResponse };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to reach API",
      data: { project_id: filters.project_id, count: 0, events: [] }
    };
  }
}

export function downloadParams(projectId: string) {
  const params = new URLSearchParams();
  params.set("project_id", projectId);
  return params.toString();
}

export function isValidProjectId(projectId: string) {
  return PROJECT_ID_PATTERN.test(projectId);
}

export function projectIdFromSearchParam(params: URLSearchParams, fallback = "prj_week_zero") {
  const rawProjectId = params.get("project_id")?.trim();
  const projectId = rawProjectId || fallback;
  return isValidProjectId(projectId) ? projectId : null;
}

export function manifestDownloadFilename(projectId: string, extension: "json" | "pdf") {
  const safeProjectId = isValidProjectId(projectId) ? projectId : "invalid-project";
  return `lineage-${safeProjectId}-manifest.${extension}`;
}

export async function verifyManifest(rawJson: string): Promise<VerificationResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { valid: false, reason: "Pasted text is not valid JSON." };
  }

  const response = await fetch("/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed),
    cache: "no-store"
  });

  return (await response.json()) as VerificationResult;
}
