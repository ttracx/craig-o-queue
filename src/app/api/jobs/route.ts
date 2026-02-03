import { NextResponse } from "next/server";
import { getSession, isPro } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createJob } from "@/lib/queue";

export async function GET(req: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queueId = searchParams.get("queueId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const jobs = await prisma.job.findMany({
      where: {
        userId: user.id,
        ...(queueId && { queueId }),
        ...(status && { status: status as any }),
      },
      include: {
        queue: { select: { name: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: limit,
      skip: offset,
    });

    const total = await prisma.job.count({
      where: {
        userId: user.id,
        ...(queueId && { queueId }),
        ...(status && { status: status as any }),
      },
    });

    return NextResponse.json({ jobs, total });
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json({ error: "Failed to get jobs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, queueId, payload, priority, scheduledAt, maxRetries, webhookUrl } = await req.json();

    if (!name || !queueId || !payload) {
      return NextResponse.json({ error: "Name, queueId, and payload are required" }, { status: 400 });
    }

    // Verify queue ownership
    const queue = await prisma.queue.findFirst({
      where: { id: queueId, userId: user.id },
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    // Check limits for free users
    if (!isPro(user)) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const jobCount = await prisma.job.count({
        where: {
          userId: user.id,
          createdAt: { gte: startOfMonth },
        },
      });

      if (jobCount >= 100) {
        return NextResponse.json(
          { error: "Free plan limited to 100 jobs/month. Upgrade to Pro for unlimited jobs." },
          { status: 403 }
        );
      }

      if (priority && priority > 0) {
        return NextResponse.json(
          { error: "Priority queues require Pro plan" },
          { status: 403 }
        );
      }
    }

    const job = await createJob({
      name,
      queueId,
      userId: user.id,
      payload,
      priority: priority ?? 0,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      maxRetries,
      webhookUrl,
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Create job error:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
