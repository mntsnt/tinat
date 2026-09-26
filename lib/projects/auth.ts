import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectRole } from "@/generated/prisma/enums";

export interface ProjectAuthContext {
  userId: string;
  userRole: string; // Tinat global role (RESEARCHER, PARTICIPANT, ADMIN)
  projectId: string;
  projectRole: ProjectRole;
  isLead: boolean;
  canManageProject: boolean;
  canManageTeam: boolean;
  canEditTasks: boolean;
  canUploadFiles: boolean;
  canAccessHealthData: boolean;
  canMakeDecisions: boolean;
  canManageStudies: boolean;
}

export async function authorizeProjectAccess(
  projectId: string
): Promise<{ auth: ProjectAuthContext | null; error?: string; status?: number }> {
  const session = await getSession();
  if (!session) {
    return { auth: null, error: "Unauthorized. Please sign in.", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, name: true, email: true },
  });

  if (!user) {
    return { auth: null, error: "User not found.", status: 401 };
  }

  const project = await prisma.researchProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      projectLeadId: true,
      visibility: true,
      isArchived: true,
      members: {
        where: { userId: user.id },
        select: { role: true, customPermissions: true },
      },
    },
  });

  if (!project) {
    return { auth: null, error: "Research project not found.", status: 404 };
  }

  const isGlobalAdmin = user.role === "ADMIN";
  const isLead = project.projectLeadId === user.id;
  const memberRecord = project.members[0];

  // If not a member, not the lead, and not admin:
  if (!memberRecord && !isLead && !isGlobalAdmin) {
    return {
      auth: null,
      error: "You are not a member of this research project workspace.",
      status: 403,
    };
  }

  const projectRole: ProjectRole = isLead
    ? ProjectRole.PROJECT_OWNER
    : memberRecord
    ? memberRecord.role
    : isGlobalAdmin
    ? ProjectRole.PRINCIPAL_INVESTIGATOR
    : ProjectRole.ADVISOR_VIEWER;

  const canManageProject =
    projectRole === ProjectRole.PROJECT_OWNER ||
    projectRole === ProjectRole.PRINCIPAL_INVESTIGATOR ||
    isGlobalAdmin;

  const canManageTeam = canManageProject;

  const canEditTasks =
    canManageProject ||
    projectRole === ProjectRole.RESEARCHER ||
    projectRole === ProjectRole.DATA_ANALYST ||
    projectRole === ProjectRole.RESEARCH_ASSISTANT;

  const canUploadFiles = canEditTasks;

  // Strict Healthcare Data Privacy:
  // Research Assistants and Viewers do NOT have unrestricted access to sensitive/identifiable health datasets
  const canAccessHealthData =
    canManageProject || projectRole === ProjectRole.DATA_ANALYST;

  const canMakeDecisions =
    canManageProject || projectRole === ProjectRole.RESEARCHER;

  const canManageStudies = canManageProject;

  return {
    auth: {
      userId: user.id,
      userRole: user.role,
      projectId: project.id,
      projectRole,
      isLead,
      canManageProject,
      canManageTeam,
      canEditTasks,
      canUploadFiles,
      canAccessHealthData,
      canMakeDecisions,
      canManageStudies,
    },
  };
}

export async function logProjectActivity(params: {
  projectId: string;
  userId: string;
  action: string;
  description: string;
  metadata?: any;
}) {
  try {
    await prisma.projectActivity.create({
      data: {
        projectId: params.projectId,
        userId: params.userId,
        action: params.action,
        description: params.description,
        metadata: params.metadata || null,
      },
    });
  } catch (error) {
    console.error("Failed to log project activity:", error);
  }
}
