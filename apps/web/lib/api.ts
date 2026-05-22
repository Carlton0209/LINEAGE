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

export function apiBaseUrl() {
  return process.env.LINEAGE_API_URL ?? "http://localhost:8000";
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
