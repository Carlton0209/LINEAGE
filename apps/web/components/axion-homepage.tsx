"use client";

/* eslint-disable @next/next/no-img-element */

import { ArrowRight, ChevronDown, FileCheck2, Fingerprint, Menu, ShieldCheck, Sparkles, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

const ShaderBackground = dynamic(() => import("@/components/axion-shader-background"), {
  ssr: false,
  loading: () => (
    <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.95),transparent_30%),linear-gradient(135deg,#efefef,#ffffff_46%,#f4ece8)]" />
  )
});

const proofModes = [
  {
    id: "capture",
    label: "Capture",
    value: "Prompts",
    detail: "Record prompts, models, assets, and operators as work happens."
  },
  {
    id: "ledger",
    label: "Ledger",
    value: "Hashes",
    detail: "Converge every AI event into one project-scoped record."
  },
  {
    id: "certify",
    label: "Certify",
    value: "Signature",
    detail: "Generate a signed manifest and a readable delivery summary."
  }
] as const;

const flowCards = [
  {
    title: "Capture",
    short: "AI use at source.",
    detail: "Extension capture turns generation activity into structured evidence.",
    icon: Sparkles
  },
  {
    title: "Ledger",
    short: "One record.",
    detail: "Events converge into a searchable project log with hashes and lineage.",
    icon: Fingerprint
  },
  {
    title: "Certify",
    short: "Signed proof.",
    detail: "Manifest JSON plus PDF summary, ready for buyer review.",
    icon: FileCheck2
  }
];

const artifactTabs = [
  {
    id: "manifest",
    label: "Manifest",
    title: "Structured proof",
    body: "Tool, model, prompt, asset hash, operator, provenance."
  },
  {
    id: "pdf",
    label: "PDF",
    title: "Human summary",
    body: "A compact review document for delivery packets."
  },
  {
    id: "verify",
    label: "Verify",
    title: "Independent check",
    body: "Paste the manifest. Confirm the signature. No login."
  }
] as const;

type ProofModeId = (typeof proofModes)[number]["id"];
type ArtifactTabId = (typeof artifactTabs)[number]["id"];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function TextRoll({ children }: { children: string }) {
  return (
    <span className="relative h-[20px] overflow-hidden">
      <span className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2">
        <span className="h-[20px] leading-[20px]">{children}</span>
        <span className="h-[20px] leading-[20px]" aria-hidden="true">
          {children}
        </span>
      </span>
    </span>
  );
}

function LineageMark({ size = "h-10 w-10" }: { size?: string }) {
  return (
    <span className={`inline-flex shrink-0 overflow-hidden rounded-full ${size}`}>
      <img alt="LINEAGE" className="h-full w-full" draggable={false} src="/lineage-logo-mark.svg" />
    </span>
  );
}

