import NavContent from "./NavContent";
import { getLinksForUser } from "./navLinks";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function Navbar() {
  const session = await getSession();
  let user = null;
  if (session?.userId) {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, role: true },
    });
  }
  const links = getLinksForUser(user);
  return <NavContent user={user} links={links} />;
}
