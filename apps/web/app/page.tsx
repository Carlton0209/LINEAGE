"use client";

import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
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
      <SectionEyebrow label="Verifiable AI provenance for media delivery" number="01" />
      <h1 className="text-[clamp(2.4rem,8vw,5.2rem)] font-medium leading-[1.04] tracking-[-0.03em] text-ink sm:text-[clamp(3rem,6vw,5.2rem)]">
        Prove what AI touched
        <br className="hidden sm:block" />
        <span className="sm:hidden"> </span>
        the work before
        <br className="hidden sm:block" />
        <span className="sm:hidden"> </span>
        you deliver.<span className="text-accent"> No gaps. No guesswork.</span>
      </h1>
      <p className="mt-7 max-w-[720px] text-[16px] leading-[1.55] text-ink-muted sm:mt-9 sm:text-[18px]">
        LINEAGE turns AI-assisted production activity into a signed bill of materials: tools,
        models, prompts, source assets, output hashes, operators, and provenance, packaged for
        buyer review and independent verification.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:mt-12 sm:flex-row sm:gap-5">
        <PrimaryButton label="Review the proof chain" targetId="product" />
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <SectionShell id="problem">
      <SectionEyebrow label="The delivery risk" number="02" />
      <SectionHeadline>
        AI disclosure cannot be
        <br />
        <span className="text-accent">rebuilt from memory.</span>
      </SectionHeadline>
      <div className="mt-10 grid grid-cols-1 items-start gap-8 sm:mt-14 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
        <div>
          <p className="mb-5 text-[16px] font-medium leading-[1.55] text-ink sm:text-[18px]">
            A finished film, ad, trailer, or music video may pass through Runway, Suno,
            ElevenLabs, custom ComfyUI workflows, and internal model tests before it reaches a
            buyer. The creative file may be complete while the AI record is still scattered.
          </p>
          <p className="mb-5 text-[16px] leading-[1.55] text-ink-muted sm:text-[18px]">
            At delivery, buyers and insurers ask precise questions: what AI systems were used,
            which prompts and references shaped the output, which assets were generated, and
            whether the disclosure record changed after approval.
          </p>
          <p className="text-[16px] font-medium text-accent-dk sm:text-[18px]">
            LINEAGE captures that evidence as it happens, then converges it into one structured,
            signed AI bill of materials.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8">
          <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            WHAT DELIVERY NEEDS
          </p>
          <p className="text-[64px] font-medium leading-none text-ink sm:text-[72px]">1</p>
          <p className="mt-3 text-[13px] leading-[1.5] text-ink-muted sm:text-[14px]">
            project ledger that connects AI events, prompts, outputs, hashes, and provenance
          </p>
          <div className="my-6 border-t border-ink-rule" />
          <p className="text-[64px] font-medium leading-none text-accent sm:text-[72px]">2</p>
          <p className="mt-3 text-[13px] leading-[1.5] text-ink-muted sm:text-[14px]">
            deliverables from the same source: a signed JSON manifest and a human-readable PDF
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
    subtitle: "Record evidence while work is made",
    body:
      "The capture layer records the generation event itself: timestamp, tool, model, prompt, output URL, asset hash, operator, and project ID.",
    kicker: "No end-of-project archaeology."
  },
  {
    number: "02 / MODULE",
    code: "LEDGER",
    subtitle: "Converge events into one ledger",
    body:
      "Every capture is normalized into a project-scoped audit trail. Producers can filter by date, tool, and asset, then inspect the chain before delivery.",
    kicker: "One project. One record."
  },
  {
    number: "03 / MODULE",
    code: "CERTIFY",
    subtitle: "Generate the proof package",
    body:
      "One click produces a structured manifest, cryptographic signature, public key fingerprint, and PDF summary for non-technical review.",
    kicker: "Verification does not require a LINEAGE account."
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
        The product narrows the compliance workflow to one repeatable sequence: capture the AI
        event, preserve it in the ledger, certify the project, and let the recipient verify it.
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
    body: "A creator generates an asset with the project ID attached to the session."
  },
  {
    number: "2",
    title: "Capture",
    body: "LINEAGE records the prompt, model, tool, output URL, and timestamp at the moment of use."
  },
  {
    number: "3",
    title: "Log",
    body: "The output is hashed and written into a normalized, project-scoped ledger."
  },
  {
    number: "4",
    title: "Review",
    body: "The production team reviews the AI record before it becomes a delivery artifact."
  },
  {
    number: "5",
    title: "Sign",
    body: "LINEAGE produces a canonical manifest and signs the record cryptographically."
  },
  {
    number: "6",
    title: "Deliver",
    body: "The buyer receives JSON and PDF, then checks the signature independently."
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
          Evidence captured early is easier to trust, easier to review, and harder to dispute.
        </p>
      </div>
    </SectionShell>
  );
}

function TrustSection() {
  const guarantees = [
    "The manifest was signed by the private key corresponding to the embedded public key.",
    "The manifest content has not changed since the signature was created.",
    "The record can be verified independently from the LINEAGE application."
  ];
  const limits = [
    "Whether the issuer is who they claim to be. Confirm the public key fingerprint through a second channel.",
    "Whether the AI usage is allowed by a contract, license, union rule, or buyer policy. LINEAGE preserves evidence; people still make clearance decisions."
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
        The promise is intentionally narrow: prove the manifest has not changed since signing.
        That narrow proof is what makes the record useful during delivery review.
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
      "Paste a manifest, confirm the signature, and read the AI usage summary. No account required."
  },
  {
    href: "/ledger",
    eyebrow: "FOR PRODUCTIONS",
    title: "Inspect the ledger",
    body:
      "Open the demo ledger and see how captured AI events become a delivery-ready record."
  },
  {
    href: "mailto:hello@lineage.dev",
    eyebrow: "FOR PARTNERS",
    title: "Bring your requirement",
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
            Give every reviewer
            <br />
            <span className="text-accent">the same record.</span>
          </h2>
          <p className="mt-5 max-w-[640px] text-[16px] leading-[1.55] text-[#9BA1A8] sm:text-[18px]">
            LINEAGE converts AI production history into a signed, reviewable delivery artifact:
            structured enough for systems, readable enough for humans, and narrow enough to verify.
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
          <BrandMark size="sm" />
          <span className="font-semibold tracking-[0.04em]">LINEAGE</span>
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
