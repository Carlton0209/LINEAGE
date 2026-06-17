"use client";

import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { EXAMPLE_MANIFEST_JSON } from "@/lib/example-manifest";
import {
  verificationReportFromIssue,
  verifyManifest,
  type VerificationReport,
  type VerificationStage
} from "@/lib/api";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
  type = "button",
  size = "large"
}: {
  children: string;
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  size?: "large" | "medium";
}) {
  const label = isLoading ? "Verifying" : children;

  return (
    <button
      className={cn(
        "group inline-flex items-center rounded-full bg-accent text-white transition-colors duration-300 hover:bg-[#e05a1a]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "large"
          ? "py-2 pl-5 pr-2 text-[13px] font-medium sm:pl-6 sm:text-[14px]"
          : "py-2 pl-5 pr-2 text-[13px] font-medium"
      )}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {isLoading ? (
        <span className="mr-2 h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
      ) : null}
      <TextRoll label={label} />
      <span
        className={cn(
          "ml-3 flex items-center justify-center rounded-full bg-white text-accent transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45",
          size === "large" ? "h-7 w-7 sm:h-8 sm:w-8" : "h-7 w-7"
        )}
      >
        <ArrowRight size={14} />
      </span>
    </button>
  );
}

function StarburstIcon() {
  return (
    <svg
      className="h-5 w-5 fill-current text-accent sm:h-6 sm:w-6"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 1.5l2.1 6.1 6.4-2.1-3.5 5.7 5.5 3.8-6.7.6.6 6.9-4.4-5.2-4.4 5.2.6-6.9-6.7-.6 5.5-3.8-3.5-5.7 6.4 2.1L12 1.5z" />
    </svg>
  );
}

function TrustBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-[4px] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] sm:gap-3 sm:px-4 sm:py-2.5">
      <StarburstIcon />
      <span className="text-[13px] font-medium text-ink sm:text-[14px]">Ed25519 + C2PA 2.1</span>
      <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] text-white sm:px-2 sm:text-[11px]">
        Signed
      </span>
    </div>
  );
}

function projectLine(project: VerificationReport["project"]) {
  if (!project) {
    return "Project not identified";
  }

  return [project.title || project.id, project.productionCompany, project.deliveryTarget]
    .filter(Boolean)
    .join(" · ");
}

function overallDotClass(status: VerificationReport["overall"]["status"]) {
  return status === "verified" ? "bg-accent" : "bg-accentDeep";
}

function stageDotClass(stage: VerificationStage) {
  if (stage.status === "verified" || stage.status === "informational") {
    return "bg-accent";
  }
  return "bg-accentDeep";
}

function stageStatusWord(stage: VerificationStage) {
  if (stage.id === "structure" && stage.status === "failed") {
    return "Malformed";
  }
  if (stage.id === "integrity" && stage.status === "failed") {
    return "Tampered";
  }
  if (stage.id === "issuer") {
    return "Identified";
  }
  if (stage.id === "asset_match" && stage.status === "informational") {
    return "Skipped";
  }
  if (stage.status === "attention" || stage.status === "failed") {
    return "Attention";
  }
  if (stage.status === "informational") {
    return "Skipped";
  }
  return "Verified";
}

