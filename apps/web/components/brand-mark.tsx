import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-7 w-7",
  md: "h-9 w-9 sm:h-10 sm:w-10",
  lg: "h-12 w-12"
};

export function BrandMark({ className, size = "md" }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-full",
        sizeClasses[size],
        className
      )}
    >
      <Image
        alt=""
        className="block h-full w-full"
        draggable={false}
        height={96}
        src="/lineage-logo-mark.svg"
        unoptimized
        width={96}
      />
    </span>
  );
}
