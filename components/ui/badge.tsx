import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "secondary" | "info" | "outline";
  size?: "sm" | "md";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const variants = {
      default: "bg-muted text-muted-foreground border border-border",
      success: "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20",
      warning: "bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20",
      danger: "bg-destructive/10 text-destructive border border-destructive/20",
      secondary: "bg-primary/10 text-primary border border-primary/20",
      info: "bg-[var(--info)]/10 text-[var(--info)] border border-[var(--info)]/20",
      outline: "bg-transparent text-foreground border border-border",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-[10px]",
      md: "px-2.5 py-0.5 text-xs",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-semibold transition-colors",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
