"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/ledger", label: "Ledger" },
  { href: "/verify", label: "Verify" }
];

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

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

function HeaderCta({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="group inline-flex items-center rounded-full bg-ink py-2 pl-5 pr-2 text-[13px] font-medium text-white transition-colors duration-300 hover:bg-[#222]"
      href={href}
    >
      <TextRoll label={label} />
      <span className="ml-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
        <ArrowRight size={12} />
      </span>
    </Link>
  );
}

export function SiteHeader({ title, subtitle, actions = null }: SiteHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const ctaLabel = pathname === "/" ? "See the ledger" : "Open the ledger";

  return (
    <header className="relative z-20">
      <div className="mx-auto w-full max-w-[1440px] p-2 sm:p-3">
        <div className="flex items-center justify-between rounded-full bg-white px-3 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              aria-label="LINEAGE home"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ink sm:h-10 sm:w-10"
              href="/"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            </Link>
            <Link
              className="hidden text-[13px] font-semibold tracking-[0.04em] text-ink sm:inline"
              href="/"
            >
              LINEAGE
            </Link>
            <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
              {navLinks.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative text-[14px] transition-colors duration-300",
                      active ? "font-medium text-ink" : "text-ink hover:text-ink-muted"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                    {active ? (
                      <span className="absolute left-1/2 top-[calc(100%+6px)] h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            <HeaderCta href="/ledger" label={ctaLabel} />
          </div>

          <button
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            type="button"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <button
          aria-label="Close menu backdrop"
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
          type="button"
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 mx-3 mb-3 rounded-2xl bg-white p-6 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            mobileOpen ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="mb-8 flex items-center justify-between">
            <span className="text-[13px] font-semibold tracking-[0.04em] text-ink">LINEAGE</span>
            <button
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white"
              onClick={() => setMobileOpen(false)}
              type="button"
            >
              <X size={18} />
            </button>
          </div>
          <nav className="grid gap-4" aria-label="Mobile primary">
            {navLinks.map((item) => (
              <Link
                className="text-[28px] font-medium leading-8 text-ink"
                href={item.href}
                key={item.href}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-10">
            <HeaderCta href="/ledger" label={ctaLabel} />
          </div>
        </div>
      </div>

      {title || subtitle || actions ? (
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-5 pb-5 pt-4 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
              LINEAGE
              <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            </p>
            {title ? (
              <h1 className="mt-2 font-heading text-3xl font-semibold tracking-normal text-foreground">
                {title}
              </h1>
            ) : null}
            {subtitle ? <p className="mt-2 max-w-2xl text-sm text-muted">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2 md:hidden">{actions}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
