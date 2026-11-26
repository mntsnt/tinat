import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type AcademyPageFrameProps = {
  children: ReactNode;
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  backLink?: {
    href: string;
    label: string;
  };
  actions?: ReactNode;
  contentClassName?: string;
};

export function AcademyPageFrame({
  children,
  title,
  eyebrow,
  description,
  backLink,
  actions,
  contentClassName,
}: AcademyPageFrameProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="@container mx-auto w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        {backLink && (
          <Link
            href={backLink.href}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLink.label}
          </Link>
        )}

        <header className="mb-8 min-w-0 max-w-3xl">
          {eyebrow && (
            <div className="mb-2 text-sm font-medium text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {description && (
            <div className="mt-3 text-base leading-7 text-muted-foreground">
              {description}
            </div>
          )}
          {actions && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {actions}
            </div>
          )}
        </header>

        <div className={`w-full min-w-0 ${contentClassName || ""}`}>{children}</div>
      </main>
    </div>
  );
}
