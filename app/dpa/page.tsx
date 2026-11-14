import { ArrowLeft, FileText, Database, Lock, EyeOff, ShieldCheck } from "lucide-react";
import { ButtonLink } from "../components/ui/Button";
import { PolicyAcceptanceBanner } from "../components/governance/PolicyAcceptanceBanner";
import { CURRENT_POLICY_VERSIONS } from "@/lib/governance/policies";

export default function DataProcessingAgreementPage() {
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
            <FileText className="w-3.5 h-3.5" />
            Data Protection Standard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Data Processing Agreement (DPA)
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Standard Contractual Clauses under Ethiopian Proclamation No. 1321/2024 &bull; Version {CURRENT_POLICY_VERSIONS.DPA}
          </p>
        </div>

        <PolicyAcceptanceBanner
          policyKey="dpa"
          policyName="Data Processing Agreement"
          version={CURRENT_POLICY_VERSIONS.DPA}
        />

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            1. Roles of Parties & Statutory Framework
          </h2>
          <p>
            This Data Processing Agreement governs the processing of personal and health research data between the <strong>Researcher / Research Institution</strong> (acting as the <em>Data Controller</em>) and <strong>Tinat Health Research Ecosystem</strong> (acting as the <em>Data Processor</em>), in compliance with the Ethiopian Personal Data Protection Proclamation No. 1321/2024.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-emerald-600" />
            2. Pseudonymization & Cryptographic Separation
          </h2>
          <p>
            In fulfillment of Article 24 and data security requirements of Proclamation 1321/2024:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Respondent Code Isolation:</strong> Tinat strictly decouples participant identity (including National ID / Fayda references) from research survey responses through non-reversible, randomly minted respondent codes.
            </li>
            <li>
              <strong>Access Restrictions:</strong> The Data Controller shall have access only to de-identified respondent responses and export artifacts stripped of direct identifiers, IP hashes, device fingerprints, and low-count quasi-identifiers.
            </li>
            <li>
              <strong>Participant Rights Fulfillment:</strong> If a data subject exercises their right to erasure or withdrawal, Tinat shall purge all related response records from active analysis pipelines and notify the Controller.
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            3. Security Measures & Breach Notification
          </h2>
          <p>
            Tinat maintains technical and organizational measures, including TLS 1.3 encryption in transit, AES-256 encryption at rest, append-only audit logs, and role-based access control.
          </p>
          <p>
            In the event of a verified personal data breach impacting research datasets, the Data Processor shall notify affected Data Controllers and the Ethiopian Personal Data Protection Authority within 72 hours of confirmation, in accordance with national statutory timelines.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            4. Audit & Regulatory Oversight
          </h2>
          <p>
            The Data Processor maintains comprehensive activity logs of every export, de-identification transformation, and administrative access event, making audit summaries available upon regulatory inspection.
          </p>
        </section>
      </div>
    </div>
  );
}
