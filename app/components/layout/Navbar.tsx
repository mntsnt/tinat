import NavContent from "./NavContent";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

// The public landing page navbar strictly and exclusively displays section anchors.
// Calculators and Academy are excluded from this navbar.
const LANDING_NAV_LINKS = [
  { title: "How It Works", href: "/#how-it-works" },
  { title: "Data Collection", href: "/#pathways" },
  { title: "Disciplines", href: "/#disciplines" },
  { title: "FAQ", href: "/#faq" },
];

export async function Navbar() {
  const session = await getSession();
  let user = null;
  if (session?.userId) {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, role: true },
    });
  }

  return <NavContent user={user} links={LANDING_NAV_LINKS} />;
}

