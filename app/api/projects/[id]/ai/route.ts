import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeProjectAccess } from "@/lib/projects/auth";
import { executeAIChat } from "@/lib/ai/models";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { auth, error, status } = await authorizeProjectAccess(projectId);
    if (!auth) {
      return NextResponse.json({ error: error || "Access denied" }, { status: status || 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { message, action, history = [], model } = body;

    // Fetch comprehensive project context
    const project = await prisma.researchProject.findUnique({
      where: { id: projectId },
      include: {
        lead: { select: { name: true, email: true } },
        members: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        milestones: { orderBy: { order: "asc" } },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            phase: true,
            dueDate: true,
            assignee: { select: { name: true } },
          },
        },
        decisions: {
          orderBy: { decisionNumber: "asc" },
          include: { madeBy: { select: { name: true } } },
        },
        outputs: true,
        linkedStudies: {
          include: {
            study: {
              select: {
                title: true,
                status: true,
                _count: { select: { responses: true, questions: true } },
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Format tasks summary
    const completedTasks = project.tasks.filter((t) => t.status === "COMPLETED").length;
    const inProgressTasks = project.tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const todoTasks = project.tasks.filter((t) => t.status === "TODO").length;
    const blockedTasks = project.tasks.filter((t) => t.status === "BLOCKED").length;

    // Construct grounded project context document
    const contextPrompt = `
=== PROJECT GROUND TRUTH DATA ===
Title: ${project.title}
Study Design: ${project.studyDesign}
Category: ${project.category}
Current Phase: ${project.currentPhase}
Status: ${project.status}
Principal Investigator / Lead: ${project.lead.name}
Institution: ${project.institution || "Not specified"}

Team Members (${project.members.length}):
${project.members.map((m) => `- ${m.user.name} (${m.role}): ${m.title || "Team Member"}`).join("\n")}

Milestones (${project.milestones.length}):
${project.milestones.map((m) => `- [${m.isCompleted ? "COMPLETED" : "PENDING"}] ${m.title} (Phase: ${m.phase}, Deadline: ${m.deadline ? new Date(m.deadline).toLocaleDateString() : "Flexible"})`).join("\n")}

Tasks Summary:
Total: ${project.tasks.length} | Done: ${completedTasks} | In Progress: ${inProgressTasks} | To-Do: ${todoTasks} | Blocked: ${blockedTasks}
Key Active Tasks:
${project.tasks.slice(0, 10).map((t) => `- [${t.status}] ${t.title} (${t.priority} priority, Assigned: ${t.assignee?.name || "Unassigned"})`).join("\n")}

Methodological Decision Log (${project.decisions.length} recorded):
${project.decisions.map((d) => `#${d.decisionNumber} [${d.status}]: "${d.decision}" (Reason: ${d.reason || "None specified"}, By: ${d.madeBy.name})`).join("\n")}

Linked Data-Collection Studies (${project.linkedStudies.length}):
${project.linkedStudies.map((ls) => `- "${ls.study.title}" (${ls.study.status}, ${ls.study._count.responses} participant responses collected, ${ls.study._count.questions} questions)`).join("\n")}

Research Deliverables & Outputs (${project.outputs.length}):
${project.outputs.map((o) => `- ${o.title} [${o.type} - ${o.status}] (Target: ${o.targetJournal || "TBD"})`).join("\n")}
=== END PROJECT DATA ===
`;

    let userQuery = message?.trim() || "";

    if (action === "SUMMARIZE_STATUS") {
      userQuery = "Generate a structured, professional executive summary of this project's current status for the Principal Investigator and stakeholders. Include: (1) Key accomplishments, (2) Current blockers or lagging milestones, (3) Data collection status, and (4) Recommended immediate next actions.";
    } else if (action === "CHECK_ETHICS_GAPS") {
      userQuery = "Audit this project's ethical, regulatory, and methodological readiness. Check IRB/Ethics approval status, sensitive data segregation, informed consent readiness, and adherence to relevant reporting guidelines (e.g. STROBE for observational, CONSORT for trials, PRISMA for reviews).";
    } else if (action === "GENERATE_MANUSCRIPT_OUTLINE") {
      userQuery = "Generate a publication-grade manuscript outline (IMRAD format) tailored to our project template and methodological decisions recorded so far. Provide specific section prompts and guidance for the authors.";
    } else if (action === "DRAFT_TASK_BREAKDOWN") {
      userQuery = "Review our current phase and milestones, and propose a concrete, prioritized list of 5-8 actionable research tasks we should add next to accelerate our progress.";
    }

    if (!userQuery) {
      return NextResponse.json({ error: "Message or action is required" }, { status: 400 });
    }

    const systemInstruction = `
You are the Tinat Medical & Health Project AI Assistant, an expert in clinical epidemiology, health sciences research methodology, biostatistics, academic publishing, and ethical research governance.

GUIDELINES:
1. Ground your answers strictly on the verified project state provided.
2. Structure your answers clearly with markdown headings, bullet points, and callouts.
3. Explicitly distinguish:
   - **[FACT]**: Verified project state from the ground truth data above.
   - **[SUGGESTION]**: Evidence-based methodological or operational recommendations.
   - **[CAUTION]**: Regulatory, ethics, or timeline risks to be aware of.
4. Uphold medical research standards (IRB/IEC approval, GCP, Declaration of Helsinki, STROBE/CONSORT/PRISMA guidelines).
5. Never invent participant clinical numbers or fake statistical findings.
`;

    const chatMessages: Array<{ role: "user" | "model" | "assistant"; content: string }> = [
      ...history.map((h: any) => ({
        role: h.role === "assistant" ? ("model" as const) : ("user" as const),
        content: String(h.content),
      })),
      { role: "user" as const, content: `${contextPrompt}\n\nUser Question:\n${userQuery}` },
    ];

    const aiResult = await executeAIChat({
      modelId: model || "gemini",
      systemPrompt: systemInstruction,
      messages: chatMessages,
    });

    return NextResponse.json({
      reply: aiResult.content,
      modelUsed: aiResult.modelUsed,
      groundedStats: {
        totalMilestones: project.milestones.length,
        totalTasks: project.tasks.length,
        completedTasks,
        decisionsLogged: project.decisions.length,
        linkedStudiesCount: project.linkedStudies.length,
      },
    });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/ai error:", error);
    return NextResponse.json(
      { error: "Failed to process AI request", details: error.message },
      { status: 500 }
    );
  }
}
