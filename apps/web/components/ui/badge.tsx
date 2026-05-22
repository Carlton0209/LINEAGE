import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-accentMuted px-2 py-1 text-xs text-[#ffb49d]",
        className
      )}
      {...props}
    />
  );
}
