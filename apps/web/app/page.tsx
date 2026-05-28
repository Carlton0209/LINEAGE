"use client";

import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

function BackgroundOrnament() {
  return <div className="background-ornament" />;
}

const GlassBackground = dynamic(() => import("@/components/lineage-glass-background"), {
  ssr: false,
  loading: () => <BackgroundOrnament />
});

function TextRoll({ label }: { label: string }) {
  return (
    <span className="h-[20px] overflow-hidden">
      <span className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2">
        <span>{label}</span>
        <span aria-hidden="true">{label}</span>
      </span>
    </span>
  );
}

function StarburstIcon() {
  return (
    <svg className="h-5 w-5 fill-current text-accent sm:h-6 sm:w-6" viewBox="0 0 100 100">
      <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
    </svg>
  );
}

function PrimaryButton({ label, targetId }: { label: string; targetId: string }) {
  return (
    <button
      className="group inline-flex items-center rounded-full bg-accent py-2 pl-5 pr-2 text-[13px] font-medium text-white transition-colors duration-300 hover:bg-[#e05a1a] sm:pl-6 sm:text-[14px]"
      onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })}
      type="button"
    >
      <TextRoll label={label} />
      <span className="ml-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-accent transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45 sm:h-8 sm:w-8">
        <ArrowRight size={14} />
      </span>
    </button>
  );
}

function TrustPill() {
  return (
    <div className="inline-flex items-center gap-2 rounded-[4px] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] sm:gap-3 sm:px-4 sm:py-2.5">
      <StarburstIcon />
      <span className="text-[13px] font-medium text-ink sm:text-[14px]">JSON-LD + Ed25519</span>
      <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] text-white sm:px-2 sm:text-[11px]">
        Signed
      </span>
    </div>
  );
}

function SectionEyebrow({
  number,
  label,
  dark = false
}: {
  number: string;
  label: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-6 flex items-center gap-3 sm:mb-8">
      <span
        className={
          dark
            ? "flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-ink sm:h-7 sm:w-7 sm:text-[12px]"
            : "flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white sm:h-7 sm:w-7 sm:text-[12px]"
        }
      >
        {number}
      </span>
      <span
        className={
          dark
            ? "rounded-full border border-[#30363D] px-3 py-1 text-[12px] font-medium text-cream sm:px-4 sm:py-1.5 sm:text-[13px]"
            : "rounded-full border border-ink-rule px-3 py-1 text-[12px] font-medium text-ink sm:px-4 sm:py-1.5 sm:text-[13px]"
        }
      >
        {label}
      </span>
    </div>
  );
}

function SectionShell({
  children,
  id
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      className="relative z-10 mx-auto w-full max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28"
      id={id}
    >
      {children}
    </section>
  );
}

function SectionHeadline({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[clamp(2rem,5.5vw,3.6rem)] font-medium leading-[1.08] tracking-[-0.025em] text-ink">
      {children}
    </h2>
  );
}

