import {
  appendCaptureLog,
  buildEventCreate,
  isCaptureMessage,
  readSettings,
  trimTrailingSlash
} from "../content/shared/capture";
import type { CapturePayload, CaptureResponse, EventCreate } from "../types";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isCaptureMessage(message)) {
    return undefined;
  }

  void handleCapture(message.payload).then(sendResponse, (error: unknown) => {
    sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : "Capture could not complete."
    } satisfies CaptureResponse);
  });
  return true;
});

async function handleCapture(payload: CapturePayload): Promise<CaptureResponse> {
  const settings = await readSettings();

  if (!settings.projectId.trim()) {
    const response = { ok: false, error: "Set a project in Options first." } satisfies CaptureResponse;
    await appendCaptureLog({
      timestamp: new Date().toISOString(),
      tool: payload.tool.identifier,
      assetHashPrefix: "no hash",
      ok: false,
      message: response.error
    });
    await notify("LINEAGE Capture", "Set a project in Options first.");
    return response;
  }

  let hashHex: string | undefined;

  try {
    const hashedAsset = await fetchAndHashAsset(payload.assetUrl);
    hashHex = hashedAsset.hashHex;

    const event = buildEventCreate(settings, payload, hashedAsset.hashHex, hashedAsset.mimeType);
    const created = await postEvent(settings.apiUrl, event);

    await appendCaptureLog({
      timestamp: new Date().toISOString(),
      tool: payload.tool.identifier,
      assetHashPrefix: hashedAsset.hashHex.slice(0, 8),
      ok: true
    });
    await notify("LINEAGE Capture", "Runway generation captured.");

    return { ok: true, assetHash: hashedAsset.hashHex, eventId: created.event_id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Capture could not complete.";
    await appendCaptureLog({
      timestamp: new Date().toISOString(),
      tool: payload.tool.identifier,
      assetHashPrefix: hashHex?.slice(0, 8) ?? "no hash",
      ok: false,
      message
    });
    await notify("LINEAGE Capture", "Capture needs attention.");
    return { ok: false, error: message, assetHashPrefix: hashHex?.slice(0, 8) };
  }
}

async function fetchAndHashAsset(assetUrl: string): Promise<{ hashHex: string; mimeType: string }> {
  const response = await fetch(assetUrl, {
    cache: "no-store",
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`fetch failed: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const hashHex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const mimeType = response.headers.get("content-type") ?? "video/mp4";

  return { hashHex, mimeType };
}

async function postEvent(apiUrl: string, event: EventCreate): Promise<{ event_id?: string }> {
  const response = await fetch(`${trimTrailingSlash(apiUrl)}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const suffix = detail.trim() ? `: ${detail.trim().slice(0, 180)}` : "";
    throw new Error(`API returned ${response.status}${suffix}`);
  }

  return (await response.json().catch(() => ({}))) as { event_id?: string };
}

async function notify(title: string, message: string): Promise<void> {
  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: "icon-128.png",
      title,
      message
    });
  } catch {
    // Notifications are noncritical; the content script and popup still receive the result.
  }
}
