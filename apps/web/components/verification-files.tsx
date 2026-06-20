"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import { inspectHash, type InspectHashResult } from "@/lib/api";
import { cn } from "@/lib/utils";

const FILE_INPUT_ID = "verify-workspace-file-input";
const LARGE_FILE_BYTES = 500 * 1024 * 1024;

type FileItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "hashing" | "ready" | "attention";
  hash?: string;
  matchedSubject?: boolean;
  lookup?: InspectHashResult;
  reason?: string;
};

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}:${crypto.randomUUID()}`;
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

function shortHash(value?: string) {
  if (!value) {
    return "pending";
  }
  return `${value.slice(0, 12)}...${value.slice(-10)}`;
}

async function sha256File(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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

function AddFilesButton({ disabled }: { disabled: boolean }) {
  return (
    <button
      className={cn(
        "group inline-flex items-center rounded-full bg-accent py-2 pl-5 pr-2 text-[13px] font-medium text-white transition-colors duration-300 hover:bg-[#e05a1a] sm:pl-6 sm:text-[14px]",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
      disabled={disabled}
      type="submit"
    >
      <TextRoll label="Add files" />
      <span className="ml-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-accent transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45 sm:h-8 sm:w-8">
        <ArrowRight size={14} />
      </span>
    </button>
  );
}

function statusCopy(item: FileItem) {
  if (item.status === "hashing") {
    return "Hashing locally";
  }
  if (item.status === "attention") {
    return "Needs follow-up";
  }
  return item.matchedSubject ? "Matched in this delivery" : "No subject match";
}

export function VerificationFiles({
  onAssetHashesChange,
  recordedHashes,
  subjectKey
}: {
  onAssetHashesChange: (hashes: string[]) => void;
  recordedHashes: string[];
  subjectKey: string;
}) {
  const [items, setItems] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showLargeFileNote, setShowLargeFileNote] = useState(false);
  const recordedHashSet = useMemo(
    () => new Set(recordedHashes.map((hash) => hash.toLowerCase())),
    [recordedHashes]
  );

  useEffect(() => {
    setItems([]);
    onAssetHashesChange([]);
  }, [onAssetHashesChange, subjectKey]);

  useEffect(() => {
    onAssetHashesChange(items.flatMap((item) => (item.hash ? [item.hash] : [])));
  }, [items, onAssetHashesChange]);

  function openFilePicker() {
    const input = document.getElementById(FILE_INPUT_ID) as HTMLInputElement | null;
    if (input) {
      input.value = "";
      input.click();
    }
  }

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) {
      return;
    }

    setShowLargeFileNote(files.some((file) => file.size > LARGE_FILE_BYTES));

    const pending = files.map((file) => ({
      id: fileKey(file),
      name: file.name,
      size: file.size,
      type: file.type || "Unavailable",
      status: "hashing" as const
    }));
    setItems((current) => [...pending, ...current]);

    await Promise.all(
      files.map(async (file, index) => {
        const id = pending[index]?.id;
        if (!id) {
          return;
        }

        try {
          const hash = await sha256File(file);
          const matchedSubject = recordedHashSet.has(hash.toLowerCase());
          const lookup = await inspectHash(hash);
          setItems((current) =>
            current.map((item) =>
              item.id === id
                ? {
                    ...item,
                    hash,
                    lookup,
                    matchedSubject,
                    status: matchedSubject ? "ready" : "attention"
                  }
                : item
            )
          );
        } catch (error) {
          setItems((current) =>
            current.map((item) =>
              item.id === id
                ? {
                    ...item,
                    reason:
                      error instanceof Error
                        ? `could not run - ${error.message}`
                        : "could not run - file could not be hashed",
                    status: "attention"
                  }
                : item
            )
          );
        }
      })
    );

    setShowLargeFileNote(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void addFiles(event.dataTransfer.files);
  }

  function clearFiles() {
    setItems([]);
    onAssetHashesChange([]);
  }

  return (
    <section
      className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8 lg:p-10"
      id="files"
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            Files
          </p>
          <h2 className="mt-2 text-[22px] font-medium leading-7 text-ink">Delivered media match</h2>
          <p className="mt-2 max-w-[680px] text-[13px] leading-[1.55] text-ink-muted">
            Files are hashed in this browser. The bytes never leave this device; only SHA-256
            fingerprints are sent to the lookup service and verifier.
          </p>
        </div>
        {items.length > 0 ? (
          <button
            className="self-start text-[13px] text-ink-muted transition-colors duration-200 hover:text-ink"
            onClick={clearFiles}
            type="button"
          >
            Clear files
          </button>
        ) : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          openFilePicker();
        }}
      >
        <input
          accept="audio/*,image/*,video/*"
          className="sr-only"
          id={FILE_INPUT_ID}
          multiple
          onChange={(event) => {
            if (event.target.files) {
              void addFiles(event.target.files);
            }
          }}
          type="file"
        />

        <div
          className={cn(
            "flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed bg-cream-soft p-6 text-center transition-colors duration-200",
            isDragging ? "border-accent" : "border-ink-rule"
          )}
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
          <span className="h-8 w-8 rounded-full border-[1.5px] border-accent" />
          <div>
            <p className="text-[16px] font-medium text-ink">Drop delivered media here</p>
            <p className="mt-1 text-[13px] text-ink-muted">or choose files to compare by hash</p>
          </div>
          <AddFilesButton disabled={false} />
        </div>
      </form>

      {showLargeFileNote ? (
        <p className="mt-3 text-[12px] italic text-ink-muted">
          Large file - hashing in browser may take a moment
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-6 divide-y divide-ink-rule border-y border-ink-rule">
          {items.map((item) => (
            <article className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-start" key={item.id}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "h-3 w-3 shrink-0 rounded-full",
                      item.status === "ready" ? "bg-accent" : "bg-accentDeep"
                    )}
                  />
                  <p className="break-all text-[14px] font-medium text-ink">{item.name}</p>
                </div>
                <p className="mt-2 text-[12px] text-ink-muted">
                  {formatFileSize(item.size)} · {item.type}
                </p>
                <p className="mt-2 break-all font-mono text-[12px] text-ink-muted">
                  {shortHash(item.hash)}
                </p>
                {item.status === "attention" && item.hash ? (
                  <p className="mt-3 max-w-[680px] text-[13px] leading-[1.55] text-ink">
                    No recorded asset matches this file in the loaded delivery. Either this file was
                    not produced through the recorded workflow, or it was re-encoded, trimmed, or
                    re-exported after capture. A fingerprint is exact: any byte change produces a
                    different fingerprint.
                  </p>
                ) : null}
                {item.reason ? (
                  <p className="mt-3 text-[13px] text-ink">{item.reason}</p>
                ) : null}
                {item.lookup?.ok && item.lookup.result.matched && !item.matchedSubject ? (
                  <p className="mt-3 text-[12px] text-ink-muted">
                    The lookup service found this hash in another LINEAGE record, but not in the
                    loaded delivery.
                  </p>
                ) : null}
              </div>
              <span className="inline-flex w-fit items-center rounded-full border border-ink-rule bg-cream-soft px-3 py-1 text-[12px] text-ink">
                {statusCopy(item)}
              </span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
