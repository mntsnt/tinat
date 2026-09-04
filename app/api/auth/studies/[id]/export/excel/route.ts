import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(
  request: Request,
  props: { params?: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
    });

    if (!user || user.role !== "RESEARCHER") {
      return NextResponse.json(
        { error: "Only researchers can export data." },
        { status: 403 }
      );
    }

    const rawParams = props?.params;
    const params = (rawParams
      ? await Promise.resolve(rawParams)
      : {}) as { id?: string };
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Study id is required." },
        { status: 400 }
      );
    }

    const study = await prisma.study.findUnique({
      where: {
        id,
      },
      include: {
        questions: {
          orderBy: {
            order: "asc",
          },
        },
        responses: {
          include: {
            answers: true,
          },
          orderBy: {
            submittedAt: "asc",
          },
        },
      },
    });

    if (!study) {
      return NextResponse.json(
        { error: "Study not found." },
        { status: 404 }
      );
    }

    if (study.researcherId !== user.id) {
      return NextResponse.json(
        { error: "You do not own this study." },
        { status: 403 }
      );
    }

    /*
     * Build response data
     */

    const responseData = study.responses.map(
      (response, index) => {
        const row: Record<string, string | number> = {
          "Response Number": index + 1,
          "Response ID": response.id,
          "Submitted At":
            response.submittedAt.toISOString(),
        };

        study.questions.forEach((question) => {
          const answer = response.answers.find(
            (item) =>
              item.questionId === question.id
          );

          if (!answer) {
            row[question.text] = "";
            return;
          }

          if (answer.numberValue !== null) {
            row[question.text] =
              answer.numberValue;
          } else {
            row[question.text] =
              answer.textValue ?? "";
          }
        });

        return row;
      }
    );

    /*
     * Questions sheet
     */

    const questionsData =
      study.questions.map((question, index) => ({
        Number: index + 1,
        "Question ID": question.id,
        Question: question.text,
        Type: question.type,
        Required: question.required
          ? "Yes"
          : "No",
      }));

    /*
     * Summary sheet
     */

    const summaryData = [
      {
        Field: "Study Title",
        Value: study.title,
      },
      {
        Field: "Description",
        Value: study.description ?? "",
      },
      {
        Field: "Status",
        Value: study.status,
      },
      {
        Field: "Participants",
        Value: study.responses.length,
      },
      {
        Field: "Questions",
        Value: study.questions.length,
      },
      {
        Field: "Reward Per Participant",
        Value: study.rewardCredits,
      },
    ];

    /*
     * Create workbook
     */

    const workbook = XLSX.utils.book_new();

    const responsesSheet =
      XLSX.utils.json_to_sheet(
        responseData
      );

    const questionsSheet =
      XLSX.utils.json_to_sheet(
        questionsData
      );

    const summarySheet =
      XLSX.utils.json_to_sheet(
        summaryData
      );

    XLSX.utils.book_append_sheet(
      workbook,
      responsesSheet,
      "Responses"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      questionsSheet,
      "Questions"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Summary"
    );

    /*
     * Generate Excel file
     */

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    const filename =
      study.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase() +
      "_research.xlsx";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(
      "Excel export error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to export Excel file." },
      { status: 500 }
    );
  }
}