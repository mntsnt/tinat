import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const verification = await prisma.verification.findUnique({
      where: {
        userId_verificationType: {
          userId: user.id,
          verificationType: "DATA_COLLECTOR"
        }
      }
    });

    if (!verification || verification.status !== "VERIFIED") {
      return NextResponse.json({ error: "Not a verified data collector" }, { status: 403 });
    }

    const assignedStudies = await prisma.studyDataCollector.findMany({
      where: { userId: user.id },
      include: {
        study: {
          select: {
            id: true,
            title: true,
            status: true,
            researcher: { select: { name: true } },
            _count: {
              select: {
                responses: {
                  where: {
                    collectorId: user.id,
                    collectionMethod: "FIELD_COLLECTED"
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ studies: assignedStudies });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
