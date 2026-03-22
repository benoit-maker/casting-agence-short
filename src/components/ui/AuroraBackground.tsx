"use client";

import { cn } from "@/lib/utils";
import React, { type ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col min-h-screen items-center justify-center bg-bg text-dark transition-all",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            `
            [--aurora:repeating-linear-gradient(100deg,#665DFF_10%,#8B83FF_15%,#4A42E0_20%,#023475_25%,#665DFF_30%,#4A42E0_35%,#8B83FF_40%)]
            [background-image:var(--aurora)]
            [background-size:200%]
            [background-position:50%_50%]
            filter blur-[60px]
            animate-aurora
            pointer-events-none
            absolute -inset-[10px] opacity-20 will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
          )}
        />
      </div>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
