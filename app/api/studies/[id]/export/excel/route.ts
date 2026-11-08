import { NextResponse } from "next/server";
import { requireStudyOwnerOrAdmin } from "@/lib/authGuard";
import { jsonError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activityLog";
import { deidentifyDataset } from "@/lib/export/deidentify";
import * as XLSX from "xlsx";

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
        parentStudy: {
          select: { id: true, title: true, format: true },
        },
        childStudies: {
          where: { linkType: "TINTOK_VERSION" },
          select: { id: true, title: true, format: true },
        },
      },
    });

    if (!study) {
      return jsonError("Study not found.", 404);
    }

    // Prepare raw responses
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

    // Run de-identification engine
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

    // 1. Responses Sheet Data
    const responseSheetData = deidentified.rows.map((row, idx) => ({
      "Record #": idx + 1,
      ...row,
    }));

    // 2. Codebook Sheet Data
    const codebookSheetData = deidentified.codebook.columns.map((col, idx) => ({
      "Col #": idx + 1,
      "Column Header": col.header,
      "Original Question Text": col.originalText || "N/A (System Field)",
      "Data Type": col.type,
      "De-identification Transformations": col.transformations.join(" | "),
    }));

    // 3. Summary & Regulatory Notice Sheet Data
    const summarySheetData = [
      { Parameter: "Study Title", Value: study.title },
      { Parameter: "Study ID", Value: study.id },
      { Parameter: "Study Status", Value: study.status },
      { Parameter: "Total Responses", Value: study.responses.length },
      { Parameter: "Total Questions", Value: study.questions.length },
      { Parameter: "Study Format", Value: study.format },
      { Parameter: "Funding Type", Value: study.fundingType },
      ...(study.parentStudyId ? [{ Parameter: "Linked Parent Study ID", Value: study.parentStudyId }] : []),
      { Parameter: "Small-Cell Threshold (k)", Value: 5 },
      { Parameter: "Cells Suppressed (<5 count)", Value: deidentified.codebook.suppressedCellsCount },
      { Parameter: "Export Timestamp", Value: new Date().toISOString() },
      { Parameter: "Legal Framework", Value: "Ethiopian Personal Data Protection Proclamation 1321/2024" },
      { Parameter: "Regulatory Notice", Value: deidentified.codebook.disclaimer },
    ];

    // Build workbook
    const workbook = XLSX.utils.book_new();

    const responsesSheet = XLSX.utils.json_to_sheet(responseSheetData);
    const codebookSheet = XLSX.utils.json_to_sheet(codebookSheetData);
    const summarySheet = XLSX.utils.json_to_sheet(summarySheetData);

    XLSX.utils.book_append_sheet(workbook, responsesSheet, "De-Identified Responses");
    XLSX.utils.book_append_sheet(workbook, codebookSheet, "Codebook");
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary & Notice");

    // Add Mode Safety README sheet if linked study
    const hasLinkedCounterpart = Boolean(study.parentStudy || (study.childStudies && study.childStudies.length > 0));
    if (hasLinkedCounterpart) {
      const linkedStudyTitle = study.parentStudy ? study.parentStudy.title : study.childStudies[0]?.title || "Linked Study";
      const linkedStudyFormat = study.parentStudy ? "STANDARD (Comprehensive Full Survey)" : "TINTOK (Card-style Micro-survey)";
      const currentStudyFormat = study.format === "TINTOK" ? "TINTOK (Card-style Micro-survey)" : "STANDARD (Comprehensive Full Survey)";

      const modeSafetyNotice = [
        { "Section": "CRITICAL METHODOLOGICAL WARNING", "Detail": "DO NOT POOL OR AUTOMATICALLY MERGE THIS DATASET WITH LINKED STUDIES." },
        { "Section": "Current Study Mode", "Detail": `${study.title} (Mode: ${currentStudyFormat}, ID: ${study.id})` },
        { "Section": "Linked Study", "Detail": `${linkedStudyTitle} (Mode: ${linkedStudyFormat})` },
        { "Section": "Survey Mode Differences", "Detail": "Responses in this file were gathered under a specific interaction format. Card-format micro-surveys and standard long-form surveys induce different cognitive and satisficing response behaviors." },
        { "Section": "Analytical Recommendation", "Detail": "If performing comparative or joint analysis, you MUST model survey mode as an explicit covariate/variable (e.g. mode = 'tintok' vs mode = 'standard')." },
        { "Section": "Pseudonymization & Linkage Safety", "Detail": "Respondent codes (respondentCode) are cryptographically randomized per study space. By privacy-by-design architecture, respondentCode values CANNOT be linked across studies." },
        { "Section": "Ethics & Regulatory Compliance", "Detail": "Both studies operate under independent ethics reviews and consent records. Treating responses as identical without mode control violates research integrity protocols." },
      ];

      const readmeSheet = XLSX.utils.json_to_sheet(modeSafetyNotice);
      XLSX.utils.book_append_sheet(workbook, readmeSheet, "README - Mode Safety");
    }

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Log export in ActivityLog
    const clientIp = getClientIp(request);
    await logActivity({
      userId: auth.user.id,
      action: "STUDY_DATA_EXPORTED",
      description: `User ${auth.user.name} exported ${study.responses.length} responses for study "${study.title}" in Excel format with Codebook.`,
      resourceId: study.id,
      resourceType: "Study",
      metadata: {
        rowCount: study.responses.length,
        format: "EXCEL",
        ip: clientIp,
        timestamp: new Date().toISOString(),
      },
    });

    const filename = `${study.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_deidentified.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Excel export error:", error);
    return NextResponse.json({ error: "Failed to export Excel file." }, { status: 500 });
  }
}
