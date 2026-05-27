import { Download, FileJson, FileText, RefreshCcw, Search } from "lucide-react";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { downloadParams, fetchEvents, type AIEvent, type EventFilters } from "@/lib/api";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function filtersFromSearchParams(searchParams: PageProps["searchParams"]): EventFilters {
  return {
    project_id: firstParam(searchParams?.project_id) || "prj_week_zero",
    start_date: firstParam(searchParams?.start_date),
    end_date: firstParam(searchParams?.end_date),
    tool: firstParam(searchParams?.tool),
    asset: firstParam(searchParams?.asset),
    asset_type: firstParam(searchParams?.asset_type)
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value));
}

function shortHash(value: string | null) {
  if (!value) {
    return "missing";
  }
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function downloadHref(kind: "json" | "pdf", projectId: string) {
  const params = downloadParams(projectId);
  return kind === "json" ? `/api/manifest?${params}` : `/api/manifest/pdf?${params}`;
}

function DownloadLink({
  href,
  children,
  variant = "default"
}: {
  href: string;
  children: ReactNode;
  variant?: "default" | "secondary";
}) {
  return (
    <a
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        variant === "default"
          ? "bg-accent text-[#111] hover:bg-[#f08563]"
          : "bg-panel text-foreground shadow-line hover:bg-[#1f2630]"
      )}
      href={href}
    >
      {children}
    </a>
  );
}

function EventsTable({ events }: { events: AIEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="border-y border-border bg-panel px-5 py-12 text-center text-sm text-muted">
        No AI events found for the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border-y border-border">
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow className="bg-[#111821] hover:bg-[#111821]">
            <TableHead className="w-[170px]">Timestamp</TableHead>
            <TableHead className="w-[150px]">Tool</TableHead>
            <TableHead className="w-[150px]">Model</TableHead>
            <TableHead>Prompt</TableHead>
            <TableHead className="w-[220px]">Asset</TableHead>
            <TableHead className="w-[140px]">Operator</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.event_id}>
              <TableCell className="text-muted">{formatDate(event.occurred_at)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span>{event.tool_identifier}</span>
                  {event.tool_version ? (
                    <span className="text-xs text-muted">{event.tool_version}</span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{event.model_identifier}</TableCell>
              <TableCell>
                <p className="max-w-[460px] whitespace-normal break-words leading-5">
                  {event.prompt_text}
                </p>
                {event.parent_event_ids.length > 0 ? (
                  <p className="mt-2 text-xs text-muted">
                    Parents: {event.parent_event_ids.join(", ")}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge className="w-fit">{event.output_asset_type}</Badge>
                  <span className="break-all text-xs text-muted">{event.output_asset_url}</span>
                  <span className="font-mono text-xs text-muted">
                    {shortHash(event.output_asset_hash_value)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span>{event.operator_human_name ?? event.operator_user_id}</span>
                {event.operator_human_name ? (
                  <span className="block text-xs text-muted">{event.operator_user_id}</span>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const filters = filtersFromSearchParams(searchParams);
  const result = await fetchEvents(filters);
  const events = result.data.events;
  const projectId = result.data.project_id;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 lg:px-8">
        <SiteHeader
          title="AI Bill of Materials"
          subtitle="Project-scoped ledger of AI-generated media events and certification exports."
          actions={
            <>
            <DownloadLink href={downloadHref("json", projectId)} variant="secondary">
              <FileJson size={16} />
              JSON
            </DownloadLink>
            <DownloadLink href={downloadHref("pdf", projectId)}>
              <FileText size={16} />
              PDF
            </DownloadLink>
            </>
          }
        />

        <section className="border border-border bg-panel p-4 shadow-line">
          <form className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
            <label className="grid gap-1 text-xs text-muted">
              Project ID
              <Input name="project_id" defaultValue={filters.project_id} />
            </label>
            <label className="grid gap-1 text-xs text-muted">
              Start
              <Input
                name="start_date"
                placeholder="2026-05-20T00:00:00Z"
                defaultValue={filters.start_date}
              />
            </label>
            <label className="grid gap-1 text-xs text-muted">
              End
              <Input
                name="end_date"
                placeholder="2026-05-21T00:00:00Z"
                defaultValue={filters.end_date}
              />
            </label>
            <label className="grid gap-1 text-xs text-muted">
              Tool
              <Input name="tool" placeholder="runway-ml" defaultValue={filters.tool} />
            </label>
            <label className="grid gap-1 text-xs text-muted">
              Asset
              <Input name="asset" placeholder="asset URL contains..." defaultValue={filters.asset} />
            </label>
            <div className="flex gap-2">
              <Button type="submit">
                <Search size={16} />
                Filter
              </Button>
              <a
                className="inline-flex h-9 items-center justify-center rounded-md bg-transparent px-3 text-sm text-foreground hover:bg-[#1f2630]"
                href="/"
              >
                <RefreshCcw size={16} />
              </a>
            </div>
          </form>
          {!result.ok ? (
            <div className="mt-3 border border-[#5b2b22] bg-[#2a1713] px-3 py-2 text-sm text-[#ffb49d]">
              API unavailable: {result.error}
            </div>
          ) : null}
        </section>

        <section>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-normal">Events</h2>
              <p className="text-sm text-muted">
                {result.data.count} event{result.data.count === 1 ? "" : "s"} for {projectId}
              </p>
            </div>
            <Badge>{process.env.LINEAGE_API_URL ?? "http://localhost:8000"}</Badge>
          </div>
          <EventsTable events={events} />
        </section>
      </div>
    </main>
  );
}
