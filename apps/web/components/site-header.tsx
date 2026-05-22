"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  title: string;
  subtitle: string;
  actions?: ReactNode;
};

const navItems = [
  { href: "/", label: "Ledger" },
  { href: "/verify", label: "Verify" }
];

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ title, subtitle, actions = null }: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          LINEAGE
          <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-normal text-foreground">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{subtitle}</p>
      </div>
      <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "text-sm transition-colors duration-200",
                active ? "font-medium text-foreground" : "text-muted hover:text-foreground"
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
