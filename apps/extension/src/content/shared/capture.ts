import type {
  CaptureLogEntry,
  CapturePayload,
  CaptureResponse,
  EventCreate,
  ExtensionSettings,
  LineageCaptureMessage
} from "../../types";

export const DEFAULT_SETTINGS: ExtensionSettings = {
  projectId: "",
  apiUrl: "http://localhost:8000",
  operatorId: "op_extension",
  defaultModel: "gen-3-alpha"
};

export const CAPTURE_LOG_KEY = "lineage.captureLog";
export const LINEAGE_CAPTURE_MESSAGE = "LINEAGE_CAPTURE";
export const LINEAGE_MANUAL_CAPTURE_MESSAGE = "LINEAGE_MANUAL_CAPTURE";

export function isCaptureMessage(message: unknown): message is LineageCaptureMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === LINEAGE_CAPTURE_MESSAGE &&
    "payload" in message
  );
}

export async function readSettings(): Promise<ExtensionSettings> {
  const stored = (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Partial<ExtensionSettings>;

  return {
    projectId: stringOrDefault(stored.projectId, DEFAULT_SETTINGS.projectId),
    apiUrl: stringOrDefault(stored.apiUrl, DEFAULT_SETTINGS.apiUrl),
    operatorId: stringOrDefault(stored.operatorId, DEFAULT_SETTINGS.operatorId),
    defaultModel: stringOrDefault(stored.defaultModel, DEFAULT_SETTINGS.defaultModel)
  };
}

export async function writeSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.sync.set({
    projectId: settings.projectId.trim(),
    apiUrl: settings.apiUrl.trim() || DEFAULT_SETTINGS.apiUrl,
    operatorId: settings.operatorId.trim() || DEFAULT_SETTINGS.operatorId,
    defaultModel: settings.defaultModel.trim() || DEFAULT_SETTINGS.defaultModel
  });
}

export function normalizeDurationSeconds(duration: number): number | undefined {
  if (!Number.isFinite(duration) || duration <= 0) {
    return undefined;
  }

  return duration;
}

export function buildEventCreate(
  settings: ExtensionSettings,
  capture: CapturePayload,
  hashHex: string,
  mimeType: string | null
): EventCreate {
  return {
    timestamp: new Date().toISOString(),
    projectId: settings.projectId,
    tool: {
      identifier: capture.tool.identifier,
      version: capture.tool.version ?? null,
      url: capture.tool.url ?? null
    },
    model: {
      identifier: (capture.model || settings.defaultModel).trim() || settings.defaultModel
    },
    input: {
      promptText: capture.promptText.trim() || "(prompt not captured)",
      parameters: {},
      referenceAssets: []
    },
    output: {
      assetUrl: capture.assetUrl,
      assetHash: { algorithm: "SHA-256", value: hashHex.toLowerCase() },
      assetType: capture.assetType,
      mimeType,
      durationSeconds: capture.durationSeconds ?? null
    },
    operator: { userId: settings.operatorId },
    provenance: { parentEventIds: [] }
  };
}

export function sendCaptureMessage(payload: CapturePayload): Promise<CaptureResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: LINEAGE_CAPTURE_MESSAGE, payload }, (response) => {
      const message = chrome.runtime.lastError?.message;
      if (message) {
        resolve({ ok: false, error: message });
        return;
      }

      resolve(toCaptureResponse(response));
    });
  });
}

export async function readCaptureLog(): Promise<CaptureLogEntry[]> {
  const stored = await chrome.storage.local.get(CAPTURE_LOG_KEY);
  const raw = stored[CAPTURE_LOG_KEY];
  return Array.isArray(raw) ? raw.filter(isCaptureLogEntry) : [];
}

export async function appendCaptureLog(entry: CaptureLogEntry): Promise<void> {
  const current = await readCaptureLog();
  await chrome.storage.local.set({ [CAPTURE_LOG_KEY]: [entry, ...current].slice(0, 20) });
}

export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function toCaptureResponse(response: unknown): CaptureResponse {
  if (
    typeof response === "object" &&
    response !== null &&
    "ok" in response &&
    response.ok === true &&
    "assetHash" in response &&
    typeof response.assetHash === "string"
  ) {
    return {
      ok: true,
      assetHash: response.assetHash,
      eventId: "eventId" in response && typeof response.eventId === "string" ? response.eventId : undefined
    };
  }

  if (
    typeof response === "object" &&
    response !== null &&
    "ok" in response &&
    response.ok === false &&
    "error" in response &&
    typeof response.error === "string"
  ) {
    return {
      ok: false,
      error: response.error,
      assetHashPrefix:
        "assetHashPrefix" in response && typeof response.assetHashPrefix === "string"
          ? response.assetHashPrefix
          : undefined
    };
  }

  return { ok: false, error: "Capture channel returned an unreadable response" };
}

function isCaptureLogEntry(value: unknown): value is CaptureLogEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "timestamp" in value &&
    typeof value.timestamp === "string" &&
    "tool" in value &&
    typeof value.tool === "string" &&
    "assetHashPrefix" in value &&
    typeof value.assetHashPrefix === "string" &&
    "ok" in value &&
    typeof value.ok === "boolean"
  );
}
