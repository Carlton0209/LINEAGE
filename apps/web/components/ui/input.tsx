import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-border bg-[#0f141b] px-3 text-sm text-foreground",
        "placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
        className
      )}
      {...props}
    />
  );
}
