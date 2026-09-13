import Link from "next/link";
import { ArrowLeft, Scale, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/Button";

export default function TermsOfServicePage() {
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
            <Scale className="w-3.5 h-3.5" />
            Terms & Governance
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Effective Date: September 13, 2026 &bull; Tinat Health Research Ecosystem
          </p>
        </div>

        {/* 1. Acceptance */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">
            1. Acceptance of Terms
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By creating an account or accessing the Tinat research platform ("Tinat", "we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree, you must not use or access the platform.
          </p>
        </section>

        {/* 2. Platform Purpose & Scope */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">
            2. Platform Purpose & Medical Disclaimer
          </h2>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Not Medical or Clinical Advice
            </div>
            <p>
              Tinat is an academic and clinical research data-collection ecosystem. Tinat is not a healthcare provider, clinic, or medical emergency service. Participation in research questionnaires or surveys does not constitute a doctor-patient relationship, diagnosis, or clinical treatment. If you are experiencing a medical emergency, seek immediate professional medical attention.
            </p>
          </div>
        </section>

        {/* 3. Participant Terms */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            3. Participant Guidelines & Informed Consent
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Voluntary Participation:</strong> Participation in any research study, clinical questionnaire, or public health survey is strictly voluntary. You may decline or stop participating at any time prior to submission.
            </li>
            <li>
              <strong>Truthful Responses:</strong> Participants agree to provide accurate, honest, and thoughtful answers to ensure the scientific validity of research data.
            </li>
            <li>
              <strong>Tinat Credits (TC) & Rewards:</strong> Funded studies reward participants with Tinat Credits upon verified completion. Credits may be redeemed or withdrawn according to platform withdrawal guidelines and minimum thresholds. Attempts to submit automated, fraudulent, or multi-account responses will result in immediate forfeiture of balances and account termination.
            </li>
          </ul>
        </section>

        {/* 4. Researcher Terms */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">
            4. Researcher Responsibilities & Ethical Standards
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Institutional Ethics:</strong> Researchers publishing clinical trials, patient cohorts, or health studies represent that their protocols conform to ethical standards (including IRB/IEC reviews where applicable).
            </li>
            <li>
              <strong>Data Confidentiality:</strong> Researchers agree to treat participant responses confidentially and use collected health data solely for scientific, academic, educational, or public health analysis.
            </li>
            <li>
              <strong>Prohibited Content:</strong> Researchers must not solicit personally identifiable medical records (e.g., full government IDs, payment cards) or conduct non-consensual investigations.
            </li>
          </ul>
        </section>

        {/* 5. Account Security */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">
            5. Account Verification & Security
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All users must maintain an accurate, verified email address. You are responsible for safeguarding your login credentials. If you suspect unauthorized access to your account, you must immediately notify platform support.
          </p>
        </section>

        {/* 6. Contact Information */}
        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="text-xl font-bold text-foreground">
            6. Inquiries & Governance
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For questions regarding these Terms of Service or research protocol compliance, contact:
          </p>
          <p className="text-sm font-semibold text-foreground">
            support@tinat.et &bull; iammintesnot@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}
