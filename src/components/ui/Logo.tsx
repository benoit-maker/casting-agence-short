import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-heading font-bold italic text-primary text-2xl select-none",
        className
      )}
    >
      short.
    </span>
  );
}
