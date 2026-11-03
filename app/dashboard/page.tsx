import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { checkPlatformConsent } from "@/lib/legal/consentService";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const consent = await checkPlatformConsent(session.userId);
  if (!consent.hasValidConsent) {
    redirect("/agreement?redirect=/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      role: true,
      email: true,
      isVerified: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (!user.isVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

  if (user.role === "RESEARCHER") {
    redirect("/researcher");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/participant");
}