function HeroSection() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-16 lg:px-12 lg:pb-36 lg:pt-20">
      <SectionEyebrow label="AI bill of materials for media delivery" number="01" />
      <h1 className="text-[clamp(2.4rem,8vw,5.2rem)] font-medium leading-[1.04] tracking-[-0.03em] text-ink sm:text-[clamp(3rem,6vw,5.2rem)]">
        Capture every AI touch.
        <br className="hidden sm:block" />
        <span className="sm:hidden"> </span>
        Turn production history
        <br className="hidden sm:block" />
        <span className="sm:hidden"> </span>
        into proof.<span className="text-accent"> Deliver with confidence.</span>
      </h1>
      <p className="mt-7 max-w-[720px] text-[16px] leading-[1.55] text-ink-muted sm:mt-9 sm:text-[18px]">
        LINEAGE records the tools, models, prompts, source assets, output hashes, operators, and
        provenance behind AI-assisted work, then packages that history into a signed manifest and a
        buyer-readable delivery summary.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:mt-12 sm:flex-row sm:gap-5">
        <PrimaryButton label="See the pipeline" targetId="product" />
        <TrustPill />
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <SectionShell id="problem">
      <SectionEyebrow label="Why this exists" number="02" />
      <SectionHeadline>
        AI usage is now part
        <br />
        <span className="text-accent">of the delivery package.</span>
      </SectionHeadline>
      <div className="mt-10 grid grid-cols-1 items-start gap-8 sm:mt-14 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
        <div>
          <p className="mb-5 text-[16px] font-medium leading-[1.55] text-ink sm:text-[18px]">
            A film, ad, trailer, or music video can now pass through Runway, Suno, ElevenLabs,
            custom ComfyUI workflows, and internal model experiments before it reaches delivery.
            The creative result may be finished; the provenance often is not.
          </p>
          <p className="mb-5 text-[16px] leading-[1.55] text-ink-muted sm:text-[18px]">
            Buyers, completion bond companies, and E&amp;O insurers need a clear answer to simple
            questions: which AI systems touched the work, what prompts and references were used,
            what assets were created, and whether the record changed after signing.
          </p>
          <p className="text-[16px] font-medium text-accent-dk sm:text-[18px]">
            LINEAGE turns that evidence into a structured, verifiable AI bill of materials instead
            of another spreadsheet that has to be trusted by hand.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8">
          <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            THE RECORD BUYERS NEED
          </p>
          <p className="text-[64px] font-medium leading-none text-ink sm:text-[72px]">1</p>
          <p className="mt-3 text-[13px] leading-[1.5] text-ink-muted sm:text-[14px]">
            project-scoped ledger that connects prompts, models, assets, operators, and provenance
          </p>
          <div className="my-6 border-t border-ink-rule" />
          <p className="text-[64px] font-medium leading-none text-accent sm:text-[72px]">2</p>
          <p className="mt-3 text-[13px] leading-[1.5] text-ink-muted sm:text-[14px]">
            outputs from the same source of truth: a signed JSON-LD manifest and a readable PDF
            summary
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

const modules = [
  {
    number: "01 / MODULE",
    code: "CAPTURE",
    subtitle: "Evidence at creation time",
    body:
      "The first capture surface watches Runway ML generation activity and records timestamp, tool, model, prompt, output URL, asset hash, operator, and project ID.",
    kicker: "The proof starts where the asset is made."
  },
  {
    number: "02 / MODULE",
    code: "LEDGER",
    subtitle: "Project-scoped event log",
    body:
      "The backend normalizes every capture into a searchable ledger. Producers can filter by date, tool, and asset, then inspect the full chain before delivery.",
    kicker: "One project, one source of truth."
  },
  {
    number: "03 / MODULE",
    code: "CERTIFY",
    subtitle: "Signed delivery artifact",
    body:
      "One click produces a JSON-LD manifest with C2PA-compatible structure, an Ed25519 signature, the public key fingerprint, and a PDF summary.",
    kicker: "Anyone can verify the manifest without a LINEAGE account."
  }
];

