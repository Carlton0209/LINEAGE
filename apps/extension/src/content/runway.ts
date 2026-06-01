import {
  LINEAGE_MANUAL_CAPTURE_MESSAGE,
  normalizeDurationSeconds,
  readSettings,
  sendCaptureMessage
} from "./shared/capture";
import type { CapturePayload, CaptureResponse } from "../types";

// RUNWAY_SELECTORS is intentionally isolated for live DOM tuning after inspecting
// app.runwayml.com. Keep all Runway-specific selector guesses in this block.
const RUNWAY_SELECTORS = {
  promptTextareas: ["textarea", "[contenteditable='true']"],
  promptContainers: [
    "[data-testid*='prompt' i]",
    "[aria-label*='prompt' i]",
    "[class*='prompt' i]"
  ],
  modelLabels: [
    "[data-testid*='model' i]",
    "[aria-label*='model' i]",
    "[class*='model' i]",
    "[data-testid*='gen' i]"
  ],
  generationContainers: [
    "[data-testid*='generation' i]",
    "[data-testid*='asset' i]",
    "[class*='generation' i]",
    "[class*='asset' i]"
  ]
} as const;

const RUNWAY_TOOL = {
  identifier: "runway-ml",
  url: "https://app.runwayml.com"
} as const;

const capturedAssetUrls = new Set<string>();
const inFlightAssetUrls = new Set<string>();
const autoAttemptedAssetUrls = new Set<string>();

injectCaptureButton();
startAutomaticCapture();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === LINEAGE_MANUAL_CAPTURE_MESSAGE
  ) {
    void captureLatestGeneration().then(sendResponse);
    return true;
  }

  return undefined;
});

async function captureLatestGeneration(): Promise<CaptureResponse> {
  const video = findLatestUsableVideo();

  if (!video) {
    const response = { ok: false, error: "No video generation found to capture" } satisfies CaptureResponse;
    showToast(response.error);
    return response;
  }

  return captureGeneration(video, "manual");
}

async function captureGeneration(
  video: HTMLVideoElement,
  trigger: "manual" | "automatic"
): Promise<CaptureResponse> {
  const assetUrl = getVideoAssetUrl(video);

  if (!assetUrl) {
    const response = { ok: false, error: "No video URL found to capture" } satisfies CaptureResponse;
    if (trigger === "manual") {
      showToast(response.error);
    }
    return response;
  }

  if (capturedAssetUrls.has(assetUrl) || inFlightAssetUrls.has(assetUrl)) {
    const response = { ok: false, error: "Generation already captured" } satisfies CaptureResponse;
    if (trigger === "manual") {
      showToast(response.error);
    }
    return response;
  }

  const settings = await readSettings();
  const model = readModel(video) || settings.defaultModel;
  const payload: CapturePayload = {
    assetUrl,
    promptText: readPromptText(video),
    model,
    durationSeconds: normalizeDurationSeconds(video.duration),
    tool: RUNWAY_TOOL,
    assetType: "video"
  };

  inFlightAssetUrls.add(assetUrl);
  showToast("Capturing...");

  try {
    const response = await sendCaptureMessage(payload);

    if (response.ok) {
      capturedAssetUrls.add(assetUrl);
      showToast(`Captured ${response.assetHash.slice(0, 8)}`);
    } else {
      showToast(`Capture failed: ${response.error}`);
    }

    return response;
  } finally {
    inFlightAssetUrls.delete(assetUrl);
  }
}

