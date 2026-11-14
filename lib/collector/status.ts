import { prisma } from "@/lib/prisma";

export async function checkIsUserCollector(userId: string): Promise<boolean> {
  const [verification, assignedCount, pendingInvites] = await Promise.all([
    prisma.verification.findUnique({
      where: {
        userId_verificationType: {
          userId,
          verificationType: "DATA_COLLECTOR",
        },
      },
      select: { status: true },
    }),
    prisma.studyDataCollector.count({
      where: { userId },
    }),
    prisma.collectorInvitation.count({
      where: { inviteeId: userId, status: "PENDING" },
    }),
  ]);

  return verification?.status === "VERIFIED" || assignedCount > 0 || pendingInvites > 0;
}
