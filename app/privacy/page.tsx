import Link from "next/link";
import { Shield, ArrowLeft, Lock, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/Button";

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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Last Updated: September 13, 2026 &bull; Tinat Health Research Ecosystem
          </p>
        </div>

        {/* Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            1. Overview & Commitment to Health Data Privacy
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tinat ("we", "our", or "the Platform") operates a specialized data collection and research ecosystem for medical, healthcare, and academic studies. We take human subjects research ethics, data privacy, and confidentiality seriously. This Privacy Policy details how we collect, process, store, and safeguard your personal and research data when you use Tinat.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            2. Information We Collect
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">A. Account Information (Direct Registration & Google Sign-In):</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Full name, email address, and optional phone number.</li>
              <li>When signing in with Google OAuth, we only access your public Google profile information (name, email, profile photo). We do not access contacts, Google Drive, or any other Google services.</li>
              <li>Role on the platform (Participant, Researcher, or Administrator).</li>
            </ul>

            <p className="font-semibold text-foreground pt-2">B. Research & Survey Responses:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Responses submitted to questionnaires and medical studies created by researchers.</li>
              <li>Surveys may collect health habits, lifestyle parameters, clinical indicators, or demographic information as directed by specific research study hypotheses.</li>
              <li>Responses are isolated, anonymized when exported, and presented in aggregate or coded format to protect participant confidentiality.</li>
            </ul>

            <p className="font-semibold text-foreground pt-2">C. Transactional & Wallet Records:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Tinat Credit (TC) rewards earned, balances, and funding transaction logs.</li>
            </ul>
          </div>
        </section>

        {/* How We Use Your Data */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            3. How We Use Information
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
            <li>To authenticate user accounts and manage secure sessions.</li>
            <li>To enable researchers to collect and export study responses for academic, scientific, and public health analysis.</li>
            <li>To deliver verification emails and critical account notifications.</li>
            <li>To allocate and disburse study participant reward credits (TC).</li>
            <li>We do <strong>not</strong> sell your personal information or health questionnaire data to advertisers or third-party brokers.</li>
          </ul>
        </section>

        {/* Data Protection & Security */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">
            4. Security and Data Protection
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All user credentials are encrypted using industry-standard bcrypt hashing. Sessions are secured via signed JSON Web Tokens (JWT) transmitted over encrypted HTTPS. Database connections are restricted and isolated behind enterprise database firewalls.
          </p>
        </section>

        {/* Medical Research Disclaimer */}
        <section className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border">
          <h2 className="text-base font-bold text-foreground">
            5. Medical & Health Research Disclaimer
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tinat is a technology platform for health data collection, surveys, and research studies. Tinat is not a healthcare provider and does not provide medical diagnosis, clinical treatment, or medical advice. Participants responding to studies should never use the platform for emergency medical needs or as a substitute for professional medical care.
          </p>
        </section>

        {/* Contact & Data Deletion */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">
            6. Contact & Account Deletion Requests
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have questions about this policy or wish to request the deletion of your account and personal data, please contact the platform administration at:
          </p>
          <p className="text-sm font-semibold text-foreground">
            support@tinat.et &bull; iammintesnot@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}
