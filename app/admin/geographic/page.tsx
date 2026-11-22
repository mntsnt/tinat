import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { GeographicReachClient } from "./GeographicReachClient";

export const metadata: Metadata = {
  title: "Geographic Reach | Tinat Admin",
  description:
    "Live distribution of Tinat participants, doctors, and health researchers across Ethiopia.",
};

async function safeQuery<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error("Geographic reach query failed:", error);
    return fallback;
  }
}

export default async function GeographicReachPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const admin = await safeQuery(
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    }),
    null
  );
  if (!admin || admin.role !== "ADMIN") redirect("/dashboard");

  const [
    totalUsers,
    participantCount,
    researcherCount,
    collectorCount,
    totalStudies,
    activeStudies,
    totalResponses,
  ] = await Promise.all([
    safeQuery(prisma.user.count(), 0),
    safeQuery(prisma.user.count({ where: { role: "PARTICIPANT" } }), 0),
    safeQuery(prisma.user.count({ where: { role: "RESEARCHER" } }), 0),
    safeQuery(prisma.user.count({ where: { role: "DATA_COLLECTOR" } }), 0),
    safeQuery(prisma.study.count(), 0),
    safeQuery(prisma.study.count({ where: { status: "ACTIVE" } }), 0),
    safeQuery(prisma.response.count(), 0),
  ]);

  return (
    <GeographicReachClient
      totalUsersCount={totalUsers}
      researcherCount={researcherCount}
      collectorCount={collectorCount}
      participantCount={participantCount}
      activeStudiesCount={activeStudies}
      totalResponsesCount={totalResponses}
    />
  );
}
