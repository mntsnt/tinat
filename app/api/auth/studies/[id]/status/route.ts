import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedStatuses = ["ACTIVE", "PAUSED", "COMPLETED"] as const;
type AllowedStatus = (typeof allowedStatuses)[number];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
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
        {
          error: "Only researchers can manage studies.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const body = await request.json();
    const status = body?.status as string;

    if (!allowedStatuses.includes(status as AllowedStatus)) {
      return NextResponse.json(
        { error: "Invalid study status." },
        { status: 400 }
      );
    }

    const study = await prisma.study.findUnique({
      where: {
        id,
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
        {
          error: "You do not have permission to manage this study.",
        },
        { status: 403 }
      );
    }

    if (study.status === "COMPLETED") {
      return NextResponse.json(
        {
          error: "A completed study cannot be changed.",
        },
        { status: 400 }
      );
    }

    if (study.status === "DRAFT" && status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: "A draft study must be activated first.",
        },
        { status: 400 }
      );
    }

    const updatedStudy = await prisma.study.update({
      where: {
        id,
      },
      data: {
        status: status as AllowedStatus,
      },
    });

    return NextResponse.json({
      message: "Study status updated successfully.",
      study: updatedStudy,
    });
  } catch (error) {
    console.error("Study status update error:", error);

    return NextResponse.json(
      {
        error: "Failed to update study status.",
      },
      { status: 500 }
    );
  }
}