function Cta({
  children,
  href,
  onClick,
  tone = "dark"
}: {
  children: string;
  href?: string;
  onClick?: () => void;
  tone?: "dark" | "accent";
}) {
  const base =
    "group inline-flex items-center rounded-full py-2 pl-5 pr-2 text-[13px] font-medium transition-all duration-300 hover:-translate-y-0.5 sm:pl-6 sm:text-[14px]";
  const tones = {
    dark: "bg-ink text-white shadow-[0_10px_24px_rgba(17,17,17,0.16)] hover:bg-[#222]",
    accent: "bg-accent text-white shadow-[0_10px_24px_rgba(233,116,81,0.24)] hover:bg-[#e05a1a]"
  };
  const iconTone = tone === "accent" ? "text-accent" : "text-ink";
  const content = (
    <>
      <TextRoll>{children}</TextRoll>
      <span
        className={`ml-3 flex h-7 w-7 items-center justify-center rounded-full bg-white ${iconTone} transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45 sm:h-8 sm:w-8`}
      >
        <ArrowRight size={14} />
      </span>
    </>
  );

  if (href) {
    return (
      <a className={`${base} ${tones[tone]}`} href={href}>
        {content}
      </a>
    );
  }

  return (
    <button className={`${base} ${tones[tone]}`} onClick={onClick} type="button">
      {content}
    </button>
  );
}

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = [
    { label: "Proof", href: "#proof" },
    { label: "Flow", href: "#flow" },
    { label: "Deliver", href: "#deliver" },
    { label: "Verify", href: "/verify" }
  ];

  return (
    <>
      <nav className="relative z-20 mx-auto w-full max-w-[1440px] p-2 sm:p-3">
        <div className="flex items-center justify-between rounded-full bg-white/88 p-[5px] shadow-[0_2px_18px_rgba(0,0,0,0.07)] backdrop-blur-xl">
          <a className="flex items-center gap-3 pr-3" href="#hero">
            <LineageMark />
            <span className="hidden text-[13px] font-semibold tracking-[0.08em] text-ink sm:inline">
              LINEAGE
            </span>
          </a>

          <div className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <a
                className="text-[14px] text-ink transition-colors duration-300 hover:text-ink-muted"
                href={link.href}
                key={link.label}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <span className="hidden items-center gap-2 rounded-full border border-ink-rule px-3 py-1.5 text-[12px] text-ink-muted lg:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Demo live
            </span>
            <Cta onClick={() => scrollToId("flow")}>See proof</Cta>
          </div>

          <button
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white md:hidden"
            onClick={() => setIsOpen((value) => !value)}
            type="button"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <div className={`fixed inset-0 z-50 md:hidden ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <button
          aria-label="Close menu backdrop"
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsOpen(false)}
          type="button"
        />
        <div
          className={`absolute inset-x-0 bottom-0 mx-3 mb-3 rounded-2xl bg-white p-6 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "translate-y-0" : "translate-y-full"}`}
        >
          <div className="mb-8 flex items-center justify-between">
            <span className="inline-flex items-center gap-3">
              <LineageMark size="h-8 w-8" />
              <span className="text-[13px] font-semibold tracking-[0.08em] text-ink">LINEAGE</span>
            </span>
            <button
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-4">
            {navLinks.map((link) => (
              <a
                className="text-[28px] font-medium leading-8 text-ink"
                href={link.href}
                key={link.label}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-10">
            <Cta onClick={() => scrollToId("flow")}>See proof</Cta>
          </div>
        </div>
      </div>
    </>
  );
}

function HeroSection() {
  const [activeProof, setActiveProof] = useState<ProofModeId>("capture");
  const selectedProof = proofModes.find((mode) => mode.id === activeProof) ?? proofModes[0];

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#EFEFEF]" id="hero">
      <ShaderBackground />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(239,239,239,0.2),rgba(239,239,239,0.92))]" />
      <Navigation />

      <div className="relative z-20 mx-auto flex w-full max-w-[1440px] flex-1 items-end px-5 pb-14 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
        <div className="w-full">
          <div className="animate-fade-up mb-5 inline-flex items-center gap-2 rounded-full bg-white/72 px-3 py-1.5 text-[12px] font-medium text-ink shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:mb-8">
            <ShieldCheck size={14} className="text-accent" />
            AI bill of materials
          </div>
          <h1 className="animate-fade-up max-w-[1050px] text-[clamp(2.4rem,8vw,5.6rem)] font-medium leading-[1.02] tracking-[-0.04em] text-ink sm:text-[clamp(3.2rem,6vw,5.6rem)] [animation-delay:80ms]">
            Prove every
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            AI touchpoint.
          </h1>
          <p className="animate-fade-up mt-6 max-w-[640px] text-[16px] leading-[1.55] text-ink-muted sm:mt-8 sm:text-[18px] [animation-delay:160ms]">
            Capture prompts, models, assets, and hashes. Converge them into one signed manifest buyers can verify.
          </p>

          <div className="animate-fade-up mt-8 grid max-w-[820px] grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3 [animation-delay:240ms]" id="proof">
            {proofModes.map((mode) => (
              <button
                aria-pressed={activeProof === mode.id}
                className={`group rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(17,17,17,0.10)] ${
                  activeProof === mode.id
                    ? "border-accent bg-white shadow-[0_12px_30px_rgba(233,116,81,0.16)]"
                    : "border-white/70 bg-white/55 backdrop-blur-xl"
                }`}
                key={mode.id}
                onClick={() => setActiveProof(mode.id)}
                type="button"
              >
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                  {mode.label}
                </span>
                <span className="mt-3 flex items-center justify-between text-[18px] font-medium text-ink">
                  {mode.value}
                  <span className="h-2 w-2 rounded-full bg-accent transition-transform duration-300 group-hover:scale-150" />
                </span>
              </button>
            ))}
          </div>

          <div className="animate-fade-up mt-4 min-h-[54px] max-w-[820px] rounded-2xl bg-ink px-5 py-4 text-[14px] leading-[1.5] text-cream shadow-[0_18px_46px_rgba(17,17,17,0.16)] [animation-delay:320ms]">
            <span className="mr-3 text-accent">{selectedProof.label}</span>
            {selectedProof.detail}
          </div>

          <div className="animate-fade-up mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row sm:gap-5 [animation-delay:400ms]">
            <Cta tone="accent" onClick={() => scrollToId("flow")}>
              See the flow
            </Cta>
            <Cta href="/verify">Verify a manifest</Cta>
          </div>
        </div>
      </div>
    </section>
  );
}

function BadgeRow({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-white">
        {number}
      </span>
      <span className="rounded-full border border-ink-rule px-4 py-1.5 text-[13px] font-medium text-ink">
        {label}
      </span>
    </div>
  );
}

function FlowSection() {
  const [activeCard, setActiveCard] = useState(1);

  return (
    <section className="overflow-hidden bg-white py-16 sm:py-20 lg:py-28" id="flow">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="mb-8">
          <BadgeRow label="How it converges" number="01" />
        </div>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <h2 className="max-w-[640px] text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.05] tracking-[-0.035em] text-ink">
              Capture.
              <br />
              Ledger.
              <br />
              Certify.
            </h2>
            <p className="mt-6 max-w-[460px] text-[16px] leading-[1.55] text-ink-muted">
              Three moves. One evidence trail. No reconstruction at delivery.
            </p>
          </div>

          <div className="grid gap-4">
            {flowCards.map((card, index) => {
              const Icon = card.icon;
              const isActive = activeCard === index;

              return (
                <button
                  className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 ${
                    isActive
                      ? "border-accent bg-cream-soft shadow-[0_18px_44px_rgba(17,17,17,0.10)]"
                      : "border-ink-rule bg-white hover:shadow-[0_14px_34px_rgba(17,17,17,0.08)]"
                  }`}
                  key={card.title}
                  onClick={() => setActiveCard(index)}
                  type="button"
                >
                  <span className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100" />
                  <span className="flex items-start justify-between gap-5">
                    <span className="flex gap-4">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${isActive ? "bg-accent text-white" : "bg-cream text-ink"}`}>
                        <Icon size={18} />
                      </span>
                      <span>
                        <span className="block text-[22px] font-medium leading-6 text-ink">{card.title}</span>
                        <span className="mt-2 block text-[15px] text-ink-muted">{card.short}</span>
                        <span
                          className={`grid transition-[grid-template-rows,opacity] duration-300 ${
                            isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <span className="overflow-hidden">
                            <span className="mt-4 block max-w-[520px] text-[14px] leading-[1.55] text-ink">
                              {card.detail}
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                    <ChevronDown
                      className={`mt-1 shrink-0 text-ink-muted transition-transform duration-300 ${isActive ? "rotate-180" : ""}`}
                      size={18}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function DeliverSection() {
  const [activeArtifact, setActiveArtifact] = useState<ArtifactTabId>("manifest");
  const selectedArtifact = artifactTabs.find((tab) => tab.id === activeArtifact) ?? artifactTabs[0];

  return (
    <section className="bg-[#F5F5F5] py-16 sm:py-20 lg:py-28" id="deliver">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="mb-8">
          <BadgeRow label="Delivery proof" number="02" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <h2 className="max-w-[720px] text-[clamp(2rem,5vw,4.2rem)] font-medium leading-[1.05] tracking-[-0.035em] text-ink">
              A cleaner handoff.
            </h2>
            <p className="mt-6 max-w-[520px] text-[16px] leading-[1.55] text-ink-muted">
              Give reviewers the same source of truth: signed, readable, and independently checkable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {artifactTabs.map((tab) => (
                <button
                  aria-pressed={activeArtifact === tab.id}
                  className={`rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                    activeArtifact === tab.id
                      ? "bg-ink text-white shadow-[0_10px_24px_rgba(17,17,17,0.14)]"
                      : "bg-white text-ink-muted hover:text-ink"
                  }`}
                  key={tab.id}
                  onClick={() => setActiveArtifact(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="animate-soft-float rounded-3xl bg-white p-5 shadow-[0_22px_60px_rgba(17,17,17,0.10)] sm:p-6">
            <div className="relative overflow-hidden rounded-2xl bg-ink p-5 text-cream sm:p-7">
              <span className="scan-line" />
              <div className="mb-8 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
                  {selectedArtifact.label}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-cream">Verified</span>
              </div>
              <h3 className="text-[28px] font-medium leading-[1.08] tracking-[-0.02em]">
                {selectedArtifact.title}
              </h3>
              <p className="mt-4 max-w-[430px] text-[14px] leading-[1.55] text-[#B8BEC6]">
                {selectedArtifact.body}
              </p>
              <div className="mt-8 grid gap-3 text-[12px] text-[#B8BEC6]">
                {["project_id: prj_demo_feature", "events: 8", "signature: Ed25519", "status: intact"].map((line) => (
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3" key={line}>
                    <span className="font-mono">{line}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-3xl bg-ink p-8 text-cream sm:mt-16 sm:p-12 lg:p-14" id="connect">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-accent">
                Ready when the buyer asks
              </p>
              <h2 className="mt-5 max-w-[760px] text-[clamp(2rem,5vw,3.8rem)] font-medium leading-[1.06] tracking-[-0.035em]">
                One record.
                <br />
                Less back-and-forth.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Cta tone="accent" onClick={() => scrollToId("flow")}>
                See proof
              </Cta>
              <Cta href="/verify">Verify now</Cta>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#EFEFEF] text-ink">
      <HeroSection />
      <FlowSection />
      <DeliverSection />
    </main>
  );
}
