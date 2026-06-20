import type { VerificationReport, VerificationStage } from "@/lib/api";
import { cn } from "@/lib/utils";

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

export function VerificationReportPanel({ report }: { report: VerificationReport }) {
  return (
    <section aria-live="polite" className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8 lg:p-10">
      <div className="grid grid-cols-1 gap-5 border-b border-ink-rule pb-6 sm:grid-cols-[auto_1fr] sm:gap-8">
        <span className={cn("block h-12 w-12 rounded-full", overallDotClass(report.overall.status))} />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            Overall verdict
          </p>
          <h2 className="mt-2 text-[22px] font-medium leading-7 text-ink">
            {report.overall.summary}
          </h2>
          <p className="mt-3 text-[14px] leading-[1.55] text-ink-muted">
            {projectLine(report.project)}
          </p>
        </div>
      </div>

      <div className="py-4">
        {report.stages.map((stage) => (
          <StageRow key={stage.id} stage={stage} />
        ))}
      </div>

      <div className="border-t border-ink-rule pt-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
          Disclosure summary
        </p>
        {report.disclosure.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {report.disclosure.map((item) => (
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
    </section>
  );
}
