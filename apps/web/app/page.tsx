import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LINEAGE",
  description: "Verifiable AI bills of materials for media delivery."
};

const features = [
  {
    title: "Capture",
    body: "Record prompts, models, operators, timestamps, and generated asset hashes as AI work happens."
  },
  {
    title: "Ledger",
    body: "Review every project event in one searchable bill of materials with provenance chains intact."
  },
  {
    title: "Certify",
    body: "Generate signed manifest JSON and a readable PDF that buyers can independently verify."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F5F1EA] text-[#0F1419]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-[#0F1419]/10 pb-4">
          <Link className="flex items-center gap-2 text-sm font-semibold tracking-[0.16em]" href="/">
            <span>LINEAGE</span>
            <span className="h-2 w-2 rounded-full bg-[#E97451]" aria-hidden="true" />
          </Link>
          <nav className="flex items-center gap-5 text-sm text-[#0F1419]/70">
            <Link className="transition-colors hover:text-[#0F1419]" href="/ledger">
              Ledger
            </Link>
            <Link className="transition-colors hover:text-[#0F1419]" href="/verify">
              Verify
            </Link>
          </nav>
        </header>

        <section className="flex flex-1 flex-col justify-center gap-12 py-14 sm:py-20">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E97451]">
              Compliance infrastructure for AI-assisted media
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
              Every film, show, ad, and album now leaves an AI footprint.{" "}
              <span className="text-[#E97451]">Make yours defensible.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#0F1419]/72">
              LINEAGE turns AI usage into a signed, verifiable bill of materials, linking
              prompts, models, operators, generated assets, and provenance into one delivery-ready
              record.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#0F1419] px-5 text-sm font-semibold text-[#F5F1EA] transition-colors hover:bg-[#232A31]"
                href="/ledger"
              >
                Open the ledger
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-md border border-[#0F1419]/18 px-5 text-sm font-semibold text-[#0F1419] transition-colors hover:border-[#E97451] hover:text-[#E97451]"
                href="/verify"
              >
                Verify a manifest
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {features.map((feature) => (
              <article className="rounded-md border border-[#0F1419]/12 bg-white/35 p-5" key={feature.title}>
                <h2 className="text-base font-semibold">{feature.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#0F1419]/68">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
