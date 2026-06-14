"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { SiteHeader } from "@/components/site-header";
import {
  inspectHash,
  type EventRead,
  type InspectHashResult
} from "@/lib/api";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FILE_INPUT_ID = "inspect-video-input";
const LARGE_FILE_BYTES = 500 * 1024 * 1024;

type VideoMetadata = {
  key: string;
  status: "loading" | "ready";
  duration?: number;
  width?: number;
  height?: number;
};

function BackgroundOrnament() {
  return <div className="background-ornament" />;
}

function TextRoll({ label }: { label: string }) {
  return (
    <span className="h-[20px] overflow-hidden">
      <span className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2">
        <span className="h-[20px] leading-[20px]">{label}</span>
        <span className="h-[20px] leading-[20px]" aria-hidden="true">
          {label}
        </span>
      </span>
    </span>
  );
}

function InspectButton({
  disabled,
  isInspecting
}: {
  disabled: boolean;
  isInspecting: boolean;
}) {
  const label = isInspecting ? "Inspecting" : "Inspect file";

  return (
    <button
      className={cn(
        "group inline-flex items-center rounded-full bg-accent py-2 pl-5 pr-2 text-[13px] font-medium text-white transition-colors duration-300 hover:bg-[#e05a1a] sm:pl-6 sm:text-[14px]",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
      disabled={disabled}
      type="submit"
    >
      {isInspecting ? (
        <span className="mr-2 flex h-3 w-3 items-center justify-center rounded-full bg-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        </span>
      ) : null}
      <TextRoll label={label} />
      <span className="ml-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-accent transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45 sm:h-8 sm:w-8">
        <ArrowRight size={14} />
      </span>
    </button>
  );
}

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function formatFileSize(bytes: number) {
  if (bytes === 0) {
    return "0 bytes";
  }

  const units = ["bytes", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;
  const precision = unitIndex === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

function formatDuration(duration?: number) {
  if (duration === undefined || !Number.isFinite(duration)) {
    return "Unavailable";
  }

  const totalSeconds = Math.max(0, Math.round(duration));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatCapturedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(date)} UTC`;
}

function truncatePrompt(value: string) {
  return value.length > 140 ? `${value.slice(0, 137).trimEnd()}...` : value;
}

function extractVideoMetadata(file: File): Promise<Omit<VideoMetadata, "key" | "status">> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    let timeoutId: number | undefined;

    const finish = (metadata: Omit<VideoMetadata, "key" | "status">) => {
      if (settled) {
        return;
      }

      settled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(objectUrl);
      resolve(metadata);
    };

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      finish({
        duration: Number.isFinite(video.duration) ? video.duration : undefined,
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined
      });
    };
    video.onerror = () => finish({});
    timeoutId = window.setTimeout(() => finish({}), 10_000);
    video.src = objectUrl;
  });
}

function MetadataValue({
  isLoading,
  value
}: {
  isLoading: boolean;
  value: string;
}) {
  return <dd className="mt-1 text-[13px] text-ink">{isLoading ? "Reading..." : value}</dd>;
}

function FileSummary({
  file,
  isDragging,
  metadata,
  onChooseDifferent
}: {
  file: File;
  isDragging: boolean;
  metadata: VideoMetadata | null;
  onChooseDifferent: () => void;
}) {
  const isLoading = metadata?.status === "loading";
  const resolution =
    metadata?.width && metadata.height
      ? `${metadata.width} × ${metadata.height}`
      : "Unavailable";

  return (
    <div
      className={cn(
        "rounded-md border-2 border-dashed bg-white p-5 transition-colors duration-200 sm:p-6",
        isDragging ? "border-accent" : "border-ink-rule"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className="block h-8 w-8 rounded-full border-[1.5px] border-accent" />
          <p className="mt-4 break-all text-[16px] font-medium text-ink">{file.name}</p>
        </div>
        <button
          className="shrink-0 self-start text-[13px] text-ink-muted underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
          onClick={onChooseDifferent}
          type="button"
        >
          Choose a different file
        </button>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-ink-rule pt-5 sm:grid-cols-4">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Size
          </dt>
          <dd className="mt-1 text-[13px] text-ink">{formatFileSize(file.size)}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Type
          </dt>
          <dd className="mt-1 break-all text-[13px] text-ink">
            {file.type || "Unavailable"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Duration
          </dt>
          <MetadataValue
            isLoading={isLoading}
            value={formatDuration(metadata?.duration)}
          />
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Resolution
          </dt>
          <MetadataValue isLoading={isLoading} value={resolution} />
        </div>
      </dl>
    </div>
  );
}

function EventBlock({ event, index }: { event: EventRead; index: number }) {
  return (
    <article className="border-t border-ink-rule pt-5 first:border-t-0 first:pt-0">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
        Record {index + 1}
      </p>
      <dl className="grid grid-cols-[92px_1fr] gap-x-4 gap-y-3 text-[13px]">
        <dt className="font-medium text-ink-muted">Project</dt>
        <dd className="break-all font-mono text-[12px] text-ink">{event.project_id}</dd>

        <dt className="font-medium text-ink-muted">Tool + model</dt>
        <dd className="text-ink">
          <span className="font-mono text-[12px]">{event.tool_identifier}</span>
          <span className="mx-2 text-ink-muted">/</span>
          <span className="font-mono text-[12px]">{event.model_identifier}</span>
        </dd>

        <dt className="font-medium text-ink-muted">Prompt</dt>
        <dd className="leading-[1.55] text-ink">{truncatePrompt(event.prompt_text)}</dd>

        <dt className="font-medium text-ink-muted">Asset type</dt>
        <dd className="capitalize text-ink">{event.output_asset_type}</dd>

        <dt className="font-medium text-ink-muted">Captured</dt>
        <dd className="text-ink">{formatCapturedAt(event.occurred_at)}</dd>
      </dl>
    </article>
  );
}

function ResultPanel({
  isInspecting,
  result
}: {
  isInspecting: boolean;
  result: InspectHashResult | null;
}) {
  return (
    <section
      aria-live="polite"
      className="flex min-h-[42vh] flex-col rounded-md border border-ink-rule bg-white p-5 lg:sticky lg:top-6 lg:p-6"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
        RESULT
      </p>

      {isInspecting ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="h-8 w-8 rounded-full border-[1.5px] border-accent" />
          <p className="mt-6 text-base font-medium text-ink">Computing fingerprint...</p>
        </div>
      ) : !result ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="h-8 w-8 rounded-full border-[1.5px] border-accent" />
          <p className="mt-6 text-base font-medium text-ink">Drop a video to begin.</p>
          <p className="mt-2 max-w-[460px] text-[13px] leading-[1.55] text-ink-muted">
            We compute the file&apos;s fingerprint locally and look for a matching recorded asset.
            Your video never leaves this device.
          </p>
        </div>
      ) : !result.ok ? (
        <div className="mt-8">
          <span className="block h-12 w-12 rounded-full border-[1.5px] border-accent" />
          <h2 className="mt-6 text-[22px] font-medium leading-6 text-ink">
            Inspection could not run.
          </h2>
          <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-ink">
            {result.reason}
          </p>
        </div>
      ) : result.result.matched ? (
        <div className="mt-8">
          <span className="block h-12 w-12 rounded-full bg-accent" />
          <h2 className="mt-6 text-[22px] font-medium leading-6 text-ink">
            This video is a recorded asset.
          </h2>
          {result.result.events.length > 1 ? (
            <p className="mt-3 text-[14px] text-ink-muted">
              This fingerprint appears in {result.result.events.length} records.
            </p>
          ) : null}
          <div className="mt-6 space-y-5">
            {result.result.events.map((event, index) => (
              <EventBlock event={event} index={index} key={event.event_id} />
            ))}
          </div>
          <p className="mt-6 border-t border-ink-rule pt-6 text-[12px] text-ink-muted">
            A signed manifest can be generated and verified for this project.{" "}
            <Link
              className="text-ink underline underline-offset-4 transition-colors duration-200 hover:text-accent"
              href="/verify"
            >
              Verify a manifest
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <span className="block h-12 w-12 rounded-full bg-accentDeep" />
          <h2 className="mt-6 text-[22px] font-medium leading-6 text-ink">
            No recorded asset matches this file.
          </h2>
          <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-ink">
            Either this file was not produced through a LINEAGE-tracked workflow, or it was
            re-encoded, trimmed, or re-exported after it was captured. A fingerprint is exact: any
            change to the file bytes, even one that looks identical on screen, produces a different
            fingerprint.
          </p>
          <p className="mt-6 border-t border-ink-rule pt-6 text-[12px] text-ink-muted">
            This does not mean the file is untrustworthy. It means LINEAGE has no byte-exact record
            of this exact file.
          </p>
        </div>
      )}
    </section>
  );
}

export default function InspectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [showLargeFileNote, setShowLargeFileNote] = useState(false);
  const [result, setResult] = useState<InspectHashResult | null>(null);

  const canInspect = file !== null && !isInspecting;

  function openFilePicker() {
    const input = document.getElementById(FILE_INPUT_ID) as HTMLInputElement | null;
    if (input) {
      input.value = "";
      input.click();
    }
  }

  function selectFile(selectedFile: File) {
    const key = fileKey(selectedFile);
    setFile(selectedFile);
    setMetadata({ key, status: "loading" });
    setResult(null);
    setShowLargeFileNote(false);

    void extractVideoMetadata(selectedFile).then((details) => {
      setMetadata((current) =>
        current?.key === key ? { key, status: "ready", ...details } : current
      );
    });
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      selectFile(selectedFile);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const selectedFile = event.dataTransfer.files[0];
    if (selectedFile) {
      selectFile(selectedFile);
    }
  }

  function handleClear() {
    setFile(null);
    setMetadata(null);
    setResult(null);
    setShowLargeFileNote(false);

    const input = document.getElementById(FILE_INPUT_ID) as HTMLInputElement | null;
    if (input) {
      input.value = "";
    }
  }

  async function handleInspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || isInspecting) {
      return;
    }

    setIsInspecting(true);
    setResult(null);
    const isLargeFile = file.size > LARGE_FILE_BYTES;
    setShowLargeFileNote(isLargeFile);

    try {
      if (isLargeFile) {
        await new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => resolve());
        });
      }

      const buffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      const hashHex = [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      setResult(await inspectHash(hashHex));
    } catch (cause) {
      setResult({
        ok: false,
        reason:
          cause instanceof Error
            ? `Inspection service could not be reached: ${cause.message}.`
            : "Inspection service could not be reached."
      });
    } finally {
      setIsInspecting(false);
      setShowLargeFileNote(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-cream text-ink">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-70">
        <BackgroundOrnament />
      </div>

      <SiteHeader
        title="Inspect a video"
        subtitle="Check whether a finished file is a recorded asset, and what AI produced it."
      />

      <section className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:px-12 lg:pt-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-10">
          <section>
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                VIDEO FILE
              </p>
              <p className="text-right text-[12px] italic text-ink-muted">
                Hashed in your browser. Never uploaded.
              </p>
            </div>

            <form onSubmit={handleInspect}>
              <input
                accept="video/*"
                className="sr-only"
                id={FILE_INPUT_ID}
                onChange={handleFileInput}
                type="file"
              />

              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setIsDragging(false);
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDrop={handleDrop}
              >
                {file ? (
                  <FileSummary
                    file={file}
                    isDragging={isDragging}
                    metadata={metadata}
                    onChooseDifferent={openFilePicker}
                  />
                ) : (
                  <button
                    className={cn(
                      "flex min-h-[42vh] w-full flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed bg-white transition-colors duration-200 lg:min-h-[52vh]",
                      isDragging ? "border-accent" : "border-ink-rule"
                    )}
                    onClick={openFilePicker}
                    type="button"
                  >
                    <span className="h-8 w-8 rounded-full border-[1.5px] border-accent" />
                    <span className="text-[16px] font-medium text-ink">Drop a video here</span>
                    <span className="text-[13px] text-ink-muted">or click to choose a file</span>
                  </button>
                )}
              </div>

              <div className="mt-5 flex items-center gap-4">
                <InspectButton disabled={!canInspect} isInspecting={isInspecting} />
                {file ? (
                  <button
                    className="text-[13px] text-ink-muted transition-colors duration-200 hover:text-ink"
                    onClick={handleClear}
                    type="button"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              {showLargeFileNote ? (
                <p className="mt-3 text-[12px] italic text-ink-muted">
                  Large file — hashing in browser may take a moment
                </p>
              ) : null}
            </form>
          </section>

          <ResultPanel isInspecting={isInspecting} result={result} />
        </div>
      </section>
    </main>
  );
}
