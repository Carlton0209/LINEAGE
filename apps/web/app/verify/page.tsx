"use client";

import { ArrowRight, FileJson, FileText, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent
} from "react";
import { SiteHeader } from "@/components/site-header";
import { VerificationFiles } from "@/components/verification-files";
import {
  filterRecords,
  RecordsSection,
  type RecordFilters,
  type WorkspaceEventRecord
} from "@/components/verification-records";
import { VerificationReportPanel } from "@/components/verification-report";
import { EXAMPLE_MANIFEST_JSON } from "@/lib/example-manifest";
import {
  downloadParams,
  fetchEventsFromRoute,
  isValidProjectId,
  manifestDownloadFilename,
  verificationReportFromIssue,
  verifyManifest,
  type AIEvent,
  type VerificationReport
} from "@/lib/api";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SeedProject = {
  id: string;
  title: string;
  productionCompany: string;
  deliveryTarget: string;
};

type ProjectSummary = SeedProject & {
  count: number;
  records: WorkspaceEventRecord[];
  issue?: string;
};

type LoadedSubject = {
  key: string;
  mode: "internal" | "external";
  projectId: string | null;
  title: string;
  productionCompany: string | null;
  deliveryTarget: string | null;
  manifestJson: string;
  manifest: Record<string, unknown> | null;
  report: VerificationReport;
  allRecords: WorkspaceEventRecord[];
  records: WorkspaceEventRecord[];
  sourceLabel: string;
};

const SEEDED_PROJECTS: SeedProject[] = [
  {
    id: "prj_demo_feature",
    title: "Harbor Glass",
    productionCompany: "Northlight Pictures",
    deliveryTarget: "streamer_orig_v3"
  },
  {
    id: "prj_demo_ad_spot",
    title: "Luma Bottle Launch",
    productionCompany: "Northlight Pictures",
    deliveryTarget: "brand_social_2026"
  },
  {
    id: "prj_demo_doc",
    title: "Signal Room",
    productionCompany: "Northlight Pictures",
    deliveryTarget: "documentary_delivery_v2"
  }
];

function BackgroundOrnament() {
  return <div className="background-ornament" />;
}

