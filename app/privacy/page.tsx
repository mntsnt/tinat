import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";
import { PolicyAcceptanceBanner } from "../components/governance/PolicyAcceptanceBanner";
import {
  PLATFORM_DOCUMENT_VERSIONS,
  PRIVACY_NOTICE_SECTIONS,
} from "@/lib/legal/platformDocuments";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" />
            Legal & Data Privacy
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Privacy Notice
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Version {PLATFORM_DOCUMENT_VERSIONS.PRIVACY} &bull; Under Ethiopian Proclamation No. 1321/2024
          </p>
        </div>

        <PolicyAcceptanceBanner
          policyKey="privacy"
          policyName="Privacy Notice"
          version={PLATFORM_DOCUMENT_VERSIONS.PRIVACY}
        />

        {/* Dynamic Source of Truth Sections */}
        {PRIVACY_NOTICE_SECTIONS.map((section) => (
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
