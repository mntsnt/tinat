import NavContent from "./NavContent";
import { getLinksForUser } from "./navLinks";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { checkIsUserCollector } from "@/lib/collector/status";

export async function Navbar() {
  const session = await getSession();
  let user = null;
  let isCollector = false;
  if (session?.userId) {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, role: true },
    });
    if (user?.role === "PARTICIPANT") {
      isCollector = await checkIsUserCollector(session.userId);
    }
  }
  const links = getLinksForUser(user ? { ...user, isCollector } : null);
  return <NavContent user={user} links={links} />;
}
