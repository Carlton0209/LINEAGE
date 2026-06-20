import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function LedgerPage({ searchParams }: PageProps) {
  const projectId = firstParam(searchParams?.project_id);
  redirect(projectId ? `/verify?project=${encodeURIComponent(projectId)}` : "/verify");
}
