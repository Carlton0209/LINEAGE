"use client";

import { RefreshCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
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

export type WorkspaceEventRecord = {
  eventId: string;
  projectId: string;
  occurredAt: string;
  toolIdentifier: string;
  toolVersion: string | null;
  modelIdentifier: string;
  promptText: string;
  outputAssetUrl: string;
  outputAssetHashValue: string | null;
  outputAssetType: string;
  operatorUserId: string;
  operatorHumanName: string | null;
  parentEventIds: string[];
};

export type RecordFilters = {
  start_date?: string;
  end_date?: string;
  tool?: string;
  asset?: string;
  asset_type?: string;
};

function formatDate(value: string) {
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

function shortHash(value: string | null) {
  if (!value) {
    return "missing";
  }
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function normalize(value?: string) {
  return value?.trim() || undefined;
}

export function filterRecords(records: WorkspaceEventRecord[], filters: RecordFilters) {
  const startTime = filters.start_date ? new Date(filters.start_date).getTime() : Number.NaN;
  const endTime = filters.end_date ? new Date(filters.end_date).getTime() : Number.NaN;
  const tool = normalize(filters.tool)?.toLowerCase();
  const asset = normalize(filters.asset)?.toLowerCase();
  const assetType = normalize(filters.asset_type)?.toLowerCase();

  return records.filter((record) => {
    const occurredAt = new Date(record.occurredAt).getTime();
    if (Number.isFinite(startTime) && occurredAt < startTime) {
      return false;
    }
    if (Number.isFinite(endTime) && occurredAt > endTime) {
      return false;
    }
    if (tool && record.toolIdentifier.toLowerCase() !== tool) {
      return false;
    }
    if (asset && !record.outputAssetUrl.toLowerCase().includes(asset)) {
      return false;
    }
    if (assetType && record.outputAssetType.toLowerCase() !== assetType) {
      return false;
    }
    return true;
  });
}

function ProvenanceChains({ records }: { records: WorkspaceEventRecord[] }) {
  const recordIds = useMemo(() => new Set(records.map((record) => record.eventId)), [records]);
  const derived = records.filter((record) => record.parentEventIds.length > 0);

  if (derived.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-ink-rule px-4 py-4 sm:px-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
        Provenance chains
      </p>
      <div className="mt-3 grid gap-2">
        {derived.map((record) => (
          <p className="break-words font-mono text-[12px] leading-[1.55] text-ink" key={record.eventId}>
            {record.parentEventIds.map((parentId) => (
              <span className={recordIds.has(parentId) ? "" : "text-accentDeep"} key={parentId}>
                {parentId}
              </span>
            )).reduce<ReactNode[]>((parts, item, index) => {
              if (index > 0) {
                parts.push(<span className="mx-2 text-ink-muted" key={`sep-${record.eventId}-${index}`}>+</span>);
              }
              parts.push(item);
              return parts;
            }, [])}
            <span className="mx-2 text-ink-muted">→</span>
            <span>{record.eventId}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function EventsTable({ events }: { events: WorkspaceEventRecord[] }) {
  if (events.length === 0) {
    return (
      <div className="border-y border-ink-rule bg-cream-soft px-5 py-12 text-center text-sm text-ink-muted">
        No AI events found for the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border-y border-ink-rule">
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow className="border-ink-rule bg-cream-soft hover:bg-cream-soft">
            <TableHead className="w-[170px] text-ink">Timestamp</TableHead>
            <TableHead className="w-[150px] text-ink">Tool</TableHead>
            <TableHead className="w-[150px] text-ink">Model</TableHead>
            <TableHead className="text-ink">Prompt</TableHead>
            <TableHead className="w-[220px] text-ink">Asset</TableHead>
            <TableHead className="w-[140px] text-ink">Operator</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow className="border-ink-rule hover:bg-cream-soft" key={event.eventId}>
              <TableCell className="text-ink-muted">{formatDate(event.occurredAt)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span>{event.toolIdentifier}</span>
                  {event.toolVersion ? (
                    <span className="text-xs text-ink-muted">{event.toolVersion}</span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{event.modelIdentifier}</TableCell>
              <TableCell>
                <p className="max-w-[460px] whitespace-normal break-words leading-5">
                  {event.promptText}
                </p>
                {event.parentEventIds.length > 0 ? (
                  <p className="mt-2 text-xs text-ink-muted">
                    Parents: {event.parentEventIds.join(", ")}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge className="w-fit border-ink-rule bg-cream-soft text-ink">
                    {event.outputAssetType}
                  </Badge>
                  <span className="break-all text-xs text-ink-muted">{event.outputAssetUrl}</span>
                  <span className="font-mono text-xs text-ink-muted">
                    {shortHash(event.outputAssetHashValue)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span>{event.operatorHumanName ?? event.operatorUserId}</span>
                {event.operatorHumanName ? (
                  <span className="block text-xs text-ink-muted">{event.operatorUserId}</span>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function RecordsSection({
  allRecords,
  error,
  filters,
  isLoading = false,
  onApplyFilters,
  onResetFilters,
  sourceLabel
}: {
  allRecords: WorkspaceEventRecord[];
  error?: string | null;
  filters: RecordFilters;
  isLoading?: boolean;
  onApplyFilters: (filters: RecordFilters) => void;
  onResetFilters: () => void;
  sourceLabel: string;
}) {
  const [draftFilters, setDraftFilters] = useState<RecordFilters>(filters);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  function updateFilter(key: keyof RecordFilters, value: string) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApplyFilters({
      start_date: normalize(draftFilters.start_date),
      end_date: normalize(draftFilters.end_date),
      tool: normalize(draftFilters.tool),
      asset: normalize(draftFilters.asset),
      asset_type: normalize(draftFilters.asset_type)
    });
  }

  function handleReset() {
    const nextFilters: RecordFilters = {};
    setDraftFilters(nextFilters);
    onResetFilters();
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8 lg:p-10">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            Records
          </p>
          <h2 className="mt-2 text-[22px] font-medium leading-7 text-ink">AI event ledger</h2>
          <p className="mt-2 text-[13px] leading-[1.55] text-ink-muted">
            {allRecords.length} event{allRecords.length === 1 ? "" : "s"} from {sourceLabel}
          </p>
        </div>
        {isLoading ? (
          <span className="inline-flex w-fit items-center rounded-full border border-ink-rule px-3 py-1 text-[12px] text-ink-muted">
            Loading records
          </span>
        ) : null}
      </div>

      <form className="mb-5 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] lg:items-end" onSubmit={handleSubmit}>
        <label className="grid gap-1 text-xs text-ink-muted">
          Start
          <Input
            className="border-ink-rule bg-cream-soft text-ink placeholder:text-ink-muted"
            name="start_date"
            onChange={(event) => updateFilter("start_date", event.target.value)}
            placeholder="2026-06-01T00:00:00Z"
            value={draftFilters.start_date ?? ""}
          />
        </label>
        <label className="grid gap-1 text-xs text-ink-muted">
          End
          <Input
            className="border-ink-rule bg-cream-soft text-ink placeholder:text-ink-muted"
            name="end_date"
            onChange={(event) => updateFilter("end_date", event.target.value)}
            placeholder="2026-06-15T23:59:59Z"
            value={draftFilters.end_date ?? ""}
          />
        </label>
        <label className="grid gap-1 text-xs text-ink-muted">
          Tool
          <Input
            className="border-ink-rule bg-cream-soft text-ink placeholder:text-ink-muted"
            name="tool"
            onChange={(event) => updateFilter("tool", event.target.value)}
            placeholder="runway-ml"
            value={draftFilters.tool ?? ""}
          />
        </label>
        <label className="grid gap-1 text-xs text-ink-muted">
          Asset type
          <Input
            className="border-ink-rule bg-cream-soft text-ink placeholder:text-ink-muted"
            name="asset_type"
            onChange={(event) => updateFilter("asset_type", event.target.value)}
            placeholder="video"
            value={draftFilters.asset_type ?? ""}
          />
        </label>
        <label className="grid gap-1 text-xs text-ink-muted">
          Asset
          <Input
            className="border-ink-rule bg-cream-soft text-ink placeholder:text-ink-muted"
            name="asset"
            onChange={(event) => updateFilter("asset", event.target.value)}
            placeholder="asset URL contains..."
            value={draftFilters.asset ?? ""}
          />
        </label>
        <div className="flex gap-2">
          <Button className="bg-accent text-white hover:bg-[#e05a1a]" type="submit">
            <Search size={16} />
            Filter
          </Button>
          <button
            aria-label="Reset filters"
            className="inline-flex h-9 items-center justify-center rounded-md bg-cream-soft px-3 text-sm text-ink transition-colors hover:bg-[#f2e5da]"
            onClick={handleReset}
            type="button"
          >
            <RefreshCcw size={16} />
          </button>
        </div>
      </form>

      {error ? (
        <div className="mb-4 border border-ink-rule bg-cream-soft px-3 py-2 text-sm text-ink">
          Records could not refresh: {error}
        </div>
      ) : null}

      <EventsTable events={allRecords} />
      <ProvenanceChains records={allRecords} />
    </section>
  );
}
