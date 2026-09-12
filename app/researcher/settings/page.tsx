import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import SettingsPage from "../../components/SettingsPage";

export default async function ResearcherSettings() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, bio: true, institution: true, fieldOfStudy: true, role: true, email: true, phone: true, id: true, createdAt: true, isVerified: true },
  });

  if (!user || user.role !== "RESEARCHER") redirect("/dashboard");

  return <SettingsPage user={user} />;
}
