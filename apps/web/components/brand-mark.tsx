import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  dotClassName?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-7 w-7",
  md: "h-9 w-9 sm:h-10 sm:w-10",
  lg: "h-12 w-12"
};

const dotSizeClasses = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3.5 w-3.5"
};

export function BrandMark({ className, dotClassName, size = "md" }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-ink",
        sizeClasses[size],
        className
      )}
    >
      <span className={cn("rounded-full bg-accent", dotSizeClasses[size], dotClassName)} />
    </span>
  );
}
