import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startJob, completeJob, failJob, cancelJob, updateJobProgress } from "@/lib/queue";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.job.findFirst({
      where: { id, userId: user.id },
      include: {
        queue: { select: { name: true } },
        logs: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Get job error:", error);
    return NextResponse.json({ error: "Failed to get job" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action, progress, result, error } = await req.json();

    // Verify ownership
    const job = await prisma.job.findFirst({
      where: { id, userId: user.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    switch (action) {
      case "start":
        await startJob(id);
        break;
      case "complete":
        await completeJob(id, result);
        break;
      case "fail":
        await failJob(id, error || "Job failed");
        break;
      case "cancel":
        await cancelJob(id);
        break;
      case "progress":
        if (typeof progress === "number") {
          await updateJobProgress(id, progress);
        }
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update job error:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.job.deleteMany({
      where: { id, userId: user.id },
    });

    if (job.count === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete job error:", error);
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}
