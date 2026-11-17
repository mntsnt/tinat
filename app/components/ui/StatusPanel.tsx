import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

type StatusTone = "error" | "warning" | "success" | "info";

const toneStyles: Record<
  StatusTone,
  { icon: LucideIcon; iconClass: string; badgeClass: string; borderClass: string }
> = {
  error: {
    icon: AlertCircle,
    iconClass: "bg-destructive/10 text-destructive",
    badgeClass: "bg-destructive/10 text-destructive",
    borderClass: "border-destructive/20",
  },
  warning: {
    icon: TriangleAlert,
    iconClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    borderClass: "border-amber-500/25",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-500/25",
  },
  info: {
    icon: Info,
    iconClass: "bg-primary/10 text-primary",
    badgeClass: "bg-primary/10 text-primary",
    borderClass: "border-primary/20",
  },
};

export function StatusPanel({
  tone = "info",
  eyebrow,
  title,
  description,
  reference,
  children,
}: {
  tone?: StatusTone;
  eyebrow: string;
  title: string;
  description: string;
  reference?: string;
  children?: ReactNode;
}) {
  const style = toneStyles[tone];
  const Icon = style.icon;

  return (
    <div className="flex min-h-[55vh] items-center justify-center px-4 py-10">
      <section
        role={tone === "error" ? "alert" : "status"}
        aria-labelledby="status-panel-title"
        className={`w-full max-w-xl overflow-hidden rounded-2xl border ${style.borderClass} bg-card shadow-sm`}
      >
        <div className="h-1 w-full bg-primary/70" />
        <div className="px-6 py-8 text-center sm:px-10 sm:py-10">
          <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${style.iconClass}`}>
            <Icon className="h-6 w-6" />
          </span>
          <p className={`mx-auto mt-5 w-fit rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${style.badgeClass}`}>
            {eyebrow}
          </p>
          <h1 id="status-panel-title" className="mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          {reference && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/60 px-3.5 py-1 text-xs text-muted-foreground shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium">Tracking Code:</span>
              <code className="font-mono font-semibold text-foreground">{reference}</code>
            </div>
          )}
          {children && (
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              {children}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
