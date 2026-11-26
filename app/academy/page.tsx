import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/app/components/ui/Button";
import { academyModulesData, learningPaths } from "@/lib/academy/content";
import { AcademyCatalogClient } from "./components/AcademyCatalogClient";
import { AcademyPageFrame } from "./components/AcademyPageFrame";

export const metadata: Metadata = {
  title: "Tinat Academy | Health & Public-Health Research Education",
  description:
    "Open-access courses in health and public-health research methodology, biostatistics, epidemiology, and academic reporting.",
};

export default function AcademyPage() {
  return (
    <AcademyPageFrame
      eyebrow="Tinat Academy · Free and open access"
      title="Learn health research, step by step."
      description="Practical courses in research methods, epidemiology, biostatistics, and academic reporting, with examples grounded in Ethiopia and Africa."
      actions={
        <ButtonLink href="/academy/capstone" variant="outline" className="gap-2">
          Research proposal capstone <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      }
    >
      <section id="catalog" className="scroll-mt-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-tight">Courses</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a module to view its lessons and assessment.
          </p>
        </div>
        <AcademyCatalogClient paths={learningPaths} modules={academyModulesData} />
      </section>
      <p className="border-t border-border pt-5 text-sm text-muted-foreground">
        Ready to apply what you learn?{" "}
        <Link href="/academy/capstone" className="font-medium text-foreground underline underline-offset-4">
          Work through the research proposal capstone
        </Link>
        .
      </p>
    </AcademyPageFrame>
  );
}
