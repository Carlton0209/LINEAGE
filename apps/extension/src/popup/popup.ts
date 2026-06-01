import { readCaptureLog, readSettings } from "../content/shared/capture";
import type { CaptureLogEntry, CaptureResponse } from "../types";

const projectIdEl = document.querySelector<HTMLElement>("#project-id");
const apiUrlEl = document.querySelector<HTMLElement>("#api-url");
const captureButton = document.querySelector<HTMLButtonElement>("#capture-button");
const optionsLink = document.querySelector<HTMLButtonElement>("#options-link");
const statusEl = document.querySelector<HTMLElement>("#status");
const logEl = document.querySelector<HTMLUListElement>("#capture-log");

void init();

async function init(): Promise<void> {
  await renderSettings();
  await renderLog();

  captureButton!.addEventListener("click", () => {
    void requestManualCapture();
  });

  optionsLink!.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
}

async function renderSettings(): Promise<void> {
  const settings = await readSettings();

  if (settings.projectId) {
    projectIdEl!.textContent = settings.projectId;
  } else {
    const link = document.createElement("button");
    link.type = "button";
    link.className = "inline-link";
    link.textContent = "Set a project in Options";
    link.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
    projectIdEl!.replaceChildren(link);
  }

  apiUrlEl!.textContent = settings.apiUrl;
}

async function renderLog(): Promise<void> {
  const entries = (await readCaptureLog()).slice(0, 3);
  logEl!.replaceChildren(...entries.map(renderLogEntry));

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No captures yet";
    empty.className = "time";
    logEl!.append(empty);
  }
}

async function requestManualCapture(): Promise<void> {
  setStatus("Capturing...");
  captureButton!.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      setStatus("Open a Runway tab first.");
      return;
    }

    const response = (await chrome.tabs.sendMessage(tab.id, {
      type: "LINEAGE_MANUAL_CAPTURE"
    })) as CaptureResponse;

    if (response.ok) {
      setStatus(`Captured ${response.assetHash.slice(0, 8)}`);
    } else {
      setStatus(`Capture failed: ${response.error}`);
    }
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Runway tab did not respond.");
  } finally {
    captureButton!.disabled = false;
    await renderLog();
  }
}

function renderLogEntry(entry: CaptureLogEntry): HTMLLIElement {
  const item = document.createElement("li");

  const dot = document.createElement("span");
  dot.className = entry.ok ? "dot ok" : "dot";
  dot.setAttribute("aria-hidden", "true");

  const main = document.createElement("span");
  main.className = "log-main";

  const tool = document.createElement("span");
  tool.className = "tool";
  tool.textContent = entry.tool;

  const time = document.createElement("span");
  time.className = "time";
  time.textContent = formatTime(entry.timestamp);

  main.append(tool, document.createTextNode(" "), time);

  const hash = document.createElement("span");
  hash.className = "hash";
  hash.textContent = entry.assetHashPrefix;

  item.append(dot, main, hash);
  return item;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function setStatus(message: string): void {
  statusEl!.textContent = message;
}
