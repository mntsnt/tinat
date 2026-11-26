import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAcademyAccess() {
  const session = await getSession();
  if (!session?.userId) {
    return { session: null, user: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      avatarUrl: true,
      isVerified: true,
    },
  });

  return { session, user };
}
