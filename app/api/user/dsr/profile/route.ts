import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";
import { validateBody, jsonError } from "@/lib/validation";

const RectifySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional().nullable(),
  institution: z.string().optional().nullable(),
  fieldOfStudy: z.string().optional().nullable(),
  yearOfStudy: z.number().int().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
});

/**
 * Data Subject Right: Right to Rectification (Proclamation 1321/2024 Art. 22)
 * Allows authenticated user to correct and update personal demographic data.
 */
export async function PUT(request: Request) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const validation = await validateBody(RectifySchema, request);
    if (!validation.ok) return validation.response;

    const updateData = validation.data;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        institution: true,
        fieldOfStudy: true,
        yearOfStudy: true,
        bio: true,
        updatedAt: true,
      },
    });

    // Record RECTIFICATION request
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.dataSubjectRequest.create({
      data: {
        userId: user.id,
        type: "RECTIFICATION",
        status: "COMPLETED",
        reason: "User updated demographic profile details",
        dueDate,
        completedAt: new Date(),
        details: { updatedFields: Object.keys(updateData) },
      },
    });

    await logActivity({
      userId: user.id,
      action: "DATA_SUBJECT_RECTIFICATION",
      description: `User ${user.name} corrected profile attributes under Proclamation 1321/2024.`,
      resourceId: user.id,
      resourceType: "User",
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Personal profile details updated successfully.",
    });
  } catch (error) {
    console.error("DSR rectification error:", error);
    return jsonError("Failed to update profile", 500);
  }
}