function StageRow({ stage }: { stage: VerificationStage }) {
  return (
    <div className="grid gap-3 border-b border-ink-rule py-5 last:border-b-0 sm:grid-cols-[170px_112px_1fr] sm:gap-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn("h-3 w-3 shrink-0 rounded-full", stageDotClass(stage))} />
        <p className="min-w-0 text-[14px] font-medium text-ink">{stage.name}</p>
      </div>
      <p className="text-[13px] font-medium text-ink">{stageStatusWord(stage)}</p>
      <div className="min-w-0">
        <p className="break-words text-[13px] leading-[1.55] text-ink-muted">{stage.detail}</p>
        {stage.findings.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {stage.findings.map((finding, index) => (
              <li
                className="grid grid-cols-1 gap-1 rounded-md bg-cream-soft px-3 py-2 text-[12px] leading-[1.45] sm:grid-cols-[minmax(120px,180px)_1fr] sm:gap-3"
                key={`${stage.id}-${finding.eventId}-${finding.message}-${index}`}
              >
                <span className="break-all font-mono text-[11px] text-ink">
                  {finding.eventId}
                </span>
                <span
                  className={cn(
                    "text-ink",
                    finding.level === "informational" ? "text-ink-muted" : null
                  )}
                >
                  {finding.message}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function ResultPanel({
  idlePulse,
  result
}: {
  idlePulse: boolean;
  result: VerificationReport | null;
}) {
  return (
    <section className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-20 sm:px-8 lg:px-12">
      <SectionEyebrow number="03" label="Result" />
      <div
        aria-live="polite"
        className="min-h-[280px] rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-opacity duration-300 sm:p-8 lg:p-10"
      >
        {!result ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center">
            <span
              className={cn(
                "h-8 w-8 rounded-full border-[1.5px] border-accent",
                idlePulse ? "motion-safe:animate-[pulse-once_600ms_ease-out]" : null
              )}
            />
            <p className="mt-6 text-base font-medium text-ink">Paste a manifest to begin.</p>
            <p className="mt-2 max-w-[460px] text-center text-[13px] text-ink-muted">
              The staged report will appear here. Verification runs against the public key embedded
              in the signature block.
            </p>
          </div>
        ) : (
          <div className="transition-opacity duration-300">
            <div className="grid grid-cols-1 gap-5 border-b border-ink-rule pb-6 sm:grid-cols-[auto_1fr] sm:gap-8">
              <span
                className={cn(
                  "block h-12 w-12 rounded-full",
                  overallDotClass(result.overall.status)
                )}
              />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                  Overall verdict
                </p>
                <h2 className="mt-2 text-[22px] font-medium leading-7 text-ink">
                  {result.overall.summary}
                </h2>
                <p className="mt-3 text-[14px] leading-[1.55] text-ink-muted">
                  {projectLine(result.project)}
                </p>
              </div>
            </div>

            <div className="py-4">
              {result.stages.map((stage) => (
                <StageRow key={stage.id} stage={stage} />
              ))}
            </div>

            <div className="border-t border-ink-rule pt-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                Disclosure summary
              </p>
              {result.disclosure.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.disclosure.map((item) => (
                    <span
                      className="inline-flex max-w-full items-center gap-2 rounded-full border border-ink-rule bg-cream-soft px-3 py-1.5 text-[12px] text-ink"
                      key={item.category}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          item.status === "verified" ? "bg-accent" : "bg-accentDeep"
                        )}
                      />
                      <span className="truncate">{item.category}</span>
                      <span className="text-ink-muted">
                        {item.status === "verified" ? "verified" : "attention"}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[13px] text-ink-muted">
                  No disclosure categories were identified in the manifest.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CheckList({
  items,
  muted = false
}: {
  items: string[];
  muted?: boolean;
}) {
  return (
    <ul>
      {items.map((item) => (
        <li
          className={cn(
            "mb-3 flex items-start gap-3 text-[14px] leading-[1.55] last:mb-0",
            muted ? "text-ink-muted" : "text-ink"
          )}
          key={item}
        >
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function VerifyPage() {
  const [manifestJson, setManifestJson] = useState("");
  const [result, setResult] = useState<VerificationReport | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [exampleLoaded, setExampleLoaded] = useState(false);
  const [idlePulse, setIdlePulse] = useState(false);

  useEffect(() => {
    setIdlePulse(true);
    const timeout = window.setTimeout(() => setIdlePulse(false), 650);

    return () => window.clearTimeout(timeout);
  }, []);

  const canVerify = manifestJson.trim().length > 0 && !isVerifying;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canVerify) {
      return;
    }

    setIsVerifying(true);
    try {
      setResult(await verifyManifest(manifestJson));
    } catch (error) {
      setResult(
        verificationReportFromIssue(
          "Verifier service could not be reached.",
          error instanceof Error
            ? `could not run - verifier service is unreachable: ${error.message}`
            : "could not run - verifier service is unreachable"
        )
      );
    } finally {
      setIsVerifying(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = Array.from(event.dataTransfer.files).find((candidate) =>
      candidate.name.toLowerCase().endsWith(".json")
    );
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setManifestJson(reader.result);
        setResult(null);
        setExampleLoaded(false);
      }
    };
    reader.readAsText(file);
  }

  function handleTryExample() {
    setManifestJson(EXAMPLE_MANIFEST_JSON);
    setResult(null);
    setExampleLoaded(true);
  }

  function handleClear() {
    setManifestJson("");
    setResult(null);
    setExampleLoaded(false);
  }

  function scrollToInput() {
    document.getElementById("verify-input")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-cream text-ink">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-70">
        <BackgroundOrnament />
      </div>

      <SiteHeader
        title="Verify a LINEAGE manifest"
        subtitle="Confirm what AI touched the work and that nothing has been altered."
      />

      <section className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-8 pt-10 sm:px-8 sm:pt-16 lg:px-12 lg:pt-24">
        <SectionEyebrow number="01" label="Independent verification" />
        <h1 className="font-heading text-[clamp(2rem,7vw,4.4rem)] font-medium leading-[1.05] text-ink sm:text-[clamp(2.5rem,5vw,4.4rem)]">
          Verify a LINEAGE manifest. <br className="hidden sm:block" />
          Confirm what AI touched the work, <br className="hidden sm:block" />
          and that <span className="text-accent">nothing has been altered.</span>
        </h1>
        <p className="mt-6 max-w-[640px] text-[15px] leading-[1.55] text-ink-muted sm:mt-8 sm:text-[17px]">
          Paste a signed manifest below. We check the signature against the public key embedded in
          the file. No account, no upload, no logging. Verification is stateless.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:mt-12 sm:flex-row sm:gap-5">
          <ArrowPillButton onClick={scrollToInput}>Verify manifest</ArrowPillButton>
          <TrustBadge />
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-12 sm:px-8 sm:pb-16 lg:px-12">
        <SectionEyebrow number="02" label="Paste your manifest" />
        <div
          className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8 lg:p-10"
          id="verify-input"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
            <form onSubmit={handleSubmit}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                  MANIFEST
                </p>
                <p className="text-xs italic text-ink-muted">Paste JSON or drop a .json file</p>
              </div>

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
                  className="min-h-[44vh] w-full resize-y rounded-md border border-ink-rule bg-cream-soft px-4 py-3 font-mono text-[13px] leading-[1.55] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted focus:border-accent focus:shadow-[0_0_0_3px_rgba(233,116,81,0.18)] lg:min-h-[52vh]"
                  onChange={(event) => {
                    setManifestJson(event.target.value);
                    setResult(null);
                    setExampleLoaded(false);
                  }}
                  placeholder="Paste a LINEAGE manifest here. The file looks like JSON with a top-level signature block."
                  spellCheck={false}
                  value={manifestJson}
                />
              </div>

              {exampleLoaded ? (
                <p className="mt-3 text-xs italic text-ink-muted">
                  This signed sample verifies and includes follow-up items.
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <ArrowPillButton disabled={!canVerify} isLoading={isVerifying} type="submit">
                  Verify manifest
                </ArrowPillButton>
                <button
                  className="text-[13px] text-ink-muted underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
                  onClick={handleTryExample}
                  type="button"
                >
                  Try a signed example
                </button>
                {manifestJson ? (
                  <button
                    className="text-[13px] text-ink-muted transition-colors duration-200 hover:text-ink"
                    onClick={handleClear}
                    type="button"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </form>

            <aside>
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                WHAT VERIFICATION CHECKS
              </p>
              <CheckList
                items={[
                  "Structure, integrity, issuer fingerprint, provenance, completeness, and asset match.",
                  "The signature was produced by the private key matching the public key in the manifest.",
                  "The derivation graph and disclosure categories are returned in one report."
                ]}
              />
              <div className="mt-6 border-t border-ink-rule pt-6">
                <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                  WHAT IT DOES NOT CHECK
                </p>
                <CheckList
                  muted
                  items={[
                    "Whether the issuing party is who they claim to be. Confirm the public key fingerprint with the issuer separately.",
                    "Whether each follow-up item has been cleared by the buyer or production team."
                  ]}
                />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <ResultPanel idlePulse={idlePulse} result={result} />
    </main>
  );
}
