"use client";

/* eslint-disable @next/next/no-img-element */

import { ArrowRight, Clock, Menu, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ShaderBackground = dynamic(() => import("@/components/axion-shader-background"), {
  ssr: false,
  loading: () => (
    <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9),transparent_28%),linear-gradient(135deg,#efefef,#ffffff_45%,#f4ece8)]" />
  )
});

const SMALL_IMAGE =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090123_74be96d4-9c1b-40cf-932a-96f4f4babed3.png&w=1280&q=85";

const LARGE_IMAGE =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090133_c157d30b-a99a-4477-bec1-a446149ec3f2.png&w=1280&q=85";

const NARRATIV_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_122702_390f5305-8719-41d5-ae80-d23ab3796c28.mp4";

const LUMINAR_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_123323_f909c2b8-ff6c-4edf-882b-8ebcdbe389b5.mp4";

function useLondonTime() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/London"
    });

    const update = () => setTime(formatter.format(new Date()));
    update();
    const interval = window.setInterval(update, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return time;
}

function TextRoll({ children }: { children: string }) {
  return (
    <span className="relative h-[20px] overflow-hidden">
      <span className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2">
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
    </span>
  );
}

function DarkCta({ children }: { children: string }) {
  return (
    <a
      className="group inline-flex items-center rounded-full bg-gray-900 py-2 pl-5 pr-2 text-[13px] font-medium text-white transition-colors duration-300 hover:bg-[#222]"
      href="#connect"
    >
      <TextRoll>{children}</TextRoll>
      <span className="ml-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-900 transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
        <ArrowRight size={12} />
      </span>
    </a>
  );
}

function OrangeCta({ children }: { children: string }) {
  return (
    <a
      className="group inline-flex items-center rounded-full bg-[#F26522] py-2 pl-5 pr-2 text-[13px] font-medium text-white transition-colors duration-300 hover:bg-[#e05a1a] sm:pl-6 sm:text-[14px]"
      href="#projects"
    >
      <TextRoll>{children}</TextRoll>
      <span className="ml-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#F26522] transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45 sm:h-8 sm:w-8">
        <ArrowRight size={14} />
      </span>
    </a>
  );
}

function PartnerIcon() {
  return (
    <svg className="h-5 w-5 fill-current text-[#E8704E] sm:h-6 sm:w-6" viewBox="0 0 100 100">
      <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
    </svg>
  );
}

function PartnerBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-[4px] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] sm:gap-3 sm:px-4 sm:py-2.5">
      <PartnerIcon />
      <span className="text-[13px] font-medium text-gray-900 sm:text-[14px]">Certified Partner</span>
      <span className="rounded bg-gray-900 px-1.5 py-0.5 text-[10px] text-white sm:px-2 sm:text-[11px]">
        Featured
      </span>
    </div>
  );
}

