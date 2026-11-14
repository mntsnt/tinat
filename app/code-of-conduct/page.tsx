import { ArrowLeft, UserCheck, AlertTriangle, ShieldAlert, Award } from "lucide-react";
import { ButtonLink } from "../components/ui/Button";
import { PolicyAcceptanceBanner } from "../components/governance/PolicyAcceptanceBanner";
import { CURRENT_POLICY_VERSIONS } from "@/lib/governance/policies";

export default function ResearcherCodeOfConductPage() {
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
            <UserCheck className="w-3.5 h-3.5" />
            Researcher Professional Standards
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Researcher Code of Conduct
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Binding Conduct Standards for Health Researchers on Tinat &bull; Version {CURRENT_POLICY_VERSIONS.CODE_OF_CONDUCT}
          </p>
        </div>

        <PolicyAcceptanceBanner
          policyKey="code-of-conduct"
          policyName="Researcher Code of Conduct"
          version={CURRENT_POLICY_VERSIONS.CODE_OF_CONDUCT}
        />

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            1. Scientific Honesty & Protocol Integrity
          </h2>
          <p>
            Researchers using Tinat must uphold the highest standards of scientific rigor and academic honesty:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Submit genuine, unadulterated research instruments and Institutional Review Board (IRB) approvals.</li>
            <li>Do not modify research questions or consent protocols post-approval without notifying Tinat administrators and securing institutional amendment approval.</li>
            <li>Accurately represent the true purpose, institutional affiliation, and scope of data collection.</li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            2. Anti-Re-identification & Data Stewardship
          </h2>
          <p>
            Under Ethiopian Proclamation 1321/2024 and Tinat architectural rules:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>No Re-identification:</strong> Researchers shall never attempt to re-identify participants from pseudonymized respondent codes, exported datasets, or auxiliary demographic indicators.
            </li>
            <li>
              <strong>No Private Link Ingestion:</strong> The internal mapping between National ID (Fayda) / user accounts and respondent codes is strictly air-gapped and unreachable. Any attempt to correlate or reverse-engineer identities constitutes severe misconduct.
            </li>
            <li>
              <strong>Safe Storage & Export:</strong> Exported research files must be stored on encrypted, access-controlled institutional hardware and deleted upon the conclusion of the retention schedule specified in the approved protocol.
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            3. Zero Tolerance for Deceptive Inquiries or Abuse
          </h2>
          <p>
            The following actions result in immediate suspension, protocol revocation, and reporting to institutional authorities:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Soliciting national identity cards, bank account numbers, passwords, or biometrics.</li>
            <li>Promising monetary, cash, or crypto rewards (Tinat Credits are non-cash internal points with zero monetary redemption value).</li>
            <li>Harassing respondents, field data collectors, or platform personnel.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
