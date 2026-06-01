import { DEFAULT_SETTINGS, readSettings, writeSettings } from "../content/shared/capture";

const form = document.querySelector<HTMLFormElement>("#settings-form");
const projectIdInput = document.querySelector<HTMLInputElement>("#project-id");
const apiUrlInput = document.querySelector<HTMLInputElement>("#api-url");
const operatorIdInput = document.querySelector<HTMLInputElement>("#operator-id");
const defaultModelInput = document.querySelector<HTMLInputElement>("#default-model");
const statusEl = document.querySelector<HTMLElement>("#status");

void init();

async function init(): Promise<void> {
  const settings = await readSettings();
  projectIdInput!.value = settings.projectId;
  apiUrlInput!.value = settings.apiUrl || DEFAULT_SETTINGS.apiUrl;
  operatorIdInput!.value = settings.operatorId || DEFAULT_SETTINGS.operatorId;
  defaultModelInput!.value = settings.defaultModel || DEFAULT_SETTINGS.defaultModel;

  form!.addEventListener("submit", (event) => {
    event.preventDefault();
    void save();
  });
}

async function save(): Promise<void> {
  await writeSettings({
    projectId: projectIdInput!.value,
    apiUrl: apiUrlInput!.value,
    operatorId: operatorIdInput!.value,
    defaultModel: defaultModelInput!.value
  });

  statusEl!.textContent = "Saved";
  window.setTimeout(() => {
    statusEl!.textContent = "";
  }, 1800);
}
