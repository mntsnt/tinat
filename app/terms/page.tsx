import type { Metadata } from "next";
import { ArrowLeft, Scale } from "lucide-react";
import { ButtonLink } from "../components/ui/Button";
import { PolicyAcceptanceBanner } from "../components/governance/PolicyAcceptanceBanner";
import {
  PLATFORM_DOCUMENT_VERSIONS,
  TERMS_OF_USE_SECTIONS,
} from "@/lib/legal/platformDocuments";

export const metadata: Metadata = {
  title: "Terms of Use | Tinat",
  description: "Review the current Tinat Terms of Use, including their legal-review status.",
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
      <div className="mb-8">
        <ButtonLink href="/" variant="ghost" size="sm" className="gap-2 text-xs">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </ButtonLink>
      </div>

      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3">
            <Scale className="w-3.5 h-3.5" />
            Terms & Governance
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Terms of Use
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Version {PLATFORM_DOCUMENT_VERSIONS.TERMS} &bull; Tinat Health Research Ecosystem
          </p>
        </div>

        <PolicyAcceptanceBanner
          policyKey="terms"
          policyName="Terms of Use"
          version={PLATFORM_DOCUMENT_VERSIONS.TERMS}
        />

        {/* Dynamic Source of Truth Sections */}
        {TERMS_OF_USE_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">
              {section.title}
            </h2>
            {section.paragraphs.map((p, idx) => (
              <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
                {p}
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 && (
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
                {section.bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
