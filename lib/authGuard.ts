import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { prisma } from "./prisma";
import { jsonError } from "./validation";
import { UserRole, ProjectRole } from "@/generated/prisma/enums";
import type {
  UserModel,
  StudyModel,
  ResearchProjectModel,
  ProjectMemberModel,
} from "@/generated/prisma/models";

export type User = UserModel;
export type Study = StudyModel;
export type ResearchProject = ResearchProjectModel;
export type ProjectMember = ProjectMemberModel;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Extracts a JWT session token from either a Request object or Next.js async headers/cookies.
 */
export async function extractToken(req?: Request): Promise<string | null> {
  // 1. Check req headers if provided
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.substring(7).trim();
    }
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)tinat_session=([^;]+)/);
      if (match) return match[1];
    }
  }

  // 2. Check Next.js dynamic cookies()
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("tinat_session")?.value;
    if (token) return token;
  } catch {
    // cookies() unavailable in non-request contexts
  }

  // 3. Check Next.js dynamic headers()
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.substring(7).trim();
    }
  } catch {
    // headers() unavailable
  }

  return null;
}

export type AuthResult<T> =
  | ({ ok: true; user: User } & T)
  | { ok: false; response: NextResponse };

/**
 * Central authentication guard.
 * Deny by default: rejects unauthenticated or invalid tokens.
 */
export async function requireUser(req?: Request): Promise<AuthResult<Record<string, unknown>>> {
  const token = await extractToken(req);
  if (!token) {
    return {
      ok: false,
      response: jsonError("Unauthorized. Please log in.", 401, "UNAUTHORIZED"),
    };
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const userId = payload.userId as string;
    if (!userId) {
      return {
        ok: false,
        response: jsonError("Unauthorized: invalid session payload", 401, "INVALID_TOKEN"),
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        ok: false,
        response: jsonError("Unauthorized: user no longer exists", 401, "USER_NOT_FOUND"),
      };
    }

    return { ok: true, user };
  } catch {
    return {
      ok: false,
      response: jsonError("Unauthorized: invalid or expired session", 401, "INVALID_TOKEN"),
    };
  }
}

/**
 * Requires the authenticated user to possess one of the allowed global roles.
 * Deny by default if user's role does not match.
 */
export async function requireRole(
  allowedRoles: UserRole | UserRole[],
  req?: Request
): Promise<AuthResult<Record<string, unknown>>> {
  const auth = await requireUser(req);
  if (!auth.ok) return auth;

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(auth.user.role)) {
    return {
      ok: false,
      response: jsonError(
        `Forbidden: this action requires one of the following roles: ${roles.join(", ")}`,
        403,
        "FORBIDDEN"
      ),
    };
  }

  return auth;
}

const PROJECT_ROLE_RANKS: Record<ProjectRole, number> = {
  PROJECT_OWNER: 5,
  PRINCIPAL_INVESTIGATOR: 4,
  RESEARCHER: 3,
  DATA_ANALYST: 2,
  RESEARCH_ASSISTANT: 1,
  ADVISOR_VIEWER: 0,
};

export interface ProjectAuthExtra {
  project: ResearchProject;
  member: ProjectMember | null;
  projectRole: ProjectRole;
  isLead: boolean;
  canManageProject: boolean;
}

/**
 * Validates research project membership and role hierarchy.
 * Automatically grants project owner privileges to global ADMINs and Project Leads.
 */
