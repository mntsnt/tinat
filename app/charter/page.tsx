import { ArrowLeft, BookOpen, Shield, HeartHandshake, Scale, CheckCircle2 } from "lucide-react";
import { ButtonLink } from "../components/ui/Button";
import { PolicyAcceptanceBanner } from "../components/governance/PolicyAcceptanceBanner";
import { CURRENT_POLICY_VERSIONS } from "@/lib/governance/policies";

export default function ResearchEthicsCharterPage() {
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
            <BookOpen className="w-3.5 h-3.5" />
            Ethical Framework & Charter
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Tinat Research Ethics Charter
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Governance Charter for Observational Health Research in Ethiopia &bull; Version {CURRENT_POLICY_VERSIONS.CHARTER}
          </p>
        </div>

        <PolicyAcceptanceBanner
          policyKey="charter"
          policyName="Research Ethics Charter"
          version={CURRENT_POLICY_VERSIONS.CHARTER}
        />

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-emerald-600" />
            1. Fundamental Ethical Principles
          </h2>
          <p>
            All health research conducted through the Tinat platform must respect human dignity, autonomy, and participant welfare in strict accordance with the Declaration of Helsinki, the Council for International Organizations of Medical Sciences (CIOMS) guidelines, and Ethiopian national research ethics regulations.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">Respect for Autonomy:</strong> Participation is strictly voluntary. Participants must be fully informed through clear, culturally appropriate language and explicit multi-step comprehension gating before consenting.
            </li>
            <li>
              <strong className="text-foreground">Beneficence & Non-Maleficence:</strong> Studies must maximize scientific and community benefit while minimizing any emotional, social, or physical risk. Distress safety protocols must be in place for sensitive research.
            </li>
            <li>
              <strong className="text-foreground">Justice & Fair Selection:</strong> Participant selection must be equitable and free from coercion, exploitation, or discrimination.
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            2. Institutional Ethics Approval Gate
          </h2>
          <p>
            Tinat verification is an administrative review gate designed to confirm protocol compliance and technical safeguards. It does <strong>not</strong> replace formal institutional ethics review.
          </p>
          <div className="p-4 rounded-xl border border-border bg-muted/40 text-foreground space-y-2">
            <p className="font-semibold">Mandatory Review Rules:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Every study requires verified approval from an accredited Institutional Review Board (IRB), National Research Ethics Review Committee (NRERC), or Ethiopian Public Health Institute (EPHI).</li>
              <li>Approval documents must be uploaded and verified before any study can transition to ACTIVE.</li>
              <li>Expired approvals trigger immediate automatic pausing of the study.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            3. Scope Limitations: No Clinical Trials & No Minors
          </h2>
          <p>
            Tinat is dedicated exclusively to observational health research, epidemiological questionnaires, and behavioral public health studies.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>No Clinical Trials:</strong> Investigational medicinal products, vaccines, invasive interventions, and clinical drug trials are strictly prohibited.</li>
            <li><strong>No Minor Recruitment:</strong> Studies directly recruiting or targeting children under 18 years of age are not supported on the platform at this time.</li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            4. Participant Rights & Safety
          </h2>
          <p>
            Every participant retains the unreserved right to withdraw at any time without loss of dignity, penalty, or requirement to provide justification. When sensitive topics are investigated, local helplines (including the Ethiopian National Mental Health line 952 / 6055) must be visible.
          </p>
        </section>
      </div>
    </div>
  );
}