function injectCaptureButton(): void {
  if (document.getElementById("lineage-capture-button")) {
    return;
  }

  const button = document.createElement("button");
  button.id = "lineage-capture-button";
  button.type = "button";
  button.setAttribute("aria-label", "Capture latest LINEAGE generation");
  button.style.position = "fixed";
  button.style.right = "18px";
  button.style.bottom = "18px";
  button.style.zIndex = "2147483647";
  button.style.width = "44px";
  button.style.height = "44px";
  button.style.borderRadius = "999px";
  button.style.border = "1px solid rgba(245, 241, 234, 0.28)";
  button.style.background = "#0F1419";
  button.style.boxShadow = "0 18px 42px rgba(0, 0, 0, 0.32)";
  button.style.cursor = "pointer";
  button.style.display = "grid";
  button.style.placeItems = "center";

  const dot = document.createElement("span");
  dot.style.width = "16px";
  dot.style.height = "16px";
  dot.style.borderRadius = "999px";
  dot.style.background = "#E97451";
  dot.style.display = "block";
  dot.style.boxShadow = "0 0 0 6px rgba(233, 116, 81, 0.16)";
  button.append(dot);

  button.addEventListener("click", () => {
    void captureLatestGeneration();
  });

  document.documentElement.append(button);
}

function startAutomaticCapture(): void {
  const observe = () => {
    scanVideosForAutomaticCapture();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          if (mutation.target instanceof HTMLVideoElement) {
            trackVideoForAutomaticCapture(mutation.target);
          }

          if (
            mutation.target instanceof HTMLSourceElement &&
            mutation.target.parentElement instanceof HTMLVideoElement
          ) {
            trackVideoForAutomaticCapture(mutation.target.parentElement);
          }
        }

        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) {
            continue;
          }

          if (node instanceof HTMLVideoElement) {
            trackVideoForAutomaticCapture(node);
          }

          if (node instanceof HTMLSourceElement && node.parentElement instanceof HTMLVideoElement) {
            trackVideoForAutomaticCapture(node.parentElement);
          }

          node.querySelectorAll("video").forEach((video) => {
            trackVideoForAutomaticCapture(video);
          });

          node.querySelectorAll("source[src]").forEach((source) => {
            if (source.parentElement instanceof HTMLVideoElement) {
              trackVideoForAutomaticCapture(source.parentElement);
            }
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"]
    });
  };

  if (document.body) {
    observe();
  } else {
    document.addEventListener("DOMContentLoaded", observe, { once: true });
  }
}

function scanVideosForAutomaticCapture(): void {
  document.querySelectorAll("video").forEach((video) => {
    trackVideoForAutomaticCapture(video);
  });
}

function trackVideoForAutomaticCapture(video: HTMLVideoElement): void {
  const assetUrl = getVideoAssetUrl(video);

  if (!assetUrl || autoAttemptedAssetUrls.has(assetUrl) || capturedAssetUrls.has(assetUrl)) {
    return;
  }

  const attempt = () => {
    const nextUrl = getVideoAssetUrl(video);
    if (!nextUrl || autoAttemptedAssetUrls.has(nextUrl) || capturedAssetUrls.has(nextUrl)) {
      return;
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    autoAttemptedAssetUrls.add(nextUrl);
    void captureGeneration(video, "automatic");
  };

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    attempt();
    return;
  }

  video.addEventListener("loadeddata", attempt, { once: true });
  video.addEventListener("canplay", attempt, { once: true });
}

function findLatestUsableVideo(): HTMLVideoElement | null {
  const videos = [...document.querySelectorAll("video")]
    .filter((video): video is HTMLVideoElement => video instanceof HTMLVideoElement)
    .filter((video) => Boolean(getVideoAssetUrl(video)))
    .filter(isVisible);

  return videos.at(-1) ?? null;
}

function readPromptText(video: HTMLVideoElement): string {
  const textareaText = findLatestTextFromSelectors(RUNWAY_SELECTORS.promptTextareas);
  if (textareaText) {
    return textareaText;
  }

  const nearbyPrompt = findTextNearVideo(video, RUNWAY_SELECTORS.promptContainers);
  if (nearbyPrompt) {
    return nearbyPrompt;
  }

  const promptLikeText = findPromptLikeVisibleText(video);
  if (promptLikeText) {
    return promptLikeText;
  }

  return "(prompt not captured)";
}

function readModel(video: HTMLVideoElement): string | undefined {
  return findTextNearVideo(video, RUNWAY_SELECTORS.modelLabels) || findLatestTextFromSelectors(RUNWAY_SELECTORS.modelLabels);
}

