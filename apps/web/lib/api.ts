export type EventRead = {
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

export type AIEvent = EventRead;

export type EventListResponse = {
  project_id: string;
  count: number;
  events: EventRead[];
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

export type VerificationFinding = {
  eventId: string;
  level: "attention" | "informational";
  message: string;
};

export type VerificationStage = {
  id: string;
  name: string;
  status: "verified" | "attention" | "informational" | "failed";
  detail: string;
  findings: VerificationFinding[];
};

export type VerificationReport = {
  overall: {
    status: "verified" | "verified_with_attention" | "failed";
    summary: string;
  };
  project: {
    id: string;
    title: string | null;
    productionCompany: string | null;
    deliveryTarget: string | null;
  } | null;
  issuerFingerprint: string | null;
  stages: VerificationStage[];
  disclosure: {
    category: string;
    status: "verified" | "attention";
  }[];
};

export type AssetLookupResult = {
  hash: string;
  matched: boolean;
  events: EventRead[];
};

export type InspectHashResult =
  | { ok: true; result: AssetLookupResult }
  | { ok: false; reason: string };

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
  return fetchEventsFromEndpoint(filters, `${apiBaseUrl()}/events`);
}

export async function fetchEventsFromRoute(filters: EventFilters): Promise<EventFetchResult> {
  return fetchEventsFromEndpoint(filters, "/api/events");
}

async function fetchEventsFromEndpoint(
  filters: EventFilters,
  endpoint: string
): Promise<EventFetchResult> {
  const params = new URLSearchParams();
  params.set("project_id", filters.project_id);
  appendIfPresent(params, "start_date", filters.start_date);
  appendIfPresent(params, "end_date", filters.end_date);
  appendIfPresent(params, "tool", filters.tool);
  appendIfPresent(params, "asset", filters.asset);
  appendIfPresent(params, "asset_type", filters.asset_type);

  try {
    const response = await fetch(`${endpoint}?${params.toString()}`, {
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

export function verificationReportFromIssue(summary: string, detail: string): VerificationReport {
  return {
    overall: { status: "failed", summary },
    project: null,
    issuerFingerprint: null,
    stages: [
      {
        id: "structure",
        name: "Structure",
        status: "failed",
        detail,
        findings: []
      },
      {
        id: "integrity",
        name: "Integrity",
        status: "informational",
        detail: "could not run - structure did not produce a manifest",
        findings: []
      },
      {
        id: "issuer",
        name: "Issuer",
        status: "informational",
        detail:
          "issuer key could not be identified. LINEAGE does not verify the issuer's real-world identity; confirm the key fingerprint with the issuer through a separate channel.",
        findings: []
      },
      {
        id: "provenance",
        name: "Provenance",
        status: "informational",
        detail: "could not run - no event graph available",
        findings: []
      },
      {
        id: "completeness",
        name: "Completeness",
        status: "informational",
        detail: "could not run - no manifest events available",
        findings: []
      },
      {
        id: "asset_match",
        name: "Asset Match",
        status: "informational",
        detail: "skipped — no files provided",
        findings: []
      }
    ],
    disclosure: []
  };
}

export async function verifyManifest(
  rawJson: string,
  assetHashes?: string[]
): Promise<VerificationReport> {
  let manifest: unknown;
  try {
    manifest = JSON.parse(rawJson);
  } catch {
    return verificationReportFromIssue(
      "Manifest could not be read as JSON.",
      "malformed: pasted text is not valid JSON"
    );
  }

  const hasAssetHashes = Boolean(assetHashes?.length);
  const response = await fetch("/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: hasAssetHashes ? JSON.stringify({ manifest, assetHashes }) : rawJson,
    cache: "no-store"
  });

  return (await response.json()) as VerificationReport;
}

export async function inspectHash(hash: string): Promise<InspectHashResult> {
  const response = await fetch("/api/inspect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash }),
    cache: "no-store"
  });

  return (await response.json()) as InspectHashResult;
}
