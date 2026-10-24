import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await req.json();
    const { answers, respondentName } = body;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Answers payload is required" }, { status: 400 });
    }

    const form = await prisma.study.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!form || form.category !== "Tinat Form") {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This form is closed and is no longer accepting responses." },
        { status: 400 }
      );
    }

    // Validate required questions
    for (const q of form.questions) {
      if (q.required) {
        const val = answers[q.id];
        const isEmpty =
          val === undefined ||
          val === null ||
          (typeof val === "string" && val.trim() === "") ||
          (Array.isArray(val) && val.length === 0);

        if (isEmpty) {
          return NextResponse.json(
            { error: `Question "${q.text}" is required.` },
            { status: 400 }
          );
        }
      }
    }

    // Determine participant ID
    const session = await getSession();
    let participantId: string;
    let isGuest = false;

    if (session?.userId) {
      // Authenticated user
      participantId = session.userId;

      // Check if existing response
      const existing = await prisma.response.findUnique({
        where: {
          studyId_participantId: {
            studyId: form.id,
            participantId,
          },
        },
        include: { answers: true },
      });

      if (existing) {
        // Update existing submission
        await prisma.$transaction(async (tx) => {
          // Delete old answers
          await tx.answer.deleteMany({
            where: { responseId: existing.id },
          });

          // Insert updated answers
          for (const q of form.questions) {
            const rawVal = answers[q.id];
            if (rawVal === undefined || rawVal === null || rawVal === "") continue;

            let textValue: string | null = null;
            let numberValue: number | null = null;

            if (Array.isArray(rawVal)) {
              textValue = rawVal.join(", ");
            } else if (typeof rawVal === "number") {
              numberValue = rawVal;
              textValue = String(rawVal);
            } else if (typeof rawVal === "boolean") {
              textValue = rawVal ? "Yes" : "No";
            } else {
              textValue = String(rawVal).trim();
              const parsedNum = Number(textValue);
              if (!isNaN(parsedNum) && (q.type === "NUMBER" || q.type === "LINEAR_SCALE")) {
                numberValue = parsedNum;
              }
            }

            await tx.answer.create({
              data: {
                responseId: existing.id,
                questionId: q.id,
                textValue,
                numberValue,
              },
            });
          }

          await tx.response.update({
            where: { id: existing.id },
            data: { submittedAt: new Date() },
          });
        });

        return NextResponse.json({
          success: true,
          responseId: existing.id,
          updated: true,
          isGuest: false,
        });
      }
    } else {
      // Guest respondent without sign-in
      isGuest = true;
      const guestSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const guestUser = await prisma.user.create({
        data: {
          name: respondentName?.trim() || "Guest Respondent",
          email: `guest_${guestSuffix}@guest.tinat.app`,
          passwordHash: "GUEST_USER_NO_LOGIN",
          role: "PARTICIPANT",
          isVerified: false,
        },
      });
      participantId = guestUser.id;
    }

    // Create fresh response
    const createdResponse = await prisma.$transaction(async (tx) => {
      const resp = await tx.response.create({
        data: {
          studyId: form.id,
          participantId,
          collectionMethod: "SELF",
        },
      });

      for (const q of form.questions) {
        const rawVal = answers[q.id];
        if (rawVal === undefined || rawVal === null || rawVal === "") continue;

        let textValue: string | null = null;
        let numberValue: number | null = null;

        if (Array.isArray(rawVal)) {
          textValue = rawVal.join(", ");
        } else if (typeof rawVal === "number") {
          numberValue = rawVal;
          textValue = String(rawVal);
        } else if (typeof rawVal === "boolean") {
          textValue = rawVal ? "Yes" : "No";
        } else {
          textValue = String(rawVal).trim();
          const parsedNum = Number(textValue);
          if (!isNaN(parsedNum) && (q.type === "NUMBER" || q.type === "LINEAR_SCALE")) {
            numberValue = parsedNum;
          }
        }

        await tx.answer.create({
          data: {
            responseId: resp.id,
            questionId: q.id,
            textValue,
            numberValue,
          },
        });
      }

      return resp;
    });

    return NextResponse.json({
      success: true,
      responseId: createdResponse.id,
      isGuest,
    });
  } catch (error) {
    console.error("Submit form response error:", error);
    return NextResponse.json({ error: "Failed to submit response." }, { status: 500 });
  }
}
