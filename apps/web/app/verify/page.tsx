"use client";

import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { EXAMPLE_MANIFEST_JSON } from "@/lib/example-manifest";
import { verifyManifest, type VerificationResult } from "@/lib/api";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const reasonCopy: Record<string, string> = {
  "manifest is missing signature block": "The manifest has no signature block.",
  "manifest digest does not match canonical unsigned payload":
    "The manifest content does not match the digest recorded in the signature.",
  "signature publicKey must be an Ed25519 OKP JWK":
    "The public key is not in the expected Ed25519 format.",
  "signature block is missing public key or signature value": "The signature block is incomplete."
};

function formatGeneratedAt(value: string) {
  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value))} UTC`;
}

function readableReason(reason: string) {
  return reasonCopy[reason] ?? reason;
}

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
      {isLoading ? <span className="mr-2 h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> : null}
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
    <svg className="h-5 w-5 fill-current text-accent sm:h-6 sm:w-6" viewBox="0 0 24 24" aria-hidden="true">
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

function SummaryRow({
  label,
  value,
  mono = false
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <>
      <dt className="text-[13px] font-medium text-ink-muted">{label}</dt>
      <dd
        className={cn(
          "text-[13px] text-ink",
          mono ? "break-all font-mono text-[12px]" : null
        )}
      >
        {value}
      </dd>
    </>
  );
}

function ResultPanel({
  idlePulse,
  result
}: {
  idlePulse: boolean;
  result: VerificationResult | null;
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
              The result will appear here. Verification runs against the public key embedded in the
              signature block.
            </p>
          </div>
        ) : result.valid ? (
          <div className="grid grid-cols-1 items-start gap-6 transition-opacity duration-300 sm:grid-cols-[auto_1fr] sm:gap-10">
            <div>
              <span className="block h-12 w-12 rounded-full bg-accent" />
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-cream-soft px-3 py-1 text-[11px] font-medium text-ink">
                Signed
              </span>
            </div>
            <div>
              <h2 className="text-[22px] font-medium leading-6 text-ink">This manifest verifies.</h2>
              <dl className="mt-5 grid grid-cols-[150px_1fr] gap-x-4 gap-y-3 text-[13px]">
                <SummaryRow label="Manifest ID" value={result.manifestId} mono />
                <SummaryRow label="Project" value={result.projectId} />
                <SummaryRow label="Generated" value={formatGeneratedAt(result.generatedAt)} />
                <SummaryRow label="Events" value={result.eventCount} />
                <SummaryRow label="Key fingerprint" value={result.publicKeyFingerprint} mono />
                <SummaryRow label="Digest" value={result.digestAlgorithm} />
              </dl>
              <p className="mt-6 border-t border-ink-rule pt-6 text-[12px] text-ink-muted">
                The signature was checked against the public key inside the manifest. Confirm the
                fingerprint with the issuer through a second channel to validate the key itself.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 transition-opacity duration-300 sm:grid-cols-[auto_1fr] sm:gap-10">
            <span className="block h-12 w-12 rounded-full bg-accentDeep" />
            <div>
              <h2 className="text-[22px] font-medium leading-6 text-ink">
                This manifest cannot be verified.
              </h2>
              <p className="mt-4 max-w-[640px] text-[15px] leading-[1.55] text-ink">
                {readableReason(result.reason)}
              </p>
              <p className="mt-6 border-t border-ink-rule pt-6 text-[12px] text-ink-muted">
                An unverified manifest may still be authentic — it could have been edited by a tool
                that did not re-sign it. Ask the issuer for a fresh signed copy.
              </p>
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
  const [result, setResult] = useState<VerificationResult | null>(null);
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
      setResult({
        valid: false,
        reason:
          error instanceof Error
            ? `Verifier service is unreachable: ${error.message}.`
            : "Verifier service is unreachable."
      });
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
        <h1 className="font-heading text-[clamp(2rem,7vw,4.4rem)] font-medium leading-[1.05] tracking-[-0.03em] text-ink sm:text-[clamp(2.5rem,5vw,4.4rem)]">
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
                  This example uses a placeholder signature so the result will be
                  &apos;cannot be verified.&apos; To see a passing verification, generate a manifest
                  from the API:{" "}
                  <code className="font-mono">
                    curl -X POST http://localhost:8000/manifest/prj_demo_feature
                  </code>{" "}
                  and paste the output here.
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
                  Try an example
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
                  "The signature was produced by the private key matching the public key in the manifest.",
                  "The manifest content has not changed since signing.",
                  "The signature uses Ed25519 with C2PA 2.1-compatible encoding."
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
                    "Whether the AI usage itself was permitted by relevant contracts. That is a human judgment."
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