function ProductSection() {
  return (
    <SectionShell id="product">
      <SectionEyebrow label="The product" number="03" />
      <SectionHeadline>
        Three modules.
        <br />
        <span className="text-accent">One unbroken chain.</span>
      </SectionHeadline>
      <p className="mt-5 max-w-[600px] text-[15px] text-ink-muted sm:text-[16px]">
        The MVP proves one complete loop: capture a real generation, store it in a ledger, and
        certify the project with a manifest that can be checked independently.
      </p>
      <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-16 sm:gap-6 md:grid-cols-3">
        {modules.map((item) => (
          <article
            className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8"
            key={item.code}
          >
            <div className="mb-6 h-[3px] w-12 rounded-full bg-accent" />
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
              {item.number}
            </p>
            <h3 className="mt-1 text-[22px] font-medium text-ink sm:text-[26px]">{item.code}</h3>
            <p className="mb-5 mt-1 text-[14px] text-accent sm:text-[15px]">{item.subtitle}</p>
            <p className="text-[14px] leading-[1.55] text-ink-muted sm:text-[15px]">
              {item.body}
            </p>
            <div className="mt-6 border-t border-ink-rule pt-5">
              <p className="text-[12px] italic text-accent sm:text-[13px]">{item.kicker}</p>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

const workflowSteps = [
  {
    number: "1",
    title: "Generate",
    body: "A creator produces an asset in Runway with the project ID set in the browser extension."
  },
  {
    number: "2",
    title: "Capture",
    body: "The extension captures the actual prompt, model identifier, output URL, and timestamp."
  },
  {
    number: "3",
    title: "Log",
    body: "The service hashes the output asset and writes a normalized event into the project ledger."
  },
  {
    number: "4",
    title: "Review",
    body: "The dashboard shows the project history with filters by date, tool, and asset."
  },
  {
    number: "5",
    title: "Sign",
    body: "LINEAGE generates a canonical manifest and signs it with an Ed25519 keypair."
  },
  {
    number: "6",
    title: "Deliver",
    body: "The buyer receives JSON plus PDF, then verifies the signature on a public verifier page."
  }
];

function WorkflowSection() {
  return (
    <SectionShell id="workflow">
      <SectionEyebrow label="How it works" number="04" />
      <SectionHeadline>
        From the first prompt
        <br />
        <span className="text-accent">to delivery acceptance.</span>
      </SectionHeadline>
      <div className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-6 lg:gap-3">
        {workflowSteps.map((step) => (
          <article
            className="flex flex-col rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6"
            key={step.number}
          >
            <span className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[14px] font-medium text-white">
              {step.number}
            </span>
            <h3 className="mb-2 text-[18px] font-medium text-ink sm:text-[20px]">{step.title}</h3>
            <p className="flex-1 text-[13px] leading-[1.45] text-ink-muted sm:text-[14px]">
              {step.body}
            </p>
          </article>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-3 border-t border-ink-rule pt-8 sm:flex-row sm:items-center sm:gap-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent-dk">
          CORE PRINCIPLE
        </p>
        <p className="text-[14px] text-ink sm:text-[15px]">
          Capture close to creation. Preserve the evidence. Let every recipient verify the same
          record.
        </p>
      </div>
    </SectionShell>
  );
}

function TrustSection() {
  const guarantees = [
    "The signature was produced by the private key matching the manifest's public key.",
    "The manifest content has not changed since it was signed.",
    "The signature uses Ed25519 with C2PA 2.1-compatible encoding."
  ];
  const limits = [
    "Whether the issuer is who they claim to be. Confirm the public key fingerprint with the issuer through a second channel.",
    "Whether the underlying AI usage is allowed by a contract, license, union rule, or buyer policy. LINEAGE preserves evidence; people still make clearance decisions."
  ];

  return (
    <SectionShell id="trust">
      <SectionEyebrow label="Trust by construction" number="05" />
      <SectionHeadline>
        What we guarantee.
        <br />
        <span className="text-accent">What we leave to you.</span>
      </SectionHeadline>
      <div className="mt-12 grid grid-cols-1 gap-6 sm:mt-16 lg:grid-cols-2 lg:gap-8">
        <article className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8">
          <span className="block h-8 w-8 rounded-full bg-accent" />
          <h3 className="mb-5 mt-5 text-[20px] font-medium text-ink sm:text-[22px]">
            What verification guarantees
          </h3>
          <ul>
            {guarantees.map((item) => (
              <li
                className="mb-3 flex items-start gap-3 text-[14px] leading-[1.55] text-ink last:mb-0 sm:text-[15px]"
                key={item}
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8">
          <span className="block h-8 w-8 rounded-full border-[1.5px] border-accent" />
          <h3 className="mb-5 mt-5 text-[20px] font-medium text-ink sm:text-[22px]">
            What verification does not guarantee
          </h3>
          <ul>
            {limits.map((item) => (
              <li
                className="mb-3 flex items-start gap-3 text-[14px] leading-[1.55] text-ink last:mb-0 sm:text-[15px]"
                key={item}
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-rule" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
      <p className="mt-8 border-t border-ink-rule pt-6 text-[13px] italic text-ink-muted sm:text-[14px]">
        Verification answers one narrow question: did this signed manifest change after the issuer
        produced it? That narrow promise is what makes the record useful in delivery workflows.
      </p>
    </SectionShell>
  );
}

const footerCards = [
  {
    href: "/verify",
    eyebrow: "FOR BUYERS",
    title: "Verify a manifest",
    body:
      "Paste a LINEAGE manifest, confirm the signature, and read the audit summary. No account required."
  },
  {
    href: "/ledger",
    eyebrow: "FOR PRODUCTIONS",
    title: "See the ledger",
    body:
      "Open the demo project ledger and inspect the captured AI events behind a delivery package."
  },
  {
    href: "mailto:hello@lineage.dev",
    eyebrow: "FOR PARTNERS",
    title: "Map a delivery requirement",
    body:
      "Working on buyer-side AI disclosure, insurance review, or production compliance? Send the format you need to support."
  }
];

function GetStartedSection() {
  return (
    <>
      <SectionShell id="get-started">
        <div className="rounded-3xl bg-ink p-10 text-cream sm:p-16 lg:p-20">
          <SectionEyebrow dark label="Get started" number="06" />
          <h2 className="text-[clamp(2rem,5.5vw,3.6rem)] font-medium leading-[1.08] tracking-[-0.025em] text-cream">
            A manifest your buyer
            <br />
            <span className="text-accent">can actually inspect.</span>
          </h2>
          <p className="mt-5 max-w-[640px] text-[16px] leading-[1.55] text-[#9BA1A8] sm:text-[18px]">
            Use LINEAGE to turn AI production history into a signed, reviewable delivery artifact:
            structured enough for systems, readable enough for humans.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-14 sm:gap-5 md:grid-cols-3">
            {footerCards.map((card) => (
              <Link
                className="flex cursor-pointer flex-col rounded-2xl bg-[#1B2129] p-6 transition-colors duration-300 hover:bg-[#222931] sm:p-7"
                href={card.href}
                key={card.title}
              >
                <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
                  {card.eyebrow}
                </p>
                <h3 className="mb-2 text-[20px] font-medium text-cream sm:text-[22px]">
                  {card.title}
                </h3>
                <p className="mb-6 flex-1 text-[13px] leading-[1.5] text-[#9BA1A8] sm:text-[14px]">
                  {card.body}
                </p>
                <span className="flex items-center gap-2 text-[13px] font-medium text-accent">
                  Continue
                  <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </SectionShell>
      <footer className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col gap-4 border-t border-ink-rule px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <div className="flex items-center gap-2 text-[12px] text-ink-muted">
          <span className="font-semibold tracking-[0.04em]">LINEAGE</span>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span>© 2026</span>
        </div>
        <div className="flex items-center gap-5 text-[12px] text-ink-muted">
          <Link className="transition-colors duration-200 hover:text-ink" href="/verify">
            Verify
          </Link>
          <Link className="transition-colors duration-200 hover:text-ink" href="/ledger">
            Ledger
          </Link>
          <a
            className="transition-colors duration-200 hover:text-ink"
            href="mailto:hello@lineage.dev"
          >
            Talk to us
          </a>
        </div>
      </footer>
    </>
  );
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-cream text-ink">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-90">
        <GlassBackground />
      </div>
      <SiteHeader />
      <HeroSection />
      <ProblemSection />
      <ProductSection />
      <WorkflowSection />
      <TrustSection />
      <GetStartedSection />
    </main>
  );
}
