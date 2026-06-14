"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  title: string;
  subtitle: string;
  actions?: ReactNode;
};

const navItems: Array<{ href: string; label: string; external?: boolean }> = [
  { href: "/", label: "Home" },
  { href: "/ledger", label: "Ledger" },
  { href: "/verify", label: "Verify" },
  { href: "/inspect", label: "Inspect" }
];

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function TextRoll({ label }: { label: string }) {
  return (
    <span className="h-[20px] overflow-hidden">
      <span className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2">
        <span className="h-[20px] leading-[20px]">{label}</span>
        <span className="h-[20px] leading-[20px]" aria-hidden="true">
          {label}
        </span>
      </span>
    </span>
  );
}

function LedgerCta({ className = "" }: { className?: string }) {
  return (
    <Link
      className={cn(
        "group inline-flex items-center rounded-full bg-ink py-2 pl-5 pr-2 text-[13px] font-medium text-white transition-colors duration-300 hover:bg-[#222]",
        className
      )}
      href="/ledger"
    >
      <TextRoll label="Open the ledger" />
      <span className="ml-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
        <ArrowRight size={12} />
      </span>
    </Link>
  );
}

function LogoMark() {
  return (
    <Link
      aria-label="LINEAGE home"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-ink sm:h-10 sm:w-10"
      href="/"
    >
      <span className="h-2.5 w-2.5 rounded-full bg-accent" />
    </Link>
  );
}

function NavLink({
  href,
  label,
  external = false,
  onClick
}: {
  href: string;
  label: string;
  external?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = !external && isActivePath(pathname, href);
  const content = (
    <span className="relative inline-flex flex-col items-center">
      <span>{label}</span>
      {active ? <span className="absolute top-[calc(100%+6px)] h-1 w-1 rounded-full bg-accent" /> : null}
    </span>
  );

  if (external) {
    return (
      <a
        className="text-sm text-ink transition-colors duration-300 hover:text-ink-muted"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-sm text-ink transition-colors duration-300 hover:text-ink-muted",
        active ? "font-medium" : null
      )}
      href={href}
      onClick={onClick}
    >
      {content}
    </Link>
  );
}

export function SiteHeader({ title, subtitle, actions = null }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="relative z-20 mx-auto w-full max-w-[1440px] p-2 sm:p-3">
      <span className="sr-only">
        {title}. {subtitle}
      </span>
      <div className="flex items-center justify-between rounded-full bg-white px-3 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4 sm:gap-6">
          <LogoMark />
          <span className="hidden text-[13px] font-semibold tracking-[0.04em] text-ink sm:inline">
            LINEAGE
          </span>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                external={item.external}
                href={item.href}
                key={item.href}
                label={item.label}
              />
            ))}
          </nav>
        </div>

        <div className="hidden items-center md:flex">
          <div className="hidden items-center text-[13px] text-ink-muted lg:flex">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-accent" />
            Status: signing service operational
          </div>
          {actions ? <div className="ml-4 hidden items-center gap-2 xl:flex">{actions}</div> : null}
          <LedgerCta className="ml-4" />
        </div>

        <button
          aria-expanded={isOpen}
          aria-label="Open navigation"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white md:hidden"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <Menu size={18} />
        </button>
      </div>

      <div
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <button
          aria-label="Close navigation"
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setIsOpen(false)}
          type="button"
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 mx-3 mb-3 rounded-2xl bg-white p-5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isOpen ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogoMark />
              <span className="text-[13px] font-semibold tracking-[0.04em] text-ink">LINEAGE</span>
            </div>
            <button
              aria-label="Close navigation"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X size={18} />
            </button>
          </div>
          <nav
            className="flex flex-col gap-5 [&_a]:text-[28px] [&_a]:font-medium [&_a]:leading-8"
            aria-label="Mobile primary"
          >
            {navItems.map((item) => (
              <NavLink
                external={item.external}
                href={item.href}
                key={item.href}
                label={item.label}
                onClick={() => setIsOpen(false)}
              />
            ))}
          </nav>
          <LedgerCta className="mt-10 w-full justify-between" />
        </div>
      </div>
    </header>
  );
}
