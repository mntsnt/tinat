import NavContent from "./NavContent";
import { publicLinks } from "./navLinks";
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

  // Landing page navbar displays clean section anchors; calculators and academy are excluded
  const navbarLinks = publicLinks.filter(
    (link) =>
      link.href !== "/academy" &&
      link.title !== "Tinat Academy" &&
      !link.href.includes("statistical-calculator") &&
      !link.href.includes("sample-size-calculator") &&
      !link.href.startsWith("/research-tools/")
  );

  return <NavContent user={user} links={navbarLinks} />;
}
