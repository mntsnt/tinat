import { getSession } from "./auth";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId }
  });
}
