import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "xlsx";

    const form = await prisma.study.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        responses: {
          include: {
            participant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            answers: true,
          },
          orderBy: { submittedAt: "asc" },
        },
      },
    });

    if (!form || form.category !== "Tinat Form") {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.researcherId !== session.userId) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Build tabular rows
    const rows = form.responses.map((resp, idx) => {
      const row: Record<string, string | number> = {
        "Submission #": idx + 1,
        "Submitted At": new Date(resp.submittedAt).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        "Respondent Name": resp.participant.name || "Guest Respondent",
        "Respondent Type": resp.participant.email.endsWith("@guest.tinat.app") ? "Guest" : "Registered User",
      };

      for (const question of form.questions) {
        const answer = resp.answers.find((a) => a.questionId === question.id);
        const colHeader = question.text;
        if (!answer) {
          row[colHeader] = "";
        } else if (answer.textValue !== null && answer.textValue !== undefined) {
          row[colHeader] = answer.textValue;
        } else if (answer.numberValue !== null && answer.numberValue !== undefined) {
          row[colHeader] = answer.numberValue;
        } else {
          row[colHeader] = "";
        }
      }

      return row;
    });

    const sanitizedTitle = form.title.replace(/[^a-zA-Z0-9_\-]/g, "_").substring(0, 50);

    const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [
      {
        "Submission #": "",
        "Submitted At": "",
        "Respondent Name": "",
        "Respondent Type": "",
        ...form.questions.reduce((acc, q) => ({ ...acc, [q.text]: "" }), {}),
      }
    ]);

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${sanitizedTitle}_responses.csv"`,
        },
      });
    }

    // Default: XLSX
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");

    // Add metadata summary sheet
    const summaryData = [
      { Parameter: "Form Title", Value: form.title },
      { Parameter: "Description", Value: form.description || "N/A" },
      { Parameter: "Total Responses", Value: form.responses.length },
      { Parameter: "Total Questions", Value: form.questions.length },
      { Parameter: "Exported At", Value: new Date().toISOString() },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Overview");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${sanitizedTitle}_responses.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export form responses error:", error);
    return NextResponse.json({ error: "Failed to export responses" }, { status: 500 });
  }
}
