import * as React from "react";
import { cn } from "@/lib/utils";

const GlassPanel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-card dark:bg-card/90", // fallback solid
      "motion-card backdrop-blur-md bg-glass-bg border border-glass-border shadow-glass-shadow rounded-xl",
      className
    )}
    {...props}
  />
));
GlassPanel.displayName = "GlassPanel";

export { GlassPanel };