function SectionEyebrow({ number, label }: { number: string; label: string }) {
  return (
    <div className="mb-6 flex items-center gap-3 sm:mb-8">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white sm:h-7 sm:w-7 sm:text-[12px]">
        {number}
      </span>
      <span className="rounded-full border border-ink-rule px-3 py-1 text-xs font-medium text-ink sm:px-4 sm:py-1.5">
        {label}
      </span>
    </div>
  );
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

function ArrowPillButton({
  children,
  disabled = false,
  isLoading = false,
  onClick,
  type = "button"
}: {
  children: string;
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const label = isLoading ? "Loading" : children;

  return (
    <button
      className={cn(
        "group inline-flex items-center rounded-full bg-accent py-2 pl-5 pr-2 text-[13px] font-medium text-white transition-colors duration-300 hover:bg-[#e05a1a] sm:pl-6 sm:text-[14px]",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {isLoading ? <span className="mr-2 h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> : null}
      <TextRoll label={label} />
      <span className="ml-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-accent transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45 sm:h-8 sm:w-8">
        <ArrowRight size={14} />
      </span>
    </button>
  );
}

function overallDotClass(status: VerificationReport["overall"]["status"]) {
  return status === "verified" ? "bg-accent" : "bg-accentDeep";
}

function eventToRecord(event: AIEvent): WorkspaceEventRecord {
  return {
    eventId: event.event_id,
    projectId: event.project_id,
    occurredAt: event.occurred_at,
    toolIdentifier: event.tool_identifier,
    toolVersion: event.tool_version,
    modelIdentifier: event.model_identifier,
    promptText: event.prompt_text,
    outputAssetUrl: event.output_asset_url,
    outputAssetHashValue: event.output_asset_hash_value,
    outputAssetType: event.output_asset_type,
    operatorUserId: event.operator_user_id,
    operatorHumanName: event.operator_human_name,
    parentEventIds: event.parent_event_ids
  };
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.flatMap((item) => (typeof item === "string" ? [item] : []))
    : [];
}

function parseManifest(rawJson: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(rawJson);
    return objectValue(parsed);
  } catch {
    return null;
  }
}

function projectFromManifest(manifest: Record<string, unknown> | null) {
  const project = objectValue(manifest?.project);
  return {
    id: stringValue(project?.id),
    title: stringValue(project?.title) ?? stringValue(project?.name),
    productionCompany: stringValue(project?.productionCompany),
    deliveryTarget: stringValue(project?.deliveryTarget)
  };
}

function recordsFromManifest(manifest: Record<string, unknown> | null): WorkspaceEventRecord[] {
  const events = Array.isArray(manifest?.events) ? manifest.events : [];
  const project = projectFromManifest(manifest);
  const generatedAt = stringValue(manifest?.generatedAt) ?? new Date(0).toISOString();

  return events.flatMap((rawEvent, index) => {
    const event = objectValue(rawEvent);
    if (!event) {
      return [];
    }

    const tool = objectValue(event.tool);
    const model = objectValue(event.model);
    const input = objectValue(event.input);
    const output = objectValue(event.output);
    const assetHash = objectValue(output?.assetHash);
    const operator = objectValue(event.operator);
    const provenance = objectValue(event.provenance);
    const eventId = stringValue(event.eventId) ?? `event_${index + 1}`;

    return [
      {
        eventId,
        projectId: stringValue(event.projectId) ?? project.id ?? "external_manifest",
        occurredAt: stringValue(event.timestamp) ?? generatedAt,
        toolIdentifier: stringValue(tool?.identifier) ?? "unknown-tool",
        toolVersion: stringValue(tool?.version),
        modelIdentifier: stringValue(model?.identifier) ?? "unknown-model",
        promptText: stringValue(input?.promptText) ?? "",
        outputAssetUrl: stringValue(output?.assetUrl) ?? "",
        outputAssetHashValue: stringValue(assetHash?.value),
        outputAssetType: stringValue(event.assetType) ?? stringValue(output?.assetType) ?? "asset",
        operatorUserId: stringValue(operator?.userId) ?? "unknown",
        operatorHumanName: stringValue(operator?.humanName),
        parentEventIds: stringArray(provenance?.parentEventIds)
      }
    ];
  });
}

function projectIdentity(subject: LoadedSubject) {
  return [subject.title, subject.productionCompany, subject.deliveryTarget].filter(Boolean).join(" · ");
}

function recordedHashes(records: WorkspaceEventRecord[]) {
  return records.flatMap((record) =>
    record.outputAssetHashValue ? [record.outputAssetHashValue.toLowerCase()] : []
  );
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapePdfText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "-")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function externalManifestPdf(subject: LoadedSubject) {
  const lines = [
    "LINEAGE signed manifest",
    projectIdentity(subject),
    `Mode: ${subject.mode}`,
    `Events: ${subject.allRecords.length}`,
    "The signed JSON manifest remains the source of record."
  ].filter(Boolean);
  const text = lines
    .map((line, index) => `BT /F1 12 Tf 72 ${730 - index * 22} Td (${escapePdfText(line)}) Tj ET`)
    .join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${text.length} >> stream\n${text}\nendstream endobj`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function ExportActions({ subject }: { subject: LoadedSubject }) {
  if (subject.mode === "internal" && subject.projectId) {
    const params = downloadParams(subject.projectId);
    return (
      <div className="flex flex-wrap gap-2">
        <a
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-cream-soft px-3 text-sm font-medium text-ink transition-colors hover:bg-[#f2e5da]"
          href={`/api/manifest?${params}`}
        >
          <FileJson size={16} />
          Manifest JSON
        </a>
        <a
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-[#e05a1a]"
          href={`/api/manifest/pdf?${params}`}
        >
          <FileText size={16} />
          Manifest PDF
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-cream-soft px-3 text-sm font-medium text-ink transition-colors hover:bg-[#f2e5da]"
        onClick={() =>
          downloadBlob(
            manifestDownloadFilename(subject.projectId ?? "external-manifest", "json"),
            new Blob([subject.manifestJson], { type: "application/json" })
          )
        }
        type="button"
      >
        <FileJson size={16} />
        Manifest JSON
      </button>
      <button
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-[#e05a1a]"
        onClick={() =>
          downloadBlob(
            manifestDownloadFilename(subject.projectId ?? "external-manifest", "pdf"),
            externalManifestPdf(subject)
          )
        }
        type="button"
      >
        <FileText size={16} />
        Manifest PDF
      </button>
    </div>
  );
}

function ProjectPicker({
  isLoading,
  onSelectProject,
  projects
}: {
  isLoading: boolean;
  onSelectProject: (projectId: string) => void;
  projects: ProjectSummary[];
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
        Pick a project
      </p>
      <div className="mt-5 grid gap-3">
        {projects.map((project) => (
          <button
            className="grid gap-3 rounded-md border border-ink-rule bg-cream-soft p-4 text-left transition-colors hover:border-accent sm:grid-cols-[1fr_auto] sm:items-center"
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            type="button"
          >
            <span>
              <span className="block text-[15px] font-medium text-ink">{project.title}</span>
              <span className="mt-1 block break-all font-mono text-[12px] text-ink-muted">
                {project.id}
              </span>
              <span className="mt-1 block text-[12px] text-ink-muted">
                {project.productionCompany} · {project.deliveryTarget}
              </span>
              {project.issue ? (
                <span className="mt-2 block text-[12px] text-ink">Records could not refresh.</span>
              ) : null}
            </span>
            <span className="inline-flex w-fit items-center rounded-full border border-ink-rule bg-white px-3 py-1 text-[12px] text-ink">
              {isLoading ? "Loading" : `${project.count} event${project.count === 1 ? "" : "s"}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RecentActivity({ records }: { records: WorkspaceEventRecord[] }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
        Recent activity
      </p>
      {records.length ? (
        <div className="mt-5 divide-y divide-ink-rule border-y border-ink-rule">
          {records.slice(0, 6).map((record) => (
            <article className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-start" key={record.eventId}>
              <div className="min-w-0">
                <p className="break-words text-[14px] font-medium text-ink">
                  {record.toolIdentifier} · {record.outputAssetType}
                </p>
                <p className="mt-1 break-all font-mono text-[12px] text-ink-muted">
                  {record.projectId} / {record.eventId}
                </p>
              </div>
              <p className="text-[12px] text-ink-muted">
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeZone: "UTC"
                }).format(new Date(record.occurredAt))}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-[13px] text-ink-muted">
          Recent seeded events will appear here when the ledger API is reachable.
        </p>
      )}
    </section>
  );
}

function ManifestLoader({
  isLoading,
  manifestJson,
  onDropManifest,
  onLoadExample,
  onManifestInput,
  onSubmit
}: {
  isLoading: boolean;
  manifestJson: string;
  onDropManifest: (file: File) => void;
  onLoadExample: () => void;
  onManifestInput: (value: string) => void;
  onSubmit: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const canLoad = manifestJson.trim().length > 0 && !isLoading;

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onDropManifest(file);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = Array.from(event.dataTransfer.files).find((candidate) =>
      candidate.name.toLowerCase().endsWith(".json")
    );
    if (file) {
      onDropManifest(file);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
        Paste or upload a manifest
      </p>
      <form
        className="mt-5"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div
          className={cn(
            "rounded-md transition-[box-shadow] duration-200",
            isDragging ? "ring-2 ring-accent ring-offset-2 ring-offset-white" : null
          )}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDrop={handleDrop}
        >
          <textarea
            className="min-h-[280px] w-full resize-y rounded-md border border-ink-rule bg-cream-soft px-4 py-3 font-mono text-[13px] leading-[1.55] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted focus:border-accent focus:shadow-[0_0_0_3px_rgba(233,116,81,0.18)]"
            onChange={(event) => onManifestInput(event.target.value)}
            placeholder="Paste a LINEAGE signed manifest JSON here."
            spellCheck={false}
            value={manifestJson}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <ArrowPillButton disabled={!canLoad} isLoading={isLoading} type="submit">
            Load manifest
          </ArrowPillButton>
          <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline">
            <Upload size={15} />
            Upload JSON
            <input accept="application/json,.json" className="sr-only" onChange={handleFileInput} type="file" />
          </label>
          <button
            className="text-[13px] text-ink-muted underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
            onClick={onLoadExample}
            type="button"
          >
            Try a signed example
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VerifyPage() {
  const router = useRouter();
  const [projectSummaries, setProjectSummaries] = useState<ProjectSummary[]>(
    SEEDED_PROJECTS.map((project) => ({ ...project, count: 0, records: [] }))
  );
  const [recentRecords, setRecentRecords] = useState<WorkspaceEventRecord[]>([]);
  const [manifestJson, setManifestJson] = useState("");
  const [subject, setSubject] = useState<LoadedSubject | null>(null);
  const [isLoadingSubject, setIsLoadingSubject] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [loadIssue, setLoadIssue] = useState<string | null>(null);
  const [recordFilters, setRecordFilters] = useState<RecordFilters>({});
  const [recordsIssue, setRecordsIssue] = useState<string | null>(null);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [assetHashes, setAssetHashes] = useState<string[]>([]);
  const [isRefreshingAssetReport, setIsRefreshingAssetReport] = useState(false);
  const didHandleInitialUrl = useRef(false);
  const shouldScrollFiles = useRef(false);

  const activeManifestJson = subject?.manifestJson;
  const activeSubjectKey = subject?.key;
  const activeHashKey = assetHashes.join("|");

  const handleAssetHashesChange = useCallback((hashes: string[]) => {
    setAssetHashes((current) => (current.join("|") === hashes.join("|") ? current : hashes));
  }, []);

  const loadProjectSummaries = useCallback(async () => {
    setIsLoadingProjects(true);
    const summaries = await Promise.all(
      SEEDED_PROJECTS.map(async (project) => {
        const result = await fetchEventsFromRoute({ project_id: project.id });
        const records = result.data.events.map(eventToRecord);
        return {
          ...project,
          count: result.data.count,
          records,
          issue: result.ok ? undefined : result.error
        };
      })
    );
    setProjectSummaries(summaries);
    setRecentRecords(
      summaries
        .flatMap((project) => project.records)
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    );
    setIsLoadingProjects(false);
  }, []);

  const loadExternalManifest = useCallback(
    async (rawJson: string, sourceLabel = "loaded manifest") => {
      if (!rawJson.trim()) {
        return;
      }

      setIsLoadingSubject(true);
      setLoadIssue(null);
      setRecordFilters({});
      setRecordsIssue(null);
      setAssetHashes([]);
      const report = await verifyManifest(rawJson);
      const manifest = parseManifest(rawJson);
      const project = projectFromManifest(manifest);
      const allRecords = recordsFromManifest(manifest);
      const title = project.title ?? project.id ?? "Loaded manifest";

      setSubject({
        key: `external:${project.id ?? "manifest"}:${Date.now()}`,
        mode: "external",
        projectId: project.id,
        title,
        productionCompany: project.productionCompany,
        deliveryTarget: project.deliveryTarget,
        manifestJson: rawJson,
        manifest,
        report,
        allRecords,
        records: allRecords,
        sourceLabel
      });
      router.replace("/verify", { scroll: false });
      setIsLoadingSubject(false);
    },
    [router]
  );

  const loadProject = useCallback(
    async (projectId: string) => {
      if (!isValidProjectId(projectId)) {
        setLoadIssue("Project id could not be loaded.");
        return;
      }

      setIsLoadingSubject(true);
      setLoadIssue(null);
      setRecordFilters({});
      setRecordsIssue(null);
      setAssetHashes([]);

      try {
        const manifestResponse = await fetch(`/api/manifest?${downloadParams(projectId)}`, {
          cache: "no-store"
        });
        if (!manifestResponse.ok) {
          throw new Error(`manifest service returned ${manifestResponse.status}`);
        }

        const rawJson = await manifestResponse.text();
        const manifest = parseManifest(rawJson);
        const report = await verifyManifest(rawJson);
        const eventResult = await fetchEventsFromRoute({ project_id: projectId });
        const fallbackRecords = recordsFromManifest(manifest);
        const records = eventResult.ok ? eventResult.data.events.map(eventToRecord) : fallbackRecords;
        const project = projectFromManifest(manifest);
        const seed = SEEDED_PROJECTS.find((candidate) => candidate.id === projectId);

        setSubject({
          key: `internal:${projectId}:${Date.now()}`,
          mode: "internal",
          projectId,
          title: project.title ?? seed?.title ?? projectId,
          productionCompany: project.productionCompany ?? seed?.productionCompany ?? null,
          deliveryTarget: project.deliveryTarget ?? seed?.deliveryTarget ?? null,
          manifestJson: rawJson,
          manifest,
          report,
          allRecords: records,
          records,
          sourceLabel: `ledger project ${projectId}`
        });
        setRecordsIssue(eventResult.ok ? null : eventResult.error);
        router.replace(`/verify?project=${encodeURIComponent(projectId)}`, { scroll: false });
      } catch (error) {
        setLoadIssue(
          error instanceof Error
            ? `Delivery could not load: ${error.message}.`
            : "Delivery could not load."
        );
      } finally {
        setIsLoadingSubject(false);
      }
    },
    [router]
  );

  useEffect(() => {
    void loadProjectSummaries();
  }, [loadProjectSummaries]);

  useEffect(() => {
    if (didHandleInitialUrl.current) {
      return;
    }
    didHandleInitialUrl.current = true;

    const params = new URLSearchParams(window.location.search);
    shouldScrollFiles.current = params.get("mode") === "files";
    const projectId = params.get("project")?.trim();
    if (projectId) {
      void loadProject(projectId);
    }
  }, [loadProject]);

  useEffect(() => {
    if (subject && shouldScrollFiles.current) {
      shouldScrollFiles.current = false;
      window.setTimeout(() => {
        document.getElementById("files")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 250);
    }
  }, [subject]);

  useEffect(() => {
    if (!activeManifestJson || !activeSubjectKey) {
      return;
    }

    let cancelled = false;
    const manifestJsonForRefresh = activeManifestJson;
    const subjectKeyForRefresh = activeSubjectKey;
    async function refreshAssetStage() {
      setIsRefreshingAssetReport(true);
      try {
        const nextReport = await verifyManifest(manifestJsonForRefresh, assetHashes);
        if (!cancelled) {
          setSubject((current) =>
            current?.key === subjectKeyForRefresh ? { ...current, report: nextReport } : current
          );
        }
      } finally {
        if (!cancelled) {
          setIsRefreshingAssetReport(false);
        }
      }
    }

    void refreshAssetStage();
    return () => {
      cancelled = true;
    };
  }, [activeHashKey, activeManifestJson, activeSubjectKey, assetHashes]);

  async function handleManifestFile(file: File) {
    const text = await file.text();
    setManifestJson(text);
    await loadExternalManifest(text, file.name);
  }

  async function applyRecordFilters(filters: RecordFilters) {
    setRecordFilters(filters);
    if (!subject) {
      return;
    }

    if (subject.mode === "external") {
      setSubject((current) =>
        current ? { ...current, records: filterRecords(current.allRecords, filters) } : current
      );
      return;
    }

    if (!subject.projectId) {
      return;
    }

    setIsLoadingRecords(true);
    const result = await fetchEventsFromRoute({ project_id: subject.projectId, ...filters });
    if (result.ok) {
      const records = result.data.events.map(eventToRecord);
      setSubject((current) => (current ? { ...current, records } : current));
      setRecordsIssue(null);
    } else {
      setRecordsIssue(result.error);
    }
    setIsLoadingRecords(false);
  }

  function resetRecordFilters() {
    setRecordFilters({});
    if (!subject) {
      return;
    }
    if (subject.mode === "external") {
      setSubject((current) => (current ? { ...current, records: current.allRecords } : current));
      return;
    }
    void applyRecordFilters({});
  }

  function resetSubject() {
    setSubject(null);
    setManifestJson("");
    setLoadIssue(null);
    setRecordFilters({});
    setRecordsIssue(null);
    setAssetHashes([]);
    router.replace("/verify", { scroll: false });
  }

  const subjectHashes = useMemo(() => recordedHashes(subject?.allRecords ?? []), [subject?.allRecords]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-cream text-ink">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-70">
        <BackgroundOrnament />
      </div>

      <SiteHeader
        title="Verify a LINEAGE delivery"
        subtitle="Load a project, signed manifest, and delivered files into one verification workspace."
      />

      {!subject ? (
        <>
          <section className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-8 pt-10 sm:px-8 sm:pt-16 lg:px-12 lg:pt-24">
            <SectionEyebrow number="01" label="Load a delivery to verify" />
            <h1 className="font-heading text-[clamp(2rem,7vw,4.4rem)] font-medium leading-[1.05] text-ink sm:text-[clamp(2.5rem,5vw,4.4rem)]">
              One workspace for a project&apos;s <br className="hidden sm:block" />
              chain of trust.
            </h1>
            <p className="mt-6 max-w-[680px] text-[15px] leading-[1.55] text-ink-muted sm:mt-8 sm:text-[17px]">
              Pick a ledger project, paste a signed manifest, or upload the manifest JSON. The
              staged verification report stays at the center; records and delivered files support
              the same delivery view.
            </p>
            {loadIssue ? (
              <p className="mt-5 max-w-[680px] rounded-md border border-ink-rule bg-white px-4 py-3 text-[13px] text-ink">
                {loadIssue}
              </p>
            ) : null}
          </section>

          <section className="relative z-10 mx-auto grid w-full max-w-[1440px] gap-6 px-5 pb-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
            <ProjectPicker
              isLoading={isLoadingProjects || isLoadingSubject}
              onSelectProject={(projectId) => void loadProject(projectId)}
              projects={projectSummaries}
            />
            <ManifestLoader
              isLoading={isLoadingSubject}
              manifestJson={manifestJson}
              onDropManifest={(file) => void handleManifestFile(file)}
              onLoadExample={() => {
                setManifestJson(EXAMPLE_MANIFEST_JSON);
                void loadExternalManifest(EXAMPLE_MANIFEST_JSON, "signed example manifest");
              }}
              onManifestInput={setManifestJson}
              onSubmit={() => void loadExternalManifest(manifestJson)}
            />
          </section>

          <section className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-20 sm:px-8 lg:px-12">
            <RecentActivity records={recentRecords} />
          </section>
        </>
      ) : (
        <section className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
          <header className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="min-w-0">
                <button
                  className="mb-5 text-[13px] text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                  onClick={resetSubject}
                  type="button"
                >
                  Load a different delivery
                </button>
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      "mt-1 block h-5 w-5 shrink-0 rounded-full",
                      overallDotClass(subject.report.overall.status)
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                      {subject.mode === "internal" ? "Ledger delivery" : "External manifest"}
                    </p>
                    <h1 className="mt-2 break-words text-[30px] font-medium leading-[1.08] text-ink sm:text-[42px]">
                      {subject.title}
                    </h1>
                    <p className="mt-3 text-[14px] leading-[1.55] text-ink-muted">
                      {projectIdentity(subject)}
                    </p>
                    <p className="mt-4 max-w-[720px] text-[15px] leading-[1.55] text-ink">
                      {subject.report.overall.summary}
                    </p>
                    {isRefreshingAssetReport ? (
                      <p className="mt-3 text-[12px] italic text-ink-muted">
                        Refreshing asset match stage
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
              <ExportActions subject={subject} />
            </div>
          </header>

          <VerificationReportPanel report={subject.report} />

          <RecordsSection
            allRecords={subject.records}
            error={recordsIssue}
            filters={recordFilters}
            isLoading={isLoadingRecords}
            onApplyFilters={(filters) => void applyRecordFilters(filters)}
            onResetFilters={resetRecordFilters}
            sourceLabel={subject.sourceLabel}
          />

          <VerificationFiles
            onAssetHashesChange={handleAssetHashesChange}
            recordedHashes={subjectHashes}
            subjectKey={subject.key}
          />
        </section>
      )}
    </main>
  );
}