function Navigation() {
  const londonTime = useLondonTime();
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = ["Projects", "Studio", "Journal", "Connect"];

  return (
    <>
      <nav className="relative z-20 mx-auto w-full max-w-[1440px] p-2 sm:p-3">
        <div className="flex items-center justify-between rounded-full bg-white p-[5px] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-6">
            <a
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold leading-[11px] tracking-tight text-white sm:h-10 sm:w-10"
              href="#hero"
            >
              AX
            </a>
            <div className="hidden items-center gap-6 md:flex">
              {navLinks.map((link) => (
                <a
                  className="text-[14px] text-gray-900 transition-colors duration-300 hover:text-gray-500"
                  href={`#${link.toLowerCase()}`}
                  key={link}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          <div className="hidden items-center gap-5 md:flex">
            <span className="hidden text-[13px] text-gray-600 lg:inline">
              Taking on projects for Q1 2026
            </span>
            <span className="inline-flex items-center gap-2 text-[13px] text-gray-600">
              <Clock size={14} />
              {londonTime || "--:--"} in London
            </span>
            <DarkCta>Book a strategy call</DarkCta>
          </div>

          <button
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white md:hidden"
            onClick={() => setIsOpen((value) => !value)}
            type="button"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-50 md:hidden ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <button
          aria-label="Close menu backdrop"
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsOpen(false)}
          type="button"
        />
        <div
          className={`absolute inset-x-0 bottom-0 mx-3 mb-3 rounded-2xl bg-white p-6 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-[13px] text-gray-600">
              <Clock size={14} />
              {londonTime || "--:--"} in London
            </span>
            <button
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-4">
            {navLinks.map((link) => (
              <a
                className="text-[28px] font-medium leading-8 text-gray-900"
                href={`#${link.toLowerCase()}`}
                key={link}
                onClick={() => setIsOpen(false)}
              >
                {link}
              </a>
            ))}
          </div>
          <a
            className="mt-10 inline-flex w-full items-center justify-between rounded-full bg-gray-900 px-5 py-3 text-[14px] font-medium text-white"
            href="#projects"
            onClick={() => setIsOpen(false)}
          >
            Start a project
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </>
  );
}

function BadgeRow({ number, label, border = "border-gray-200" }: { number: string; label: string; border?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-[11px] font-semibold text-white sm:h-7 sm:w-7 sm:text-[12px]">
        {number}
      </span>
      <span
        className={`rounded-full border ${border} px-3 py-1 text-[12px] font-medium text-gray-900 sm:px-4 sm:py-1.5 sm:text-[13px]`}
      >
        {label}
      </span>
    </div>
  );
}

function HeroSection() {
  return (
    <section
      className="relative flex min-h-screen flex-col overflow-hidden bg-[#EFEFEF]"
      id="hero"
    >
      <ShaderBackground />
      <Navigation />
      <div className="flex-1" />
      <div className="relative z-20 mx-auto w-full max-w-[1440px] px-5 pb-14 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
        <p className="mb-5 text-[13px] leading-[14px] tracking-wide text-gray-900 sm:mb-8">
          Axion Studio
        </p>
        <h1 className="max-w-[1120px] text-[clamp(1.75rem,7vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900 sm:text-[clamp(2.5rem,5vw,4.2rem)]">
          We craft digital experiences
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          for brands ready to dominate
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          their category online.
        </h1>
        <div className="mt-8 flex flex-col gap-4 sm:mt-12 sm:flex-row sm:gap-5">
          <OrangeCta>Start a project</OrangeCta>
          <PartnerBadge />
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="overflow-hidden bg-white pb-12 pt-16 sm:pb-16 sm:pt-20 lg:pb-24 lg:pt-32" id="studio">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="mb-6 px-5 sm:mb-8 sm:px-8 lg:px-12">
          <BadgeRow label="Introducing Axion" number="1" />
        </div>
        <h2 className="mb-12 px-5 text-[clamp(1.5rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-gray-900 sm:mb-16 sm:px-8 lg:mb-28 lg:px-12">
          Strategy-led creatives, delivering
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          results in digital and beyond.
        </h2>

        <div className="px-5 sm:px-8 lg:hidden">
          <div className="mb-8">
            <p className="max-w-[520px] text-[15px] font-medium leading-[1.6] text-gray-900 sm:text-[17px]">
              Through research, creative thinking and iteration we help growing brands realize
              their digital full potential.
            </p>
            <div className="mt-6">
              <OrangeCta>About our studio</OrangeCta>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
            <img
              alt="Axion studio creative process"
              className="aspect-[438/346] w-full rounded-xl object-cover sm:w-[45%] sm:rounded-2xl"
              src={SMALL_IMAGE}
            />
            <img
              alt="Axion studio work session"
              className="aspect-[900/600] w-full rounded-xl object-cover sm:w-[55%] sm:rounded-2xl"
              src={LARGE_IMAGE}
            />
          </div>
        </div>

        <div className="hidden grid-cols-[26%_1fr_48%] items-end gap-6 px-12 lg:grid xl:gap-8">
          <img
            alt="Axion studio creative process"
            className="aspect-[438/346] w-full self-end rounded-2xl object-cover"
            src={SMALL_IMAGE}
          />
          <div className="flex self-start justify-end">
            <div>
              <p className="whitespace-nowrap text-[16px] font-medium leading-[1.65] text-gray-900 xl:text-[18px]">
                Through research, creative thinking and iteration
                <br />
                we help growing brands realize their digital
                <br />
                full potential.
              </p>
              <div className="mt-7">
                <OrangeCta>About our studio</OrangeCta>
              </div>
            </div>
          </div>
          <img
            alt="Axion studio work session"
            className="aspect-[3/2] w-full self-end rounded-2xl object-cover"
            src={LARGE_IMAGE}
          />
        </div>
      </div>
    </section>
  );
}

function LinkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[14px] w-[14px] transition-transform duration-300 ease-in-out group-hover:rotate-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CaseStudiesSection() {
  return (
    <section className="bg-[#F5F5F5] py-16 sm:py-20 lg:py-28" id="projects">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="mb-6 px-5 sm:mb-8 sm:px-8 lg:px-12">
          <BadgeRow border="border-gray-300" label="Featured client work" number="2" />
        </div>
        <h2 className="mb-10 px-5 text-[clamp(1.75rem,7vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900 sm:mb-14 sm:px-8 sm:text-[clamp(2.5rem,5vw,4.2rem)] lg:mb-16 lg:px-12">
          Our projects
        </h2>
        <div className="grid grid-cols-1 gap-5 px-5 sm:gap-6 sm:px-8 md:grid-cols-2 lg:gap-7 lg:px-12">
          <article>
            <div className="group relative aspect-[329/246] cursor-pointer overflow-hidden rounded-2xl bg-[#1a1d2e]">
              <video
                autoPlay
                className="h-full w-full object-cover"
                loop
                muted
                playsInline
                src={NARRATIV_VIDEO}
              />
              <div className="absolute bottom-4 left-4 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white text-gray-900 transition-all duration-300 ease-in-out group-hover:w-[148px]">
                <span className="whitespace-nowrap text-[13px] font-medium opacity-0 transition-opacity delay-100 duration-200 group-hover:opacity-100">
                  Learn more
                </span>
                <span className="absolute right-[11px] -rotate-45 transition-transform duration-300 ease-in-out group-hover:rotate-0">
                  <LinkIcon />
                </span>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-gray-600 sm:text-[14px]">
              Winner of Site of the Month 2025 - an interactive 3D showcase driving record
              engagement
            </p>
            <h3 className="mt-1 text-[14px] font-semibold text-gray-900 sm:text-[15px]">
              Narrativ
            </h3>
          </article>

          <article>
            <div className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-[#6b6b6b]">
              <video
                autoPlay
                className="h-full w-full object-cover"
                loop
                muted
                playsInline
                src={LUMINAR_VIDEO}
              />
              <div className="absolute bottom-4 left-4 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gray-900 text-white transition-all duration-300 ease-in-out group-hover:w-[168px]">
                <span className="whitespace-nowrap text-[13px] font-medium opacity-0 transition-opacity delay-100 duration-200 group-hover:opacity-100">
                  View case study
                </span>
                <ArrowRight
                  className="absolute right-[11px] -rotate-45 transition-transform duration-300 ease-in-out group-hover:rotate-0"
                  size={14}
                />
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-gray-600 sm:text-[14px]">
              Transforming a dated platform into a conversion-focused brand experience
            </p>
            <h3 className="mt-1 text-[14px] font-semibold text-gray-900 sm:text-[15px]">
              Luminar
            </h3>
          </article>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#EFEFEF] text-gray-900">
      <HeroSection />
      <AboutSection />
    </main>
  );
}