function findLatestTextFromSelectors(selectors: readonly string[]): string | undefined {
  for (const selector of selectors) {
    const elements = [...document.querySelectorAll(selector)].filter(isVisible);
    const values = elements.map(readElementText).filter(Boolean);
    const latest = values.at(-1);
    if (latest) {
      return cleanText(latest);
    }
  }

  return undefined;
}

function findTextNearVideo(video: HTMLVideoElement, selectors: readonly string[]): string | undefined {
  const containers = nearestContainers(video);

  for (const container of containers) {
    for (const selector of selectors) {
      const values = [...container.querySelectorAll(selector)]
        .filter(isVisible)
        .map(readElementText)
        .filter(Boolean);
      const latest = values.at(-1);
      if (latest) {
        return cleanText(latest);
      }
    }
  }

  return undefined;
}

function findPromptLikeVisibleText(video: HTMLVideoElement): string | undefined {
  const videoRect = video.getBoundingClientRect();
  const candidates = [...document.querySelectorAll("p, span, div")]
    .filter(isVisible)
    .map((element) => ({ element, text: cleanText(readElementText(element)) }))
    .filter(({ text }) => looksLikePrompt(text))
    .map(({ element, text }) => ({
      text,
      distance: distanceBetweenRects(videoRect, element.getBoundingClientRect())
    }))
    .sort((a, b) => a.distance - b.distance);

  return candidates[0]?.text;
}

function nearestContainers(video: HTMLVideoElement): Element[] {
  const matches = RUNWAY_SELECTORS.generationContainers
    .map((selector) => video.closest(selector))
    .filter((value): value is Element => value !== null);

  return [...matches, video.parentElement, video.parentElement?.parentElement, document.body].filter(
    (value): value is Element => value !== null
  );
}

function readElementText(element: Element): string {
  if (element instanceof HTMLTextAreaElement) {
    return element.value;
  }

  if (element instanceof HTMLInputElement) {
    return element.value;
  }

  return element.textContent?.trim() || element.getAttribute("aria-label") || "";
}

function getVideoAssetUrl(video: HTMLVideoElement): string {
  const source = video.querySelector<HTMLSourceElement>("source[src]");
  return video.currentSrc || video.src || source?.src || "";
}

function looksLikePrompt(text: string): boolean {
  if (text.length < 12 || text.length > 800) {
    return false;
  }

  const lower = text.toLowerCase();
  const ignoredFragments = ["runway", "upgrade", "download", "share", "settings", "generate"];
  if (ignoredFragments.some((fragment) => lower === fragment || lower.startsWith(`${fragment} `))) {
    return false;
  }

  return text.includes(" ") && /[a-zA-Z]/.test(text);
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
}

function distanceBetweenRects(a: DOMRect, b: DOMRect): number {
  const ax = a.left + a.width / 2;
  const ay = a.top + a.height / 2;
  const bx = b.left + b.width / 2;
  const by = b.top + b.height / 2;
  return Math.hypot(ax - bx, ay - by);
}

let toast: HTMLDivElement | null = null;
let toastTimer: number | undefined;

function showToast(message: string): void {
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "lineage-capture-toast";
    toast.style.position = "fixed";
    toast.style.right = "18px";
    toast.style.bottom = "74px";
    toast.style.zIndex = "2147483647";
    toast.style.maxWidth = "360px";
    toast.style.padding = "12px 14px";
    toast.style.borderRadius = "8px";
    toast.style.background = "#0F1419";
    toast.style.color = "#F5F1EA";
    toast.style.border = "1px solid rgba(245, 241, 234, 0.2)";
    toast.style.boxShadow = "0 18px 42px rgba(0, 0, 0, 0.32)";
    toast.style.font = "13px/1.4 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    document.documentElement.append(toast);
  }

  toast.textContent = message;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast?.remove();
    toast = null;
  }, 4200);
}
