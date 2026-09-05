"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function toggleBookmark(studyId: string) {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  const existing = await prisma.studyBookmark.findUnique({
    where: {
      userId_studyId: {
        userId: session.userId,
        studyId: studyId,
      },
    },
  });

  if (existing) {
    await prisma.studyBookmark.delete({
      where: {
        id: existing.id,
      },
    });
  } else {
    await prisma.studyBookmark.create({
      data: {
        userId: session.userId,
        studyId: studyId,
      },
    });
  }

  revalidatePath("/participant");
  revalidatePath("/participant/studies");
  revalidatePath(`/participant/studies/${studyId}`);
}
