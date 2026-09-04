import { NextResponse } from "next/server";
import { getSession } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

export async function GET() {
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

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const withdrawals =
      await prisma.withdrawal.findMany({
        where: {
          status: "PENDING",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              institution: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    return NextResponse.json({
      withdrawals,
    });
  } catch (error) {
    console.error(
      "Admin withdrawals error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load withdrawals.",
      },
      { status: 500 }
    );
  }
}
