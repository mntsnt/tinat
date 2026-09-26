import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProjectWorkspaceClient } from "./ProjectWorkspaceClient";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.userId) {
    const { id } = await params;
    redirect(`/login?redirect=/projects/${id}`);
  }

  const { id } = await params;

  return <ProjectWorkspaceClient projectId={id} currentUserId={session.userId} />;
}
