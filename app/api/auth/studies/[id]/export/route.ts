import { NextResponse } from "next/server";
import { getSession } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/prisma";

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
          include: { rows: true },
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
     * CSV columns:
     * Response ID
     * Submission date
     * Question 1
     * Question 2
     * Question 3...
     */

    const headers = [
      "Response ID",
      "Submitted At",
    ];
    study.questions.forEach((question) => {
      if (question.type === "MULTIPLE_CHOICE_GRID" || question.type === "CHECKBOX_GRID") {
        const rows = question.rows || [];
        rows.forEach(r => headers.push(`${question.text} - ${r.text}`));
      } else {
        headers.push(question.text);
      }
    });

    const rows = study.responses.map(
      (response) => {
        const values = [
          response.id,
          response.submittedAt.toISOString(),
        ];

        for (const question of study.questions) {
          const answer = response.answers.find(
            (item) => item.questionId === question.id
          );

          if (question.type === "MULTIPLE_CHOICE_GRID" || question.type === "CHECKBOX_GRID") {
            const parsed = answer?.textValue ? JSON.parse(answer.textValue) : {};
            const rows = question.rows || [];
            rows.forEach(r => {
              const val = parsed[r.value];
              if (Array.isArray(val)) {
                values.push(val.join("; "));
              } else {
                values.push(val ?? "");
              }
            });
          } else {
            let value = "";
            if (answer) {
              if (answer.numberValue !== null) {
                value = String(answer.numberValue);
              } else if (answer.textValue) {
                try {
                  const parsed = JSON.parse(answer.textValue);
                  if (Array.isArray(parsed)) {
                    value = parsed.join("; ");
                  } else {
                    value = answer.textValue;
                  }
                } catch {
                  value = answer.textValue;
                }
              }
            }
            values.push(value);
          }
        }

        return values;
      }
    );

    function escapeCSV(value: string) {
      return `"${value
        .replace(/"/g, '""')
        .replace(/\r?\n/g, " ")}"`;
    }

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) =>
        row.map(escapeCSV).join(",")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${study.title
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}_responses.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);

    return NextResponse.json(
      { error: "Failed to export data." },
      { status: 500 }
    );
  }
}