export async function requireProjectMember(
  projectId: string,
  minRole: ProjectRole = ProjectRole.ADVISOR_VIEWER,
  req?: Request
): Promise<AuthResult<ProjectAuthExtra>> {
  const auth = await requireUser(req);
  if (!auth.ok) return auth;

  const project = await prisma.researchProject.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId: auth.user.id },
      },
    },
  });

  if (!project) {
    return {
      ok: false,
      response: jsonError("Research project not found", 404, "NOT_FOUND"),
    };
  }

  const isGlobalAdmin = auth.user.role === UserRole.ADMIN;
  const isLead = project.projectLeadId === auth.user.id;
  const member = project.members[0] || null;

  if (!member && !isLead && !isGlobalAdmin) {
    // If project is public and only viewer access requested, grant read-only
    if (project.visibility === "PUBLIC" && minRole === ProjectRole.ADVISOR_VIEWER) {
      return {
        ok: true,
        user: auth.user,
        project,
        member: null,
        projectRole: ProjectRole.ADVISOR_VIEWER,
        isLead: false,
        canManageProject: false,
      };
    }

    return {
      ok: false,
      response: jsonError(
        "Forbidden: you are not a member of this research project",
        403,
        "FORBIDDEN"
      ),
    };
  }

  const projectRole: ProjectRole = isLead
    ? ProjectRole.PROJECT_OWNER
    : isGlobalAdmin
    ? ProjectRole.PROJECT_OWNER
    : member
    ? member.role
    : ProjectRole.ADVISOR_VIEWER;

  if (PROJECT_ROLE_RANKS[projectRole] < PROJECT_ROLE_RANKS[minRole]) {
    return {
      ok: false,
      response: jsonError(
        `Forbidden: this project operation requires role '${minRole}' or higher. Your role: '${projectRole}'`,
        403,
        "INSUFFICIENT_PROJECT_PERMISSIONS"
      ),
    };
  }

  return {
    ok: true,
    user: auth.user,
    project,
    member,
    projectRole,
    isLead,
    canManageProject: PROJECT_ROLE_RANKS[projectRole] >= PROJECT_ROLE_RANKS.PRINCIPAL_INVESTIGATOR,
  };
}

export interface StudyAuthExtra {
  study: Study;
  isOwner: boolean;
  isAdmin: boolean;
}

/**
 * Validates that a study exists and the user is either the study owner (researcherId) or an ADMIN.
 */
export async function requireStudyOwnerOrAdmin(
  studyId: string,
  req?: Request
): Promise<AuthResult<StudyAuthExtra>> {
  const auth = await requireUser(req);
  if (!auth.ok) return auth;

  const study = await prisma.study.findUnique({
    where: { id: studyId },
  });

  if (!study) {
    return {
      ok: false,
      response: jsonError("Study not found", 404, "NOT_FOUND"),
    };
  }

  const isOwner = study.researcherId === auth.user.id;
  const isAdmin = auth.user.role === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    return {
      ok: false,
      response: jsonError(
        "Forbidden: you are not the owner of this study and not an administrator",
        403,
        "FORBIDDEN"
      ),
    };
  }

  return {
    ok: true,
    user: auth.user,
    study,
    isOwner,
    isAdmin,
  };
}

/**
 * Requires re-authentication for sensitive administrative operations (e.g. approving studies, changing roles).
 * Checks header 'x-admin-reauth-password' or request body 'adminPassword'.
 */
export async function verifyAdminReauth(
  adminUser: User,
  req?: Request,
  body?: any
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  let candidatePassword = req?.headers.get("x-admin-reauth-password");

  if (!candidatePassword && body && typeof body === "object") {
    candidatePassword = body.adminPassword || body.reauthPassword || body.confirmPassword;
  }

  if (!candidatePassword) {
    return {
      ok: false,
      response: jsonError(
        "Admin re-authentication required for this sensitive action. Please supply your password in the 'x-admin-reauth-password' header or 'adminPassword' field.",
        401,
        "REAUTH_REQUIRED"
      ),
    };
  }

  const matches = await bcrypt.compare(candidatePassword, adminUser.passwordHash);
  if (!matches) {
    return {
      ok: false,
      response: jsonError(
        "Invalid re-authentication credentials. Sensitive action aborted.",
        401,
        "REAUTH_FAILED"
      ),
    };
  }

  return { ok: true };
}
