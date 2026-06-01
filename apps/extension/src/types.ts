export type AssetType = "image" | "video" | "audio" | "text";

export type HashDigest = {
  algorithm: "SHA-256";
  value: string;
};

export type ToolPayload = {
  identifier: string;
  version?: string | null;
  url?: string | null;
};

export type ModelPayload = {
  identifier: string;
  version?: string | null;
};

export type ReferenceAssetPayload = {
  assetUrl?: string | null;
  assetHash: HashDigest;
  assetType: AssetType;
  relationship?: string | null;
};

export type EventInputPayload = {
  promptText: string;
  negativePromptText?: string | null;
  parameters: Record<string, unknown>;
  referenceAssets: ReferenceAssetPayload[];
};

export type EventOutputPayload = {
  assetUrl: string;
  assetHash: HashDigest;
  assetType: AssetType;
  mimeType?: string | null;
  durationSeconds?: number | null;
};

export type OperatorPayload = {
  userId: string;
  humanName?: string | null;
};

export type ProvenancePayload = {
  parentEventIds: string[];
};

export type EventCreate = {
  eventId?: string | null;
  timestamp: string;
  projectId: string;
  tool: ToolPayload;
  model: ModelPayload;
  input: EventInputPayload;
  output: EventOutputPayload;
  operator: OperatorPayload;
  provenance: ProvenancePayload;
};

export type ExtensionSettings = {
  projectId: string;
  apiUrl: string;
  operatorId: string;
  defaultModel: string;
};

export type CapturePayload = {
  assetUrl: string;
  promptText: string;
  model?: string;
  durationSeconds?: number;
  tool: ToolPayload;
  assetType: "video";
};

export type CaptureResponse =
  | {
      ok: true;
      assetHash: string;
      eventId?: string;
    }
  | {
      ok: false;
      error: string;
      assetHashPrefix?: string;
    };

export type CaptureLogEntry = {
  timestamp: string;
  tool: string;
  assetHashPrefix: string;
  ok: boolean;
  message?: string;
};

export type LineageCaptureMessage = {
  type: "LINEAGE_CAPTURE";
  payload: CapturePayload;
};

export type LineageManualCaptureMessage = {
  type: "LINEAGE_MANUAL_CAPTURE";
};

export type LineageMessage = LineageCaptureMessage | LineageManualCaptureMessage;
