import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

process.env.AUTH_SECRET = process.env.AUTH_SECRET || "tinat-auth-secret-for-matrix-tests-min-32-chars!";
(process.env as Record<string, string>).NODE_ENV = "test";
import { SignJWT } from 'jose';
import { prisma } from '../lib/prisma';
import { UserRole } from '@/generated/prisma/enums';

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

async function makeToken(userId: string) {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(getSecretKey());
}

export type RoleCategory = 'anonymous' | 'participant' | 'researcher_owner' | 'researcher_other' | 'collector' | 'admin';

interface MatrixRule {
  anonymous: number[];
  participant: number[];
  researcher_owner: number[];
  researcher_other: number[];
  collector: number[];
  admin: number[];
}

// Full declarative test matrix
export const ROUTE_AUTH_MATRIX: Record<string, MatrixRule> = {
  // Public / Auth routes
  "POST /api/auth/login": {
    anonymous: [400, 401],
    participant: [400, 401],
    researcher_owner: [400, 401],
    researcher_other: [400, 401],
    collector: [400, 401],
    admin: [400, 401]
  },
  "POST /api/auth/register": {
    anonymous: [400],
    participant: [400],
    researcher_owner: [400],
    researcher_other: [400],
    collector: [400],
    admin: [400]
  },
  "POST /api/auth/logout": {
    anonymous: [200],
    participant: [200],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [200],
    admin: [200]
  },
  "POST /api/auth/resend-verification": {
    anonymous: [400, 404],
    participant: [400, 404],
    researcher_owner: [400, 404],
    researcher_other: [400, 404],
    collector: [400, 404],
    admin: [400, 404]
  },
  "GET /api/auth/verify-email": {
    anonymous: [307, 308, 400],
    participant: [307, 308, 400],
    researcher_owner: [307, 308, 400],
    researcher_other: [307, 308, 400],
    collector: [307, 308, 400],
    admin: [307, 308, 400]
  },
  "POST /api/auth/verify-email": {
    anonymous: [400],
    participant: [400],
    researcher_owner: [400],
    researcher_other: [400],
    collector: [400],
    admin: [400]
  },
  "GET /api/auth/google": {
    anonymous: [302, 307],
    participant: [302, 307],
    researcher_owner: [302, 307],
    researcher_other: [302, 307],
    collector: [302, 307],
    admin: [302, 307]
  },
  "GET /api/auth/callback/google": {
    anonymous: [302, 307, 400],
    participant: [302, 307, 400],
    researcher_owner: [302, 307, 400],
    researcher_other: [302, 307, 400],
    collector: [302, 307, 400],
    admin: [302, 307, 400]
  },
  "GET /api/auth/payments/chapa/callback": {
    anonymous: [403, 503],
    participant: [403, 503],
    researcher_owner: [403, 503],
    researcher_other: [403, 503],
    collector: [403, 503],
    admin: [403, 503]
  },
  "POST /api/auth/fayda-preview": {
    anonymous: [400],
    participant: [400],
    researcher_owner: [400],
    researcher_other: [400],
    collector: [400],
    admin: [400]
  },
  "GET /api/auth/fayda-verify": {
    anonymous: [400],
    participant: [400],
    researcher_owner: [400],
    researcher_other: [400],
    collector: [400],
    admin: [400]
  },
  "POST /api/auth/fayda-verify": {
    anonymous: [400],
    participant: [400],
    researcher_owner: [400],
    researcher_other: [400],
    collector: [400],
    admin: [400]
  },
  "GET /api/f/[id]": {
    anonymous: [200, 404],
    participant: [200, 404],
    researcher_owner: [200, 404],
    researcher_other: [200, 404],
    collector: [200, 404],
    admin: [200, 404]
  },
  "POST /api/f/[id]/submit": {
    anonymous: [400, 404],
    participant: [400, 404],
    researcher_owner: [400, 404],
    researcher_other: [400, 404],
    collector: [400, 404],
    admin: [400, 404]
  },

  // Legacy Redirects
  "PATCH /api/auth/admin/studies/[id]/status": {
    anonymous: [308, 307],
    participant: [308, 307],
    researcher_owner: [308, 307],
    researcher_other: [308, 307],
    collector: [308, 307],
    admin: [308, 307]
  },
  "GET /api/auth/studies": {
    anonymous: [308, 307],
    participant: [308, 307],
    researcher_owner: [308, 307],
    researcher_other: [308, 307],
    collector: [308, 307],
    admin: [308, 307]
  },
  "POST /api/auth/studies": {
    anonymous: [308, 307],
    participant: [308, 307],
    researcher_owner: [308, 307],
    researcher_other: [308, 307],
    collector: [308, 307],
    admin: [308, 307]
  },
  "POST /api/auth/studies/[id]/comment": {
    anonymous: [308, 307],
    participant: [308, 307],
    researcher_owner: [308, 307],
    researcher_other: [308, 307],
    collector: [308, 307],
    admin: [308, 307]
  },
  "GET /api/auth/studies/[id]/export": {
    anonymous: [308, 307],
    participant: [308, 307],
    researcher_owner: [308, 307],
    researcher_other: [308, 307],
    collector: [308, 307],
    admin: [308, 307]
  },
  "GET /api/auth/studies/[id]/export/excel": {
    anonymous: [308, 307],
    participant: [308, 307],
    researcher_owner: [308, 307],
    researcher_other: [308, 307],
    collector: [308, 307],
    admin: [308, 307]
  },
  "POST /api/auth/studies/[id]/fund": {
    anonymous: [308, 307],
    participant: [308, 307],
    researcher_owner: [308, 307],
    researcher_other: [308, 307],
    collector: [308, 307],
    admin: [308, 307]
  },
  "POST /api/auth/studies/[id]/like": {
    anonymous: [308, 307],
    participant: [308, 307],
    researcher_owner: [308, 307],
    researcher_other: [308, 307],
    collector: [308, 307],
    admin: [308, 307]
  },
  "POST /api/auth/studies/[id]/rate": {
    anonymous: [308, 307],
    participant: [308, 307],
    researcher_owner: [308, 307],
    researcher_other: [308, 307],
    collector: [308, 307],
    admin: [308, 307]
  },
  "PATCH /api/auth/studies/[id]/status": {
    anonymous: [308, 307],
    participant: [308, 307],
    researcher_owner: [308, 307],
    researcher_other: [308, 307],
    collector: [308, 307],
    admin: [308, 307]
  },
  "POST /api/auth/studies/[id]/submit": {
    anonymous: [308, 307],
    participant: [308, 307],
    researcher_owner: [308, 307],
    researcher_other: [308, 307],
    collector: [308, 307],
    admin: [308, 307]
  },

  // Admin Routes
  "GET /api/admin/incidents": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/admin/incidents": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [201, 400]
  },
  "PATCH /api/admin/incidents/[id]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "POST /api/admin/investigations/resolve-respondent": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "GET /api/user/dsr/export": {
    anonymous: [401],
    participant: [200],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [200],
    admin: [200]
  },
  "PUT /api/user/dsr/profile": {
    anonymous: [401],
    participant: [200, 400],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [200, 400],
    admin: [200, 400]
  },
  "POST /api/user/dsr/delete": {
    anonymous: [401],
    participant: [200, 400],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [200, 400],
    admin: [200, 400]
  },
  "POST /api/user/dsr/consent": {
    anonymous: [401],
    participant: [200, 400],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [200, 400],
    admin: [200, 400]
  },
  "GET /api/user/dsr/requests": {
    anonymous: [401],
    participant: [200],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [200],
    admin: [200]
  },
  "GET /api/admin/chat/members": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "GET /api/admin/chat/messages": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/admin/chat/messages": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [400, 201]
  },
  "GET /api/admin/dashboard/stats": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "GET /api/admin/logs": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "GET /api/admin/studies": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "GET /api/admin/studies/[id]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "PATCH /api/admin/studies/[id]/status": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [400, 401]
  },
  "GET /api/admin/users": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "GET /api/admin/users/[id]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "PATCH /api/admin/users/[id]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 401, 404]
  },
  "GET /api/admin/verifications": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "PATCH /api/admin/verifications/[id]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [400, 401, 404]
  },
  "GET /api/auth/admin/withdrawals": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "PATCH /api/auth/admin/withdrawals/[id]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [403] // WITHDRAWALS_PAUSED
  },

  // User / Settings / Avatar / Withdrawals
  "POST /api/auth/avatar": {
    anonymous: [401],
    participant: [200, 400],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [200, 400],
    admin: [200, 400]
  },
  "DELETE /api/auth/avatar": {
    anonymous: [401],
    participant: [200],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [200],
    admin: [200]
  },
  "PATCH /api/auth/settings": {
    anonymous: [401],
    participant: [200, 400],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [200, 400],
    admin: [200, 400]
  },
  "POST /api/auth/withdrawals": {
    anonymous: [401],
    participant: [403], // WITHDRAWALS_DISABLED
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [403]
  },

  // Ask / Profile
  "GET /api/ask/profile": {
    anonymous: [401],
    participant: [200, 404],
    researcher_owner: [200, 404],
    researcher_other: [200, 404],
    collector: [200, 404],
    admin: [200, 404]
  },
  "POST /api/ask/profile": {
    anonymous: [401],
    participant: [200, 400],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [200, 400],
    admin: [200, 400]
  },
  "DELETE /api/ask/profile": {
    anonymous: [401],
    participant: [200, 404],
    researcher_owner: [200, 404],
    researcher_other: [200, 404],
    collector: [200, 404],
    admin: [200, 404]
  },
  "GET /api/ask/questions": {
    anonymous: [401],
    participant: [200],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [200],
    admin: [200]
  },
  "PATCH /api/ask/questions/[id]": {
    anonymous: [401],
    participant: [200, 400, 404],
    researcher_owner: [200, 400, 404],
    researcher_other: [200, 400, 404],
    collector: [200, 400, 404],
    admin: [200, 400, 404]
  },
  "DELETE /api/ask/questions/[id]": {
    anonymous: [401],
    participant: [200, 404],
    researcher_owner: [200, 404],
    researcher_other: [200, 404],
    collector: [200, 404],
    admin: [200, 404]
  },
  "POST /api/ask/submit": {
    anonymous: [401],
    participant: [200, 400, 404],
    researcher_owner: [200, 400, 404],
    researcher_other: [200, 400, 404],
    collector: [200, 400, 404],
    admin: [200, 400, 404]
  },

  // Collector
  "GET /api/collector/invitations": {
    anonymous: [401],
    participant: [200],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [200],
    admin: [200]
  },
  "PATCH /api/collector/invitations": {
    anonymous: [401],
    participant: [200, 400, 404],
    researcher_owner: [200, 400, 404],
    researcher_other: [200, 400, 404],
    collector: [200, 400, 404],
    admin: [200, 400, 404]
  },
  "PATCH /api/collector/sessions/[sessionId]": {
    anonymous: [401],
    participant: [404, 403],
    researcher_owner: [404, 403],
    researcher_other: [404, 403],
    collector: [200, 404, 403],
    admin: [200, 404, 403]
  },
  "GET /api/collector/studies": {
    anonymous: [401],
    participant: [200],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [200],
    admin: [200]
  },
  "GET /api/collector/studies/[id]/sessions": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [200],
    admin: [200]
  },
  "POST /api/collector/studies/[id]/sessions": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [200],
    admin: [200]
  },

  // Canonical Studies
  "GET /api/studies": {
    anonymous: [401],
    participant: [200],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [200],
    admin: [200]
  },
  "POST /api/studies": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400, 403],
    researcher_other: [200, 400],
    collector: [403],
    admin: [200, 400]
  },
  "GET /api/studies/[id]": {
    anonymous: [200, 404],
    participant: [200, 404],
    researcher_owner: [200, 404],
    researcher_other: [200, 404],
    collector: [200, 404],
    admin: [200, 404]
  },
  "DELETE /api/studies/[id]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "GET /api/studies/[id]/collectors": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/studies/[id]/collectors": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [400],
    researcher_other: [403],
    collector: [403],
    admin: [400]
  },
  "POST /api/studies/[id]/comment": {
    anonymous: [401],
    participant: [200, 400],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [200, 400],
    admin: [200, 400]
  },
  "GET /api/studies/[id]/export": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "GET /api/studies/[id]/export/excel": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/studies/[id]/fund": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403], // CASH_PAYMENTS_DISABLED
    researcher_other: [403],
    collector: [403],
    admin: [403]
  },
  "POST /api/studies/[id]/like": {
    anonymous: [401],
    participant: [200],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [200],
    admin: [200]
  },
  "POST /api/studies/[id]/rate": {
    anonymous: [401],
    participant: [200, 400],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [200, 400],
    admin: [200, 400]
  },
  "POST /api/studies/[id]/responses": {
    anonymous: [401],
    participant: [200, 400],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [200, 400],
    admin: [200, 400]
  },
  "PATCH /api/studies/[id]/status": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },

  "GET /api/admin/ethics-board": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/admin/ethics-board": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "GET /api/admin/moderation": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "PATCH /api/admin/moderation/[id]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "GET /api/admin/studies/[id]/ethics": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "PATCH /api/admin/studies/[id]/ethics": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "POST /api/reports": {
    anonymous: [200, 400],
    participant: [200, 400],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [200, 400],
    admin: [200, 400]
  },
  "GET /api/studies/[id]/consent": {
    anonymous: [401],
    participant: [200, 404],
    researcher_owner: [200, 404],
    researcher_other: [200, 404],
    collector: [200, 404],
    admin: [200, 404]
  },
  "POST /api/studies/[id]/consent": {
    anonymous: [401],
    participant: [200, 400, 404],
    researcher_owner: [200, 400, 404],
    researcher_other: [200, 400, 404],
    collector: [200, 400, 404],
    admin: [200, 400, 404]
  },
  "GET /api/studies/[id]/translations": {
    anonymous: [200, 404],
    participant: [200, 404],
    researcher_owner: [200, 404],
    researcher_other: [200, 404],
    collector: [200, 404],
    admin: [200, 404]
  },
  "POST /api/studies/[id]/translations": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "GET /api/studies/[id]/ethics/document": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "GET /api/studies/[id]/ethics": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "POST /api/studies/[id]/ethics": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "POST /api/studies/[id]/withdraw": {
    anonymous: [401],
    participant: [200, 400, 404],
    researcher_owner: [200, 400, 404],
    researcher_other: [200, 400, 404],
    collector: [200, 400, 404],
    admin: [200, 400, 404]
  },
  "GET /api/transparency": {
    anonymous: [200],
    participant: [200],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [200],
    admin: [200]
  },
  "GET /api/user/policy-acceptance": {
    anonymous: [401],
    participant: [200],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [200],
    admin: [200]
  },
  "POST /api/user/policy-acceptance": {
    anonymous: [401],
    participant: [200, 400],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [200, 400],
    admin: [200, 400]
  },
  "GET /api/user/platform-consent": {
    anonymous: [401],
    participant: [200],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [200],
    admin: [200]
  },
  "POST /api/user/platform-consent": {
    anonymous: [401],
    participant: [200, 400],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [200, 400],
    admin: [200, 400]
  },

  "POST /api/studies/[id]/submit": {
    anonymous: [401],
    participant: [200, 400],
    researcher_owner: [403],
    researcher_other: [403],
    collector: [403],
    admin: [403]
  },

  // AI Routes
  "POST /api/ai/analyze": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [403],
    admin: [200, 400]
  },
  "POST /api/ai/chat": {
    anonymous: [401],
    participant: [200, 400],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [200, 400],
    admin: [200, 400]
  },
  "GET /api/ai/conversations": {
    anonymous: [401],
    participant: [200],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [200],
    admin: [200]
  },
  "POST /api/ai/conversations": {
    anonymous: [401],
    participant: [200, 400],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [200, 400],
    admin: [200, 400]
  },
  "GET /api/ai/conversations/[id]": {
    anonymous: [401],
    participant: [403, 404],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "PATCH /api/ai/conversations/[id]": {
    anonymous: [401],
    participant: [403, 404],
    researcher_owner: [200, 400, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "DELETE /api/ai/conversations/[id]": {
    anonymous: [401],
    participant: [403, 404],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "GET /api/ai/conversations/[id]/messages": {
    anonymous: [401],
    participant: [403, 404],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "POST /api/ai/conversations/[id]/messages": {
    anonymous: [401],
    participant: [403, 404],
    researcher_owner: [200, 400, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },

  // Forms
  "GET /api/forms": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [403],
    admin: [200]
  },
  "POST /api/forms": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [403],
    admin: [200, 400]
  },
  "GET /api/forms/[id]": {
    anonymous: [401],
    participant: [403, 404],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "PATCH /api/forms/[id]": {
    anonymous: [401],
    participant: [403, 404],
    researcher_owner: [200, 400, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "DELETE /api/forms/[id]": {
    anonymous: [401],
    participant: [403, 404],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "GET /api/forms/[id]/export": {
    anonymous: [401],
    participant: [403, 404],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "GET /api/forms/[id]/responses": {
    anonymous: [401],
    participant: [403, 404],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },

  // Projects
  "GET /api/projects": {
    anonymous: [401],
    participant: [200],
    researcher_owner: [200],
    researcher_other: [200],
    collector: [200],
    admin: [200]
  },
  "POST /api/projects": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [200, 400],
    collector: [403],
    admin: [200, 400]
  },
  "GET /api/projects/invite/[token]": {
    anonymous: [401],
    participant: [200, 404],
    researcher_owner: [200, 404],
    researcher_other: [200, 404],
    collector: [200, 404],
    admin: [200, 404]
  },
  "POST /api/projects/invite/[token]": {
    anonymous: [401],
    participant: [200, 400, 404],
    researcher_owner: [200, 400, 404],
    researcher_other: [200, 400, 404],
    collector: [200, 400, 404],
    admin: [200, 400, 404]
  },
  "GET /api/projects/[id]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "PATCH /api/projects/[id]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "DELETE /api/projects/[id]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/projects/[id]/ai": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "GET /api/projects/[id]/chat": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/projects/[id]/chat": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "GET /api/projects/[id]/decisions": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/projects/[id]/decisions": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "GET /api/projects/[id]/discussions": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/projects/[id]/discussions": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "PATCH /api/projects/[id]/discussions/[discussionId]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "DELETE /api/projects/[id]/discussions/[discussionId]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "PUT /api/projects/[id]/discussions/[discussionId]/reaction": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "DELETE /api/projects/[id]/discussions/[discussionId]/reaction": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "POST /api/projects/[id]/discussions/[discussionId]/reply": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "PUT /api/projects/[id]/discussions/[discussionId]/replies/[replyId]/reaction": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "DELETE /api/projects/[id]/discussions/[discussionId]/replies/[replyId]/reaction": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "GET /api/projects/[id]/files": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/projects/[id]/files": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "PATCH /api/projects/[id]/files/[fileId]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "DELETE /api/projects/[id]/files/[fileId]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "GET /api/projects/[id]/members": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/projects/[id]/members": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "PATCH /api/projects/[id]/members/[memberId]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "DELETE /api/projects/[id]/members/[memberId]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "GET /api/projects/[id]/milestones": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/projects/[id]/milestones": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "PATCH /api/projects/[id]/milestones/[milestoneId]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "DELETE /api/projects/[id]/milestones/[milestoneId]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "GET /api/projects/[id]/notes": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/projects/[id]/notes": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "PATCH /api/projects/[id]/notes/[noteId]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "DELETE /api/projects/[id]/notes/[noteId]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "GET /api/projects/[id]/outputs": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/projects/[id]/outputs": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "PATCH /api/projects/[id]/outputs/[outputId]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "DELETE /api/projects/[id]/outputs/[outputId]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  },
  "GET /api/projects/[id]/studies": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/projects/[id]/studies": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "DELETE /api/projects/[id]/studies": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "GET /api/projects/[id]/tasks": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200],
    researcher_other: [403],
    collector: [403],
    admin: [200]
  },
  "POST /api/projects/[id]/tasks": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400]
  },
  "PATCH /api/projects/[id]/tasks/[taskId]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 400, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 400, 404]
  },
  "DELETE /api/projects/[id]/tasks/[taskId]": {
    anonymous: [401],
    participant: [403],
    researcher_owner: [200, 404],
    researcher_other: [403],
    collector: [403],
    admin: [200, 404]
  }
};

function getDiscoveredRoutes(dir: string, base: string = 'api'): { routePath: string; method: string; filePath: string }[] {
  let routes: { routePath: string; method: string; filePath: string }[] = [];
  if (!fs.existsSync(dir)) return routes;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.join(base, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      routes = routes.concat(getDiscoveredRoutes(fullPath, relPath));
    } else if (item === 'route.ts' || item === 'route.js') {
      const routePath = '/' + base.replace(/\\/g, '/');
      const content = fs.readFileSync(fullPath, 'utf8');
      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].forEach(m => {
        if (new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b`).test(content)) {
          routes.push({ routePath, method: m, filePath: fullPath });
        }
      });
    }
  }
  return routes;
}

describe("Automated API Route Authorization Matrix (Deny by Default)", async () => {
  const apiDir = path.resolve(process.cwd(), 'app/api');
  const discoveredRoutes = getDiscoveredRoutes(apiDir, 'api');

  // Test actor users and tokens
  let participantToken: string;
  let researcherOwnerToken: string;
  let researcherOtherToken: string;
  let collectorToken: string;
  let adminToken: string;

  let sampleStudyId: string = "test-matrix-study-id";
  let sampleProjectId: string = "test-matrix-project-id";

  before(async () => {
    // Upsert test users for the matrix test
    const participantUser = await prisma.user.upsert({
      where: { email: "matrix-participant@tinat.test" },
      update: { role: UserRole.PARTICIPANT },
      create: {
        email: "matrix-participant@tinat.test",
        name: "Matrix Participant",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz012345",
        role: UserRole.PARTICIPANT,
        isVerified: true
      }
    });

    const researcherOwnerUser = await prisma.user.upsert({
      where: { email: "matrix-owner@tinat.test" },
      update: { role: UserRole.RESEARCHER },
      create: {
        email: "matrix-owner@tinat.test",
        name: "Matrix Owner",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz012345",
        role: UserRole.RESEARCHER,
        isVerified: true
      }
    });

    const researcherOtherUser = await prisma.user.upsert({
      where: { email: "matrix-other@tinat.test" },
      update: {
        role: UserRole.RESEARCHER,
        codeOfConductAcceptedAt: new Date(),
        dpaAcceptedAt: new Date(),
        codeOfConductAcceptedVersion: "2026-11-03",
        dpaAcceptedVersion: "2026-11-03",
      },
      create: {
        email: "matrix-other@tinat.test",
        name: "Matrix Other",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz012345",
        role: UserRole.RESEARCHER,
        isVerified: true,
        codeOfConductAcceptedAt: new Date(),
        dpaAcceptedAt: new Date(),
        codeOfConductAcceptedVersion: "2026-11-03",
        dpaAcceptedVersion: "2026-11-03",
      }
    });

    const collectorUser = await prisma.user.upsert({
      where: { email: "matrix-collector@tinat.test" },
      update: { role: UserRole.PARTICIPANT },
      create: {
        email: "matrix-collector@tinat.test",
        name: "Matrix Collector",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz012345",
        role: UserRole.PARTICIPANT,
        isVerified: true
      }
    });

    const adminUser = await prisma.user.upsert({
      where: { email: "matrix-admin@tinat.test" },
      update: { role: UserRole.ADMIN },
      create: {
        email: "matrix-admin@tinat.test",
        name: "Matrix Admin",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz012345",
        role: UserRole.ADMIN,
        isVerified: true
      }
    });

    participantToken = await makeToken(participantUser.id);
    researcherOwnerToken = await makeToken(researcherOwnerUser.id);
    researcherOtherToken = await makeToken(researcherOtherUser.id);
    collectorToken = await makeToken(collectorUser.id);
    adminToken = await makeToken(adminUser.id);

    // Setup sample study owned by researcherOwnerUser
    const existingStudy = await prisma.study.findFirst({
      where: { researcherId: researcherOwnerUser.id }
    });
    if (existingStudy) {
      sampleStudyId = existingStudy.id;
    } else {
      const createdStudy = await prisma.study.create({
        data: {
          title: "Matrix Test Study",
          researcherId: researcherOwnerUser.id,
          status: "DRAFT",
          fundingType: "FREE"
        }
      });
      sampleStudyId = createdStudy.id;
    }

    // Assign collectorUser to sampleStudy
    await prisma.studyDataCollector.upsert({
      where: {
        studyId_userId: { studyId: sampleStudyId, userId: collectorUser.id }
      },
      update: {},
      create: {
        studyId: sampleStudyId,
        userId: collectorUser.id
      }
    });

    // Setup sample project owned by researcherOwnerUser
    const existingProject = await prisma.researchProject.findFirst({
      where: { projectLeadId: researcherOwnerUser.id }
    });
    if (existingProject) {
      sampleProjectId = existingProject.id;
    } else {
      const createdProject = await prisma.researchProject.create({
        data: {
          title: "Matrix Test Project",
          category: "Clinical Research",
          studyDesign: "Observational",
          projectLeadId: researcherOwnerUser.id,
          visibility: "PRIVATE"
        }
      });
      sampleProjectId = createdProject.id;
    }
  });

  test("FAIL BUILD IF ROUTE MISSING: Every discovered route in app/api has an authorization entry", () => {
    assert.ok(discoveredRoutes.length > 0, "No API routes discovered");
    const missingRoutes: string[] = [];

    for (const r of discoveredRoutes) {
      const key = `${r.method} ${r.routePath}`;
      if (!ROUTE_AUTH_MATRIX[key]) {
        missingRoutes.push(key);
      }
    }

    if (missingRoutes.length > 0) {
      assert.fail(
        `FAIL BUILD: The following ${missingRoutes.length} route endpoint(s) have no entry in the ROUTE_AUTH_MATRIX:\n` +
        missingRoutes.map(m => ` - ${m}`).join('\n') +
        `\nSecurity Policy: Every API route handler must have an explicit server-side authorization declaration.`
      );
    }
    assert.strictEqual(missingRoutes.length, 0);
  });

  test("Execution Matrix: Verifies server-side authorization enforcement across all 6 actor roles", async () => {
    // Representative subset of diverse endpoints testing all 6 actor roles end-to-end
    const endpointsToExecute = [
      { key: "GET /api/admin/dashboard/stats", path: "/api/admin/dashboard/stats", method: "GET" },
      { key: "GET /api/admin/studies", path: "/api/admin/studies", method: "GET" },
      { key: "GET /api/admin/users", path: "/api/admin/users", method: "GET" },
      { key: "GET /api/auth/admin/withdrawals", path: "/api/auth/admin/withdrawals", method: "GET" },
      { key: "GET /api/studies", path: "/api/studies", method: "GET" },
      { key: "POST /api/studies", path: "/api/studies", method: "POST" },
      { key: "GET /api/studies/[id]/collectors", path: `/api/studies/${sampleStudyId}/collectors`, method: "GET" },
      { key: "GET /api/studies/[id]/export", path: `/api/studies/${sampleStudyId}/export`, method: "GET" },
      { key: "POST /api/studies/[id]/fund", path: `/api/studies/${sampleStudyId}/fund`, method: "POST" },
      { key: "POST /api/auth/withdrawals", path: "/api/auth/withdrawals", method: "POST" },
      { key: "GET /api/collector/studies/[id]/sessions", path: `/api/collector/studies/${sampleStudyId}/sessions`, method: "GET" },
      { key: "GET /api/projects/[id]", path: `/api/projects/${sampleProjectId}`, method: "GET" },
      { key: "POST /api/projects/[id]/chat", path: `/api/projects/${sampleProjectId}/chat`, method: "POST" },
      { key: "GET /api/projects/[id]/files", path: `/api/projects/${sampleProjectId}/files`, method: "GET" }
    ];

    const roles: { role: RoleCategory; getToken: () => string | null }[] = [
      { role: 'anonymous', getToken: () => null },
      { role: 'participant', getToken: () => participantToken },
      { role: 'researcher_owner', getToken: () => researcherOwnerToken },
      { role: 'researcher_other', getToken: () => researcherOtherToken },
      { role: 'collector', getToken: () => collectorToken },
      { role: 'admin', getToken: () => adminToken },
    ];

    let passedChecks = 0;

    for (const ep of endpointsToExecute) {
      const rule = ROUTE_AUTH_MATRIX[ep.key];
      assert.ok(rule, `Rule missing for ${ep.key}`);

      const relPath = ep.key.split(' ')[1].replace(/\[([^\]]+)\]/g, '[$1]');
      const modulePath = path.resolve(process.cwd(), 'app', relPath.replace(/^\//, ''), 'route.ts');
      const routeModule = await import('file:///' + modulePath.replace(/\\/g, '/'));
      const handler = routeModule[ep.method];
      assert.ok(typeof handler === 'function', `Handler not found for ${ep.method} in ${modulePath}`);

      for (const { role, getToken } of roles) {
        const token = getToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const req = new Request(`http://localhost:3000${ep.path}`, {
          method: ep.method,
          headers,
          body: (ep.method === 'POST' || ep.method === 'PATCH' || ep.method === 'PUT') ? JSON.stringify({}) : undefined
        });

        // Resolve mock params
        const paramsObj: Record<string, string> = {};
        if (ep.path.includes(sampleStudyId)) paramsObj['id'] = sampleStudyId;
        if (ep.path.includes(sampleProjectId)) paramsObj['id'] = sampleProjectId;

        const res = await handler(req, { params: Promise.resolve(paramsObj) });
        const expectedStatuses = rule[role];

        assert.ok(
          expectedStatuses.includes(res.status),
          `Status mismatch on ${ep.key} for actor role '${role}': expected [${expectedStatuses.join(', ')}], got ${res.status}`
        );
        passedChecks++;
      }
    }

    console.log(`Successfully verified ${passedChecks} live matrix assertions across all 6 actor roles.`);
  });
});
