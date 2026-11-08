import { NextResponse } from "next/server";
import { requireStudyOwnerOrAdmin } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activityLog";
import { deidentifyDataset } from "@/lib/export/deidentify";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    if (!id) {
      return jsonError("Study id is required.", 400);
    }
    const auth = await requireStudyOwnerOrAdmin(id, request);
    if (!auth.ok) return auth.response;

    const study = await prisma.study.findUnique({
      where: { id },
      include: {
        questions: {
          include: { rows: true, options: true },
          orderBy: { order: "asc" },
        },
        responses: {
          include: { answers: true },
          orderBy: { submittedAt: "asc" },
        },
        childStudies: {
          where: { linkType: "TINTOK_VERSION" },
          select: { id: true },
        },
      },
    });

    if (!study) {
      return jsonError("Study not found.", 404);
    }

    // Format raw responses for de-identification engine
    const rawResponses = study.responses.map((resp) => {
      const answersMap: Record<string, string | number | null> = {};
      for (const ans of resp.answers) {
        if (ans.numberValue !== null) {
          answersMap[ans.questionId] = ans.numberValue;
        } else if (ans.textValue) {
          try {
            const parsed = JSON.parse(ans.textValue);
            answersMap[ans.questionId] = Array.isArray(parsed) ? parsed.join("; ") : ans.textValue;
          } catch {
            answersMap[ans.questionId] = ans.textValue;
          }
        }
      }
      return {
        id: resp.id,
        respondentCode: resp.respondentCode,
        submittedAt: resp.submittedAt,
        answers: answersMap,
      };
    });

    // Run through De-identification Engine
    const deidentified = deidentifyDataset({
      study: { id: study.id, title: study.title, objective: study.objective },
      questions: study.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
        rows: q.rows,
      })),
      responses: rawResponses,
      options: { minCellSize: 5, generalizeGeography: true, bandAges: true },
    });

    function escapeCSV(value: string | number) {
      const str = String(value ?? "");
      return `"${str.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    }

    // Generate CSV with embedded Codebook comments
    const codebookComments = [
      `# ==============================================================================`,
      `# TINAT DE-IDENTIFIED DATA EXPORT & CODEBOOK`,
      `# Study Title: ${study.title}`,
      `# Study ID: ${study.id}`,
      `# Total Responses: ${study.responses.length}`,
      `# Generated At: ${new Date().toISOString()}`,
      `# Privacy Regulation: Ethiopian Personal Data Protection Proclamation 1321/2024`,
      `# De-identification Rules:`,
      `#  1. Direct Identifiers: Names, emails, phones, user IDs, Fayda IDs, and IP/fingerprints removed.`,
      `#  2. Pseudonymization: Coded with secure, random Respondent Codes.`,
      `#  3. Age Banding: Numerical ages grouped into discrete demographic brackets.`,
      `#  4. Small-Cell Suppression: Categories with count < 5 suppressed to prevent re-identification.`,
      `#  5. Free-Text Notice: Columns marked [FREE_TEXT_NEEDS_REVIEW] require manual review prior to release.`,
      ...(study.parentStudyId || (study.childStudies && study.childStudies.length > 0)
        ? [
            `# ------------------------------------------------------------------------------`,
            `# CRITICAL METHODOLOGICAL NOTICE - LINKED STUDY DATASET:`,
            `# DO NOT POOL OR AUTOMATICALLY MERGE THIS DATASET WITH LINKED STUDIES.`,
            `# This study was collected in ${study.format} mode. Responses reflect mode-specific interaction.`,
            `# Model survey mode as an explicit covariate in joint analysis.`,
            `# Respondent codes are non-linkable across studies by privacy-by-design architecture.`,
            `# ------------------------------------------------------------------------------`,
          ]
        : []),
      `# ==============================================================================`,
    ];

    const csvContent = [
      ...codebookComments,
      deidentified.headers.map(escapeCSV).join(","),
      ...deidentified.rows.map((row) =>
        deidentified.headers.map((h) => escapeCSV(row[h] ?? "")).join(",")
      ),
    ].join("\n");

    // Log export in ActivityLog
    const clientIp = getClientIp(request);
    await logActivity({
      userId: auth.user.id,
      action: "STUDY_DATA_EXPORTED",
      description: `User ${auth.user.name} exported ${study.responses.length} responses for study "${study.title}" in CSV format.`,
      resourceId: study.id,
      resourceType: "Study",
      metadata: {
        rowCount: study.responses.length,
        format: "CSV",
        ip: clientIp,
        timestamp: new Date().toISOString(),
      },
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${study.title
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}_deidentified.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json({ error: "Failed to export data." }, { status: 500 });
  }
}
