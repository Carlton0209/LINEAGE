"use client";

import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import { SiteHeader } from "@/components/site-header";
import { EXAMPLE_MANIFEST_JSON } from "@/lib/example-manifest";
import { cn } from "@/lib/utils";
import { verifyManifest, type VerificationResult } from "@/lib/api";

export const dynamic = "force-dynamic";

const reasonCopy: Record<string, string> = {
  "manifest is missing signature block": "The manifest has no signature block.",
  "manifest digest does not match canonical unsigned payload":
    "The contents of the manifest do not match the digest recorded in the signature. Something has been altered after signing.",
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
      <dt className="text-[13px] font-medium text-muted">{label}</dt>
      <dd
        className={cn(
          "text-[13px] text-foreground",
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
    <section
      aria-live="polite"
      className="flex min-h-[42vh] flex-col rounded-md border border-border bg-panel p-5 lg:sticky lg:top-6 lg:min-h-[58vh] lg:self-start lg:p-6"
    >
      <p className="mb-5 text-xs font-medium uppercase tracking-[0.18em] text-muted">RESULT</p>

      {!result ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <span
            className={cn(
              "h-7 w-7 rounded-full border-[1.5px] border-accent bg-transparent",
              idlePulse ? "motion-safe:animate-[pulse-once_600ms_ease-out]" : null
            )}
          />
          <p className="mt-6 text-sm text-foreground">Paste a manifest to begin</p>
          <p className="mt-1 text-xs text-muted">
            Verification runs against the public key embedded in the signature block.
          </p>
        </div>
      ) : result.valid ? (
        <div className="flex flex-col items-start gap-5">
          <span className="h-7 w-7 rounded-full bg-accent" />
          <h2 className="font-heading text-lg font-medium text-foreground">
            This manifest verifies.
          </h2>
          <div className="w-full">
            <dl className="grid w-full grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-sm">
              <SummaryRow label="Manifest ID" value={result.manifestId} mono />
              <SummaryRow label="Project" value={result.projectId} />
              <SummaryRow label="Generated" value={formatGeneratedAt(result.generatedAt)} />
              <SummaryRow label="Events" value={result.eventCount} />
              <SummaryRow
                label="Key fingerprint"
                value={result.publicKeyFingerprint}
                mono
              />
              <SummaryRow label="Digest" value={result.digestAlgorithm} />
            </dl>
            <p className="mt-4 w-full border-t border-border pt-4 text-xs text-muted">
              The signature was checked against the public key inside the manifest. Sharing this
              fingerprint with the issuer is a second-channel way to confirm the key itself is
              genuine.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <span className="h-7 w-7 rounded-full bg-accentDeep" />
          <h2 className="font-heading text-lg font-medium text-foreground">
            This manifest cannot be verified.
          </h2>
          <p className="text-sm leading-relaxed text-foreground">
            {readableReason(result.reason)}
          </p>
          <p className="mt-4 w-full border-t border-border pt-4 text-xs text-muted">
            An unverified manifest is not necessarily malicious — it may have been edited by a tool
            that did not re-sign it. Ask the issuer for a fresh signed copy.
          </p>
        </div>
      )}
    </section>
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 lg:px-8">
        <SiteHeader
          title="Verify a manifest"
          subtitle="Confirm an AI bill of materials was produced by LINEAGE and has not been altered."
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr] lg:gap-7">
          <section>
            <form onSubmit={handleSubmit}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  MANIFEST
                </p>
                <p className="font-body text-xs italic text-muted">
                  Paste JSON or drop a .json file
                </p>
              </div>

              <div
                className={cn(
                  "rounded-md transition-[box-shadow] duration-200",
                  isDragging ? "ring-1 ring-accent shadow-[0_0_0_3px_rgba(233,116,81,0.18)]" : null
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
                  className="w-full min-h-[42vh] lg:min-h-[58vh] bg-panel border border-border rounded-md px-4 py-3 font-mono text-[13px] leading-[1.5] text-foreground placeholder:text-muted resize-y outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(233,116,81,0.18)] transition-[border-color,box-shadow] duration-200"
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
                <p className="mt-3 text-xs italic text-muted">
                  This example uses a placeholder signature so the result will be &apos;cannot be
                  verified.&apos; To see a passing verification, generate a manifest from the API:{" "}
                  <code className="font-mono">
                    curl -X POST http://localhost:8000/manifest/prj_demo_feature
                  </code>{" "}
                  and paste the output here.
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <button
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-accent text-[#111] text-sm font-medium hover:bg-[#f08563] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    disabled={!canVerify}
                    type="submit"
                  >
                    {isVerifying ? (
                      <>
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#111]" />
                        Verifying...
                      </>
                    ) : (
                      "Verify manifest"
                    )}
                  </button>
                  <button
                    className="text-[13px] text-muted underline-offset-4 transition-colors duration-200 hover:text-foreground hover:underline"
                    onClick={handleTryExample}
                    type="button"
                  >
                    Try an example
                  </button>
                </div>

                {manifestJson ? (
                  <button
                    className="text-[13px] text-muted transition-colors duration-200 hover:text-foreground"
                    onClick={handleClear}
                    type="button"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <ResultPanel idlePulse={idlePulse} result={result} />
        </div>
      </div>
    </main>
  );
